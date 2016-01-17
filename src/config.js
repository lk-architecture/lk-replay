export const NODE_ENV = process.env.NODE_ENV;
export const GET_OBJECT_CONCURRENCY = process.env.GET_OBJECT_CONCURRENCY || 100;
export const DATE_FORMAT = "YYYY-MM-DD";
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";
export const SOURCESLESS_USE_RANDOM_PARTITION_KEY = (
    process.env.SOURCESLESS_USE_RANDOM_PARTITION_KEY === "true" ? true : false
);
