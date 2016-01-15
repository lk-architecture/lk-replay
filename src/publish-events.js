import {mapSeries} from "bluebird";
import retry from "bluebird-retry";
import {splitEvery} from "ramda";

import kinesis from "./services/kinesis";
import log from "./services/logger";

function publishSlice (streamName) {
    return events => kinesis.putRecordsAsync({
        Records: events.map(event => ({
            Data: JSON.stringify(event),
            PartitionKey: event.source.kinesisPartitionKey
        })),
        StreamName: streamName
    });
}

function faultTolerantPublishSlice (streamName) {
    const _publishSlice = publishSlice(streamName);
    return (...args) => retry(() =>
        _publishSlice(...args)
            // Log errors and rethrow them
            .catch(error => {
                log.info(error);
                throw error;
            })
    );
}

export default function publishEvents (streamName, events) {
    const slices = splitEvery(250, events);
    return mapSeries(slices, faultTolerantPublishSlice(streamName));
}
