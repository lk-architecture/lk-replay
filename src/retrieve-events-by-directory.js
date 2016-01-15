import {map} from "bluebird";

import {GET_OBJECT_CONCURRENCY} from "./config";
import {getObject, listObjects} from "./services/s3";
import log from "./services/logger";

export default async function retrieveEventsByDirectory (bucket, directory) {
    const keys = await listObjects(bucket, directory);
    log.info(`Retrieved ${keys.length} keys`);
    return map(keys, async key => {
        const {Body} = await getObject(bucket, key);
        log.info(`Retrieved object ${key}`);
        return JSON.parse(Body.toString());
    }, {concurrency: GET_OBJECT_CONCURRENCY});
}
