import retry from "bluebird-retry";

export default function makeFaultTolerant (fn) {
    return (...args) => retry(() => fn(...args));
}
