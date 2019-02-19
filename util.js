'use strict';

const { inspect } = require('util');

exports.debug = v =>
    process
    && process.env
    && process.env.DEBUG &&
    console.log(inspect(v, {
        depth: null,
        showHidden: false,
        colors: true
    }));

const primitives = new Set([ 'undefined', 'string', 'number', 'boolean' ]);
const plainObjects = new Set([ '[object Object]', '[object Array]' ]);

exports.isPrimitive = v => primitives.has(v);
exports.isPlainObject = v => plainObjects.has(Object.prototype.toString.call(v));

