import {mapSeries} from "bluebird";
import {v4} from "node-uuid";
import {has, head, last, splitEvery} from "ramda";

import {SOURCESLESS_USE_RANDOM_PARTITION_KEY} from "./config";
import getKinesisClient from "./services/kinesis";
import log from "./services/logger";
import makeFaultTolerant from "./utils/make-fault-tolerant";
import timer from "./utils/timer";

function getPartitionKey (event) {
    return (
        event.source && has("kinesisPartitionKey", event.source) ?
        event.source.kinesisPartitionKey :
        SOURCESLESS_USE_RANDOM_PARTITION_KEY ? v4() : "__partition_key__"
    );
}

function publishSlice (stream) {
    const kinesis = getKinesisClient(stream);
    /*
    *   Using async/await instead of a promise chain in the following function
    *   leaves an unhandled promise somewhere between the retries which produces
    *   unwanted console logs when the function fails. Note that the failing
    *   promise is indeed handled, in fact the behaviour does not change, as
    *   unit tests can confirm.
    */
    return events => {
        const getElapsed = timer();
        const records = {
            Records: events.map(event => ({
                Data: JSON.stringify(event),
                PartitionKey: getPartitionKey(event)
            })),
            StreamName: stream.name
        };
        return kinesis.putRecordsAsync(records)
            .then(result => {
                log.debug(
                    `Published ${events.length} events ${getElapsed()}ms`
                );
                return result;
            })
            .catch(error => {
                // Log errors and rethrow them
                log.info(error,
                    `Publishing slice from ${head(events).id} to ${last(events).id} failed after ${getElapsed()}ms`
                );
                throw error;
            });
    };
}

export default function publishEvents (stream, events) {
    const slices = splitEvery(250, events);
    const faultTolerantPublishSlice = makeFaultTolerant(
        publishSlice(stream)
    );
    return mapSeries(slices, faultTolerantPublishSlice);
}
