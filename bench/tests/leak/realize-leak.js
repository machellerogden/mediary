'use strict';

const { start, end, times } = require('hbu');

const { mediary, realize } = require('../../..');
const data = require('../../data');

const leak = [];

let i = 0;

start();

while (i < times) {
    leak.push(realize(mediary(data)));
    i++;
}

end();
