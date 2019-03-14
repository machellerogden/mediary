'use strict';

const { start, end, times } = require('hbu');

const { create } = require('../../..');

let data = {
    ids: [],
    map: {}
};

let i = 0;

start();

while (i < times) {
    data = create(data, cloned => {
        cloned.ids.push(i);
        cloned.map[i] = {
            a: 1,
            b: 'Some data here'
        };
    });
    i++;
}

end();
