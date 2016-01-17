import bunyan from "bunyan";
import {identity} from "ramda";

import {LOG_LEVEL, NODE_ENV} from "../config";

const log = bunyan.createLogger({
    name: "lk-replay",
    streams: [
        NODE_ENV !== "test" ? {
            stream: process.stdout
        } : null
    ].filter(identity)
});
log.level(LOG_LEVEL);
export default log;
