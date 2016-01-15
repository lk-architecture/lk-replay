import bunyan from "bunyan";
import {identity} from "ramda";

import * as config from "../config";

export default bunyan.createLogger({
    name: "lk-replay",
    streams: [
        config.NODE_ENV !== "test" ? {
            stream: process.stdout
        } : null
    ].filter(identity)
});
