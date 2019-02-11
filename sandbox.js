'use strict'
const mediary = require('.');
const { PatchSymbol } = mediary;
const {inspect} = require('util');
const log = (...args) => console.log(inspect(args, { depth: null, colors: true }));

const foo = {
    bar: {
        baz: [ 'aaa', 'qux' ],
        bim: 'bam'
    }
};

const mediatedFoo = mediary(foo);
mediatedFoo.bar.baz.push('boom');
delete mediatedFoo.bar.bim;

console.log('foo', foo);
console.log('mediatedFoo', mediatedFoo); // TODO: solve strange log serialization issue... everything works, but looks arrays look doubled up with string indexes when serialized via console.log
console.log('patch', mediatedFoo.bar.baz[PatchSymbol]);
