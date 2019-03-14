'use strict';

const { start, end, times } = require('hbu');

const { create } = require('../../..');

let data = {
    ids: [],
    map: {}
};

start();

data = create(data, cloned => {
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
