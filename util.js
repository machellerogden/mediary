'use strict';

exports.reduce = (a, fn, s) => Array.isArray(a)
    ? a.reduce(fn, s || [])
    : Object.entries(a).reduce((acc, [ k, v ], i, o) => fn(acc, v, k, o), s || {});

const numberTypes = new Set(['string', 'number']);

exports.isNumber = n => numberTypes.has(typeof n) && !isNaN(parseInt(n, 10)) && isFinite(n);

exports.deepFreeze = o => {
    Object.freeze(o);

    Object.getOwnPropertyNames(o).forEach(prop => {
        if (o.hasOwnProperty(prop)
            && o[prop] !== null
            && (typeof o[prop] === "object" || typeof o[prop] === "function")
            && !Object.isFrozen(o[prop])) {
            exports.deepFreeze(o[prop]);
        }
    });

    return o;
};
