import "babel-polyfill";
import {mapSeries} from "bluebird";
import moment from "moment";

// import log from "./services/logger";
import {DATE_FORMAT} from "./config";
import daysFrom from "./utils/days-from";
import publishEvents from "./publish-events";
import retrieveEventsByDirectory from "./retrieve-events-by-directory";

export default function replay ({bucket, startDate, stream}) {
    const days = daysFrom(
        moment(startDate, DATE_FORMAT)
    );
    const directories = days.map(day => `${day.replace(/-/g, "/")}/`);
    return mapSeries(directories, async directory => {
        const events = await retrieveEventsByDirectory(bucket, directory);
        return publishEvents(stream, events);
    });
}
