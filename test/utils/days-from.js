import {expect} from "chai";
import moment from "moment";
import sinon from "sinon";

import daysFrom from "../../src/utils/days-from";

describe("daysFrom", () => {

    describe("returns a list of days from the input date to the current date", () => {

        var clock;
        before(() => {
            clock = sinon.useFakeTimers(
                new Date("2016-01-01").getTime()
            );
        });
        after(() => {
            clock.restore();
        });

        it("correct format", () => {
            const result = daysFrom(new Date("2015-12-25"));
            expect(result).to.deep.equal([
                "2015-12-25",
                "2015-12-26",
                "2015-12-27",
                "2015-12-28",
                "2015-12-29",
                "2015-12-30",
                "2015-12-31"
            ]);
        });

        it("correct length", function () {
            this.timeout(0);
            const result = daysFrom(new Date("1900-01-01"));
            expect(result).to.have.length(
                // (days in normal year * years) + leap days
                365 * (2016 - 1900) + 28
            );
        });

        it("uniqueness", function () {
            this.timeout(0);
            const result = daysFrom(new Date("1900-01-01"));
            const dayMap = {};
            var allUnique = true;
            result.forEach(day => {
                if (dayMap[day]) {
                    allUnique = false;
                }
                dayMap[day] = true;
            });
            expect(allUnique).to.equal(true);
        });

        it("validity", function () {
            this.timeout(0);
            const result = daysFrom(new Date("1900-01-01"));
            result.forEach(day => {
                const isValid = moment(day, "YYYY-MM-DD", true).isValid();
                expect(isValid).to.equal(true);
            });
        });

        it("monotonic progression [TEST with valueOf sorting]", function () {
            this.timeout(0);
            const result = daysFrom(new Date("1900-01-01"));
            result.forEach((day, idx) => {
                if (idx === 0) {
                    return;
                }
                const current = moment(day, "YYYY-MM-DD").valueOf();
                const previous = moment(result[idx - 1], "YYYY-MM-DD").valueOf();
                expect(current).to.be.gt(previous);
            });
        });

        it("monotonic progression [TEST with alphabetical sorting]", function () {
            this.timeout(0);
            const result = daysFrom(new Date("1900-01-01"));
            const sortedResult = result.slice(0).sort();
            result.forEach((day, idx) => {
                expect(result[idx]).to.equal(sortedResult[idx]);
            });
        });

    });

});
