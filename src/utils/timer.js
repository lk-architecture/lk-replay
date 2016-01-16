export default function timer () {
    var start = Date.now();
    return () => {
        const elapsed = Date.now() - start;
        start = Date.now();
        return elapsed;
    };
}
