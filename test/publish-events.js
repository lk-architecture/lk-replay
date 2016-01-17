import {reject, resolve} from "bluebird";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import {range} from "ramda";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import publishEvents from "../src/publish-events";
import makeFaultTolerant from "../src/utils/make-fault-tolerant";

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("publishEvents", () => {

    const kinesis = {};
    const log = {
        info: sinon.spy(),
        debug: sinon.spy()
    };
    const originalRetry = makeFaultTolerant.__get__("retry");
    const retry = function (fn) {
        return originalRetry.call(this, fn, {interval: 1});
    };

    before(() => {
        publishEvents.__Rewire__("kinesis", kinesis);
        publishEvents.__Rewire__("log", log);
        makeFaultTolerant.__Rewire__("retry", retry);
    });
    after(() => {
        publishEvents.__ResetDependency__("kinesis");
        publishEvents.__ResetDependency__("log");
        makeFaultTolerant.__ResetDependency__("retry");
    });
    beforeEach(() => {
        log.info.reset();
    });

    describe("sequentially puts batches of 250 records into kinesis", () => {

        it("sequentiality", () => {
            const invocations = [];
            kinesis.putRecordsAsync = sinon.spy(() => {
                const now = process.hrtime();
                // Push time in nanoseconds
                invocations.push(now[0] * 1e9 + now[1]);
                return resolve();
            });
            const readings = range(0, 5000).map(idx => ({
                id: idx,
                source: {
                    kinesisPartitionKey: idx
                }
            }));
            return publishEvents("streamName", readings).then(() => {
                invocations
                    .map((date, idx) => (
                        idx === 0 ? 0 : date - invocations[idx - 1]
                    ))
                    .forEach(delta => {
                        expect(delta).to.be.gte(0);
                    });
            });
        });

        it("batch size", () => {
            kinesis.putRecordsAsync = sinon.stub().returns(resolve(null));
            const readings = range(0, 5000).map(idx => ({
                id: idx,
                source: {
                    kinesisPartitionKey: idx
                }
            }));
            return publishEvents("streamName", readings).then(() => {
                expect(kinesis.putRecordsAsync).to.have.callCount(20);
                range(0, 20)
                    .map(idx => kinesis.putRecordsAsync.getCall(idx))
                    .forEach(call => {
                        expect(call.args[0].Records.length).to.equal(250);
                    });
            });
        });

        it("correct invocation", () => {
            const invocationsArgs = [];
            kinesis.putRecordsAsync = sinon.spy(arg => {
                invocationsArgs.push(arg);
                return resolve();
            });
            const readings = range(0, 5000).map(idx => ({
                id: idx,
                source: {
                    kinesisPartitionKey: idx
                }
            }));
            return publishEvents("streamName", readings)
                .then(() => invocationsArgs.forEach((arg, sliceIndex) => {
                    expect(arg).to.deep.equal({
                        Records: range(sliceIndex * 250, (sliceIndex + 1) * 250).map(idx => ({
                            Data: JSON.stringify({
                                id: idx,
                                source: {
                                    kinesisPartitionKey: idx
                                }
                            }),
                            PartitionKey: idx
                        })),
                        StreamName: "streamName"
                    });
                }));
        });

    });

    describe("retries on errors", () => {

        it("CASE: error on first invocation, success on second", () => {
            var count = 0;
            kinesis.putRecordsAsync = () => {
                count += 1;
                return (count % 2 === 0 ? resolve() : reject(new Error()));
            };
            const readings = range(0, 5000).map(idx => ({
                id: idx,
                source: {
                    kinesisPartitionKey: idx
                }
            }));
            return publishEvents("streamName", readings).then(() => {
                expect(count).to.equal(20 * 2);
            });
        });

        it("CASE: error on first two invocations, success on third", () => {
            var count = 0;
            kinesis.putRecordsAsync = () => {
                count += 1;
                return (count % 3 === 0 ? resolve() : reject(new Error()));
            };
            const readings = range(0, 5000).map(idx => ({
                id: idx,
                source: {
                    kinesisPartitionKey: idx
                }
            }));
            return publishEvents("streamName", readings).then(() => {
                expect(count).to.equal(20 * 3);
            });
        });

    });

    it("logs retries", () => {
        var count = 0;
        kinesis.putRecordsAsync = () => {
            count += 1;
            return (count % 2 === 0 ? resolve() : reject(new Error()));
        };
        const readings = range(0, 1500).map(idx => ({
            id: idx,
            source: {
                kinesisPartitionKey: idx
            }
        }));
        return publishEvents("streamName", readings).then(() => {
            expect(count).to.equal(6 * 2);
            expect(log.info).to.have.callCount(6);
        });
    });

    it("fails on too many errors", () => {
        kinesis.putRecordsAsync = sinon.stub().returns(reject(new Error()));
        const readings = range(0, 1500).map(idx => ({
            id: idx,
            source: {
                kinesisPartitionKey: idx
            }
        }));
        const promise = publishEvents("streamName", readings);
        return expect(promise).to.be.rejectedWith(/Error: operation timed out/);
    });

    describe("when events have no `source.kinesisPartitionKey`", () => {

        afterEach(() => {
            publishEvents.__ResetDependency__("SOURCESLESS_USE_RANDOM_PARTITION_KEY");
            publishEvents.__ResetDependency__("v4");
        });

        it("uses a random PartitionKey if env SOURCESLESS_USE_RANDOM_PARTITION_KEY=true", () => {
            publishEvents.__Rewire__("v4", () => "uuid");
            publishEvents.__Rewire__("SOURCESLESS_USE_RANDOM_PARTITION_KEY", true);
            kinesis.putRecordsAsync = sinon.stub().returns(resolve());
            const readings = [{id: "1"}];
            return publishEvents("streamName", readings)
                .then(() => {
                    expect(kinesis.putRecordsAsync).to.have.been.calledWith({
                        Records: [{
                            Data: JSON.stringify({id: "1"}),
                            PartitionKey: "uuid"
                        }],
                        StreamName: "streamName"
                    });
                });
        });

        it("uses __partition_key__ otherwise", () => {
            kinesis.putRecordsAsync = sinon.stub().returns(resolve());
            const readings = [{id: "1"}];
            return publishEvents("streamName", readings)
                .then(() => {
                    expect(kinesis.putRecordsAsync).to.have.been.calledWith({
                        Records: [{
                            Data: JSON.stringify({id: "1"}),
                            PartitionKey: "__partition_key__"
                        }],
                        StreamName: "streamName"
                    });
                });
        });

    });

});
