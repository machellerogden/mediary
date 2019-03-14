'use strict';

const { start, end, times } = require('hbu');

const { mediary } = require('../../..');

let data = {
    ids: [],
    map: {}
};

let cloned = mediary(data);
let i = 0;

start();

while (i < times) {
    cloned.ids.push(i);
    cloned.map[i] = {
        a: 1,
        b: 'Some data here'
    };
    return cloned;
    i++;
}
data = cloned;

end();
