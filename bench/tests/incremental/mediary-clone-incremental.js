'use strict';

const { start, end, times } = require('hbu');

const { clone } = require('../../..');

let data = {
    ids: [],
    map: {}
};

let i = 0;

start();

while (i < times) {
    let cloned = clone(data);
    cloned.ids.push(i);
    cloned.map[i] = {
        a: 1,
        b: 'Some data here'
    };
    data = cloned;
    i++;
}

end();
