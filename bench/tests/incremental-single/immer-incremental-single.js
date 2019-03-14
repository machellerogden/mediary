'use strict';

const { start, end, times } = require('hbu');

const { produce } = require('immer');

let data = {
    ids: [],
    map: {}
}

start();

data = produce(data, draft => {
    let i = 0;
    while (i < times) {
        draft.ids.push(i);
        draft.map[i] = {
            a: 1,
            b: 'Some data here'
        };
        i++;
    }
});

end();
