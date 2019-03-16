'use strict';

exports.reduce = (a, fn, s) => Array.isArray(a)
    ? a.reduce(fn, s || [])
    : Object.entries(a).reduce((acc, [ k, v ], i, o) => fn(acc, v, k, o), s || {});

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
