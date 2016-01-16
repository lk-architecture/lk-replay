import {mapSeries} from "bluebird";
import {head, last, splitEvery} from "ramda";

import kinesis from "./services/kinesis";
import log from "./services/logger";
import makeFaultTolerant from "./utils/make-fault-tolerant";
import timer from "./utils/timer";

function publishSlice (streamName) {
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
                PartitionKey: event.source.kinesisPartitionKey
            })),
            StreamName: streamName
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

export default function publishEvents (streamName, events) {
    const slices = splitEvery(250, events);
    const faultTolerantPublishSlice = makeFaultTolerant(
        publishSlice(streamName)
    );
    return mapSeries(slices, faultTolerantPublishSlice);
}
