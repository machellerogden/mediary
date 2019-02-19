'use strict';

const { inspect } = require('util');

exports.debug = v =>
    process
    && process.env
    && process.env.MEDIARY_DEBUG &&
    console.log(inspect(v, {
        depth: null,
        showHidden: true,
        showProxy: true,
        colors: true
    }));

exports.reduce = (a, fn, s) => Array.isArray(a)
    ? a.reduce(fn, s || [])
    : Object.entries(a).reduce((acc, [ k, v ], i, o) => fn(acc, v, k, o), s || {});

exports.toArray = o => Object.entries(o).reduce((acc, [ k, v ]) => (acc[k] = v, acc), []);

exports.isNumber = n => !isNaN(parseInt(n, 10)) && isFinite(n);

exports.lengthFromKeys = (keys) => Math.max.apply(null, keys.filter(exports.isNumber).map(Number)) + 1;

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
