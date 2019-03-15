'use strict';

const { start, end, times } = require('hbu');

const { clone } = require('../../..');

let data = {
    ids: [],
    map: {}
};

let cloned = clone(data);
let i = 0;

start();

while (i < times) {
    cloned.ids.push(i);
    cloned.map[i] = {
        a: 1,
        b: 'Some data here'
    };
    i++;
}
data = cloned;

end();
