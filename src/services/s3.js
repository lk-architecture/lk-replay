import {S3} from "aws-sdk";
import BPromise, {promisify} from "bluebird";
import s3 from "s3";
import {map, prop, unnest} from "ramda";

import {NODE_ENV} from "../config";

const sdkS3Client = (
    NODE_ENV === "test" ?
    new S3({
        endpoint: "http://localhost:4567",
        s3BucketEndpoint: true
    }) :
    new S3()
);
const simpleS3Client = s3.createClient({s3Client: sdkS3Client});

const getObjectAsync = promisify(::sdkS3Client.getObject);
export function getObject (Bucket, Key) {
    return getObjectAsync({Bucket, Key});
}

export function listObjects (Bucket, Prefix) {
    const keyGroups = [];
    return new BPromise((resolve, reject) => {
        simpleS3Client.listObjects({s3Params: {Bucket, Prefix}})
            .on("data", data => {
                keyGroups.push(
                    map(prop("Key"), data.Contents)
                );
            })
            .on("end", () => resolve(unnest(keyGroups)))
            .on("error", reject);
    });
}
