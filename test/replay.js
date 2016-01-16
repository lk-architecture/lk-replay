import {resolve} from "bluebird";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import moment from "moment";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import replay from "../src/replay";

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("replay", () => {

    const daysFrom = sinon.spy(() => [
        "2015-01-01",
        "2015-01-02",
        "2015-01-03",
        "2015-01-04",
        "2015-01-05"
    ]);
    const publishEvents = sinon.spy();
    const retrieveEventsByDirectory = sinon.spy((bucket, directory) => resolve([
        {id: `${directory}_1`},
        {id: `${directory}_2`},
        {id: `${directory}_3`},
        {id: `${directory}_4`},
        {id: `${directory}_5`}
    ]));

    before(() => {
        replay.__Rewire__("daysFrom", daysFrom);
        replay.__Rewire__("publishEvents", publishEvents);
        replay.__Rewire__("retrieveEventsByDirectory", retrieveEventsByDirectory);
    });
    after(() => {
        replay.__ResetDependency__("daysFrom");
        replay.__ResetDependency__("publishEvents");
        replay.__ResetDependency__("retrieveEventsByDirectory");
    });

    describe("retieves events by day and then publishes them", () => {

        beforeEach(() => {
            daysFrom.reset();
            publishEvents.reset();
            retrieveEventsByDirectory.reset();
        });

        it("daysFrom called correctly", async () => {
            await replay({
                bucket: "bucket",
                startDate: moment("2015-01-01", "YYYY-MM-DD"),
                stream: "stream"
            });
            expect(daysFrom).to.have.callCount(1);
            expect(
                daysFrom.getCall(0).args[0].format("YYYY-MM-DD")
            ).to.equal("2015-01-01");
        });

        it("retrieveEventsByDirectory called correctly", async () => {
            await replay({
                bucket: "bucket",
                startDate: moment("2015-01-01", "YYYY-MM-DD"),
                stream: "stream"
            });
            expect(retrieveEventsByDirectory).to.have.callCount(5);
            expect(retrieveEventsByDirectory).to.have.been.calledWith(
                "bucket", "2015/01/01/"
            );
            expect(retrieveEventsByDirectory).to.have.been.calledWith(
                "bucket", "2015/01/02/"
            );
            expect(retrieveEventsByDirectory).to.have.been.calledWith(
                "bucket", "2015/01/03/"
            );
            expect(retrieveEventsByDirectory).to.have.been.calledWith(
                "bucket", "2015/01/04/"
            );
            expect(retrieveEventsByDirectory).to.have.been.calledWith(
                "bucket", "2015/01/05/"
            );
        });

        it("publishEvents called correctly", async () => {
            await replay({
                bucket: "bucket",
                startDate: moment("2015-01-01", "YYYY-MM-DD"),
                stream: "stream"
            });
            expect(publishEvents).to.have.callCount(5);
            expect(publishEvents).to.have.been.calledWith("stream", [
                {id: "2015/01/01/_1"},
                {id: "2015/01/01/_2"},
                {id: "2015/01/01/_3"},
                {id: "2015/01/01/_4"},
                {id: "2015/01/01/_5"}
            ]);
            expect(publishEvents).to.have.been.calledWith("stream", [
                {id: "2015/01/02/_1"},
                {id: "2015/01/02/_2"},
                {id: "2015/01/02/_3"},
                {id: "2015/01/02/_4"},
                {id: "2015/01/02/_5"}
            ]);
            expect(publishEvents).to.have.been.calledWith("stream", [
                {id: "2015/01/03/_1"},
                {id: "2015/01/03/_2"},
                {id: "2015/01/03/_3"},
                {id: "2015/01/03/_4"},
                {id: "2015/01/03/_5"}
            ]);
            expect(publishEvents).to.have.been.calledWith("stream", [
                {id: "2015/01/04/_1"},
                {id: "2015/01/04/_2"},
                {id: "2015/01/04/_3"},
                {id: "2015/01/04/_4"},
                {id: "2015/01/04/_5"}
            ]);
            expect(publishEvents).to.have.been.calledWith("stream", [
                {id: "2015/01/05/_1"},
                {id: "2015/01/05/_2"},
                {id: "2015/01/05/_3"},
                {id: "2015/01/05/_4"},
                {id: "2015/01/05/_5"}
            ]);
        });

    });

});
