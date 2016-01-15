import {resolve} from "bluebird";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import retrieveEventsByDirectory from "../src/retrieve-events-by-directory";

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("retrieveEventsByDirectory", () => {

    const getObject = sinon.spy((bucket, key) => resolve({
        Body: JSON.stringify({id: key})
    }));
    const listObjects = sinon.spy(() => resolve([
        "key_0", "key_1", "key_2", "key_3", "key_4"
    ]));

    before(() => {
        retrieveEventsByDirectory.__Rewire__("getObject", getObject);
        retrieveEventsByDirectory.__Rewire__("listObjects", listObjects);
    });
    after(() => {
        retrieveEventsByDirectory.__ResetDependency__("getObject");
        retrieveEventsByDirectory.__ResetDependency__("listObjects");
    });
    beforeEach(() => {
        getObject.reset();
        listObjects.reset();
    });

    it("returns all events in the directory", () => {
        return retrieveEventsByDirectory("bucket", "directory")
            .then(events => {
                expect(events).to.have.length(5);
            });
    });

    it("returns parsed events", () => {
        return retrieveEventsByDirectory("bucket", "directory")
            .then(events => {
                expect(events).to.deep.equal([
                    {id: "key_0"},
                    {id: "key_1"},
                    {id: "key_2"},
                    {id: "key_3"},
                    {id: "key_4"}
                ]);
            });
    });

    it("correctly calls listObjects", () => {
        return retrieveEventsByDirectory("bucket", "directory")
            .then(() => {
                expect(listObjects).to.have.callCount(1);
                expect(listObjects).to.have.been.calledWith("bucket", "directory");
            });
    });

    it("correctly calls getObject", () => {
        return retrieveEventsByDirectory("bucket", "directory")
            .then(() => {
                expect(getObject).to.have.callCount(5);
                expect(getObject).to.have.been.calledWith("bucket", "key_0");
                expect(getObject).to.have.been.calledWith("bucket", "key_1");
                expect(getObject).to.have.been.calledWith("bucket", "key_2");
                expect(getObject).to.have.been.calledWith("bucket", "key_3");
                expect(getObject).to.have.been.calledWith("bucket", "key_4");
            });
    });

});
