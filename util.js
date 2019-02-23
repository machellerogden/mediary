'use strict';

const { inspect } = require('util');

exports.debug = v =>
    process
    && process.env
    && process.env.MEDIARY_DEBUG &&
    console.log(inspect(v, {
        depth: null,
        showHidden: false,
        colors: true
    }));

//const primitives = new Set([ 'undefined', 'string', 'number', 'boolean' ]);
//const plainObjects = new Set([ '[object Object]', '[object Array]' ]);
//exports.isPrimitive = v => primitives.has(v);
//exports.isPlainObject = v => plainObjects.has(Object.prototype.toString.call(v));

exports.reduce = (a, fn, s) => Array.isArray(a)
    ? a.reduce(fn, s || [])
    : Object.entries(a).reduce((acc, [ k, v ], i, o) => fn(acc, v, k, o), s || {});

exports.toArray = o => Object.entries(o).reduce((acc, [ k, v ]) => (acc[k] = v, acc), []);

exports.isNumber = n => !isNaN(parseInt(n, 10)) && isFinite(n);

exports.getNumeric = keys => keys.filter(exports.isNumber).map(Number);

exports.deepFreeze = o => {
    Object.freeze(o);

    Object.getOwnPropertyNames(o).forEach(function (prop) {
        if (o.hasOwnProperty(prop)
            && o[prop] !== null
            && (typeof o[prop] === "object" || typeof o[prop] === "function")
            && !Object.isFrozen(o[prop])) {
            exports.deepFreeze(o[prop]);
        }
    });

    return o;
};
