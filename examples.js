'use strict';

// example 1
const { clone } = require('.');

const foo = {
    a: {
        b: 'b',
        c: 'c'
    }
};

const bar = clone(foo);

bar.a.d = 'd';

console.log(foo); // => { a: { b: 'b', c: 'c' } }

console.log(bar); // => { a: { b: 'b', c: 'c', d: 'd'  } }

// example 2
const { SymMeta } = require('.');

console.log(bar.a[SymMeta].patch); // => { d: 'd' }

// example 3
foo.a = "z";

console.log(foo); // => { a: { b: 'b', c: 'c' } }
console.log(bar); // => { a: { b: 'b', c: 'c', d: 'd' } } 

// TypeError: Cannot assign to read only property 'a' of object '#<Object>'
