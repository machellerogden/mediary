'use strict';

const { start, end, times } = require('hbu');

const { produce } = require('immer');

let data = {
    ids: [],
    map: {}
};

let i = 0;

start();

while (i < times) {
    data = produce(data, draft => {
        draft.ids.push(i);
        draft.map[i] = {
            a: 1,
            b: 'Some data here'
        };
    });
    i++;
}

end();
