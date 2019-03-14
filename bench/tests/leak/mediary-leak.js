'use strict';

const { start, end, times } = require('hbu');

const { mediary } = require('../../..');
const data = require('../../data');

const leak = [];

let i = 0;

start();

while (i < times) {
    leak.push(mediary(data));
    i++;
}

end();
