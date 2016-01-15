[![npm version](https://badge.fury.io/js/lk-replay.svg)](https://badge.fury.io/js/lk-replay)
[![Build Status](https://travis-ci.org/mondora/lk-replay.svg?branch=master)](https://travis-ci.org/mondora/lk-replay)
[![Coverage Status](https://coveralls.io/repos/mondora/lk-replay/badge.svg)](https://coveralls.io/r/mondora/lk-replay)
[![Dependency Status](https://david-dm.org/mondora/lk-replay.svg)](https://david-dm.org/mondora/lk-replay)
[![devDependency Status](https://david-dm.org/mondora/lk-replay/dev-status.svg)](https://david-dm.org/mondora/lk-replay#info=devDependencies)

# lk-replay

Replay events in the lk-architecture.

### Usage

```sh
lk-replay\
    --bucket "events-bucket-name"\
    --startDate "2016-01-02"\
    --filter '{"type": "event-type"}'
    --stream "kinesis-stream-name"
```
