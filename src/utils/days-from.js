import moment from "moment";
import {range} from "ramda";

import {DATE_FORMAT} from "../config";

const oneDayInMs = moment.duration(1, "day").asMilliseconds();

export default function daysFrom (date) {
    const from = moment(date).startOf("day").valueOf();
    const to = moment().startOf("day").valueOf();
    const days = (to - from) / oneDayInMs;
    return range(0, days).map(delta => (
        moment(from).add(delta, "days").format(DATE_FORMAT)
    ));
}
