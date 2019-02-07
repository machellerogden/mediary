'use strict'
const mediary = require('.');
const {inspect} = require('util');
const log = (...args) => console.log(inspect(args, { depth: null, colors: true }));
const foo = {
    a: {
        b: [
            {
                c: 'd'
            }
        ],
        e: 'f'
    }
};
const bar = mediary(foo);
log('foo', foo);
log('bar', bar);
bar.a.b[0].c = 'z';
log('foo', foo);
log('bar', bar);
