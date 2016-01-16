import "babel-polyfill";
import {mapSeries} from "bluebird";
import {sort} from "ramda";

import {DATE_FORMAT} from "./config";
import log from "./services/logger";
import byDate from "./utils/sort-events-by-date";
import daysFrom from "./utils/days-from";
import timer from "./utils/timer";
import publishEvents from "./publish-events";
import retrieveEventsByDirectory from "./retrieve-events-by-directory";

export default function replay (options) {
    const {bucket, startDate, stream} = options;
    log.info(
        `Replaying events from ${startDate.format(DATE_FORMAT)}`
    );
    const days = daysFrom(startDate);
    const directories = days.map(day => `${day.replace(/-/g, "/")}/`);
    return mapSeries(directories, async directory => {
        const getElapsed = timer();
        const events = await retrieveEventsByDirectory(bucket, directory);
        const timeOrderedEvents = sort(byDate, events);
        log.info(
            `Retrieved ${events.length} events from directory ${directory} in ${getElapsed()}ms`
        );
        const result = await publishEvents(stream, timeOrderedEvents);
        log.info(
            `Published ${events.length} events from directory ${directory} in ${getElapsed()}ms`
        );
        return result;
    });
}
