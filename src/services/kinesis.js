import {Kinesis} from "aws-sdk";
import {promisifyAll} from "bluebird";

const kinesis = new Kinesis({
    apiVersion: "2013-12-02"
});
export default promisifyAll(kinesis);
