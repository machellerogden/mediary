'use strict';

const { start, end, times } = require('hbu');

const { produce } = require('../../../dist');

let data = {
    ids: [],
    map: {}
};

let i = 0;

start();

while (i < times) {
    data = produce(data, cloned => {
        cloned.ids.push(i);
        cloned.map[i] = {
            a: 1,
            b: 'Some data here'
        };
    });
    i++;
}

end();
