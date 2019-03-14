'use strict';

const { start, end, times } = require('hbu');

const data = require('../../data');
const { deepFreeze } = require('../../../util');

deepFreeze(data);

function deepClone(o) {
    if (!(Object.is(o.constructor, Object) || Object.is(o.constructor, Array))) return o;
    return Array.isArray(o)
        ? o.reduce((acc, v, i) => {
            acc[i] = deepClone(v);
            return acc;
        }, [])
        : Object.entries(o).reduce((acc, [ k, v ]) => {
            acc[k] = deepClone(v);
            return acc;
        }, {});
}

const leak = [];

let i = 0;

start();

while (i < times) {
    leak.push(deepClone(data));
    i++;
}

end();
