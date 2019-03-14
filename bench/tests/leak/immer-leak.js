'use strict';

const { start, end, times } = require('hbu');

const { produce } = require('immer');
const data = require('../../data');

const leak = [];

let i = 0;

start();

while (i < times) {
    leak.push(produce(data, () => {}));
    i++;
}

end();
