'use strict';

const { inspect } = require('util');

const debug = v =>
    process
    && process.env
    && process.env.DEBUG &&
    console.log(inspect(v, {
        depth: null,
        showHidden: false,
        colors: true
    }));

exports.debug = debug;
