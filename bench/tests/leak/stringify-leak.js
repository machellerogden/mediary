'use strict';

const { start, end, times } = require('hbu');

const data = require('../../data');

const leak = [];

let i = 0;

start();

while (i < times) {
    leak.push(JSON.parse(JSON.stringify(data)));
    i++;
}

end();
