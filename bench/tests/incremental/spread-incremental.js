'use strict';

const { start, end, times } = require('hbu');

let data = {
    ids: [],
    map: {}
};

let i = 0;

start();

while (i < times) {
    data = {
        ids: [
            ...data.ids,
            i
        ],
        map: {
            ...data.map,
            [i]: {
                a: 1,
                b: 'Some data here'
            }
        }
    };
    i++;
}

end();
