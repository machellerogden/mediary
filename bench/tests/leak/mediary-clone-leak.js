'use strict';

const { start, end, times } = require('hbu');

const { clone } = require('../../../dist');
const data = require('../../data');

const leak = [];

let i = 0;

start();

while (i < times) {
    leak.push(clone(data));
    i++;
}

end();
