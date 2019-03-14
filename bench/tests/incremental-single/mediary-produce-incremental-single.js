'use strict';

const { start, end, times } = require('hbu');

const { produce } = require('../../..');

let data = {
    ids: [],
    map: {}
};

start();

data = produce(data, cloned => {
    let i = 0;
    while (i < times) {
        cloned.ids.push(i);
        cloned.map[i] = {
            a: 1,
            b: 'Some data here'
        };
        i++;
    }
});

end();
