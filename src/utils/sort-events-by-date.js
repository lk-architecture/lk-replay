export default function sortEventsByDate (event_a, event_b) {
    return (
        new Date(event_a.timestamp) > new Date(event_b.timestamp) ? 1 : -1
    );
}
