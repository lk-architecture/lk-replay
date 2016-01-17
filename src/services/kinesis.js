import {Kinesis} from "aws-sdk";
import {promisifyAll} from "bluebird";

export default function getKinesisClient (stream) {
    const kinesis = new Kinesis({
        apiVersion: "2013-12-02",
        region: stream.region
    });
    return promisifyAll(kinesis);
}
