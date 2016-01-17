#!/usr/bin/env node

import assert from "assert";
import moment from "moment";
import {isJSON} from "validator";
import yargs from "yargs";

import {DATE_FORMAT} from "../config";
import replay from "../replay";

const argv = yargs
    .help("help")
    .wrap(100)
    .usage("Usage: $0 <options>")
    .option("bucket", {
        demand: true,
        describe: "Events bucket",
        type: "string"
    })
    .option("filter", {
        default: "{}",
        describe: "Events filter",
        type: "string"
    })
    .option("startDate", {
        demand: true,
        describe: "Replay start date",
        type: "string"
    })
    .option("streamName", {
        demand: true,
        describe: "Target kinesis stream name",
        type: "string"
    })
    .option("streamRegion", {
        demand: true,
        describe: "Target kinesis stream region",
        type: "string"
    })
    .check(argv => {
        assert(
            isJSON(argv.filter),
            "filter must be valid json string"
        );
        assert(
            moment(argv.startDate, DATE_FORMAT, true).isValid(),
            "startDate must be valid date string"
        );
        return true;
    })
    .argv;

replay({
    bucket: argv.bucket,
    filter: argv.filter,
    startDate: moment(argv.startDate, DATE_FORMAT),
    stream: {
        name: argv.streamName,
        region: argv.streamRegion
    }
});
