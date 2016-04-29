import {map} from "bluebird";

import {GET_OBJECT_CONCURRENCY} from "./config";
import {getObject, listObjects} from "./services/s3";
import log from "./services/logger";
import timer from "./utils/timer";

export default async function retrieveEventsByDirectory (bucket, directory) {
    const getElapsed = timer();
    const keys = (await listObjects(bucket, directory))
        // Filter out the directory object, if present
        .filter(key => key !== directory);
    log.debug(
        `Retrieved ${keys.length} keys from directory ${directory} in ${getElapsed()}ms`
    );
    return map(keys, async key => {
        const getElapsed = timer();
        const {Body} = await getObject(bucket, key);
        log.debug(
            `Retrieved object ${key} in ${getElapsed()}ms`
        );
        return JSON.parse(Body.toString());
    }, {concurrency: GET_OBJECT_CONCURRENCY});
}
