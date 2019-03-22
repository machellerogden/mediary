const { mediary, realize, Sym, SymMeta } = require('.');

//const foo = { a: "a", b: [ "b", { b: "b" }, "b" ], c: { c: "c" } };

//const bar = mediary(foo);

//bar.d = 'bar';

//const qux = mediary(realize(bar));

//qux.e = 'qux';

//const bam = mediary(realize(qux));

//bam.f = 'bam';
//bam.b[1] = 'bam';

//const boom = mediary(realize(bam));

//boom.g = 'boom';
//boom.b.push('boom');

//console.log('foo', foo);
//console.log('bar', bar);
//console.log('qux', qux);
//console.log('bam', bam);
//console.log('boom', boom);

const foo = {
    a: {
        b: 'b',
    },
    c: [ { d: 'd' } ]
};
//const bar = clone(foo);
const bar = mediary(realize(foo));
bar.c[0] = { ...bar.c[0], ...{ another: 'entry' } };

console.log(bar.a);
// { b: 'b' }

console.log(bar.c);
// [ { d: 'd', another: 'entry' } ]
