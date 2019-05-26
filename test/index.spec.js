'use strict';

import test from 'ava';

(async () => {

const { clone, Sym, SymMeta } = await import(process.env.USE_SRC ? '../src/index' : '../dist/mediary');

test('basics shallow', t => {
    const foo = {
        a: 'b'
    };
    const bar = clone(foo);
    bar.a = 'c';
    bar.b = 'd';
    t.is(foo.a, 'b');
    t.is(foo.b, void 0);
    t.is(bar.a, 'c');
    t.is(bar.b, 'd');
    t.true(bar[SymMeta].patchedProps.has('a'));
    t.true(bar[SymMeta].patchedProps.has('b'));
    t.deepEqual(bar[SymMeta].patch, { a: 'c', b: 'd' });
});

test('basics deep', t => {
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
    const bar = clone(foo);
    bar.a.b[0].c = 'z';
    bar.a.e = 'z';
    t.is(foo.a.b[0].c, 'd');
    t.is(bar.a.b[0].c, 'z');
    t.is(foo.a.e, 'f');
    t.is(bar.a.e, 'z');
    t.true(bar.a.b[0][SymMeta].patchedProps.has('c'));
    t.true(bar.a[SymMeta].patchedProps.has('e'));
    t.deepEqual(bar.a.b[0][SymMeta].patch, { c: 'z' });
    t.deepEqual(bar.a[SymMeta].patch, { b: [ { c: 'z' } ], e: 'z' });
});


test('spread 1', t => {
    const foo = {
        a: {
            b: 'b',
            c: 'c'
        }
    };
    const bar = clone(foo);
    bar.a = { ...bar.a, ...{ d: 'd'} };
    t.deepEqual(foo.a, { b: 'b', c: 'c' });
    t.deepEqual(bar.a, { b: 'b', c: 'c', d: 'd' });
    t.deepEqual(foo, { a: { b: 'b', c: 'c' } });
    t.true(bar[SymMeta].patchedProps.has('a'));
    t.deepEqual(bar[SymMeta].patch, { a: { b: 'b', c: 'c', d: 'd' } });
});

test('spread 2', t => {
    const foo = {
        a: {
            b: 'b',
            c: {
                d: 'd'
            }
        }
    };
    const bar = clone(foo);
    bar.a.c = { ...bar.a.c, ...{ e: 'e'} };
    t.deepEqual(foo.a.c, { d: 'd' });
    t.deepEqual(bar.a.c, { d: 'd', e: 'e' });
    t.deepEqual(foo, { a: { b: 'b', c: { d: 'd' } } });
    t.true(bar.a[SymMeta].patchedProps.has('c'));
    t.deepEqual(bar.a[SymMeta].patch, { c: { d: 'd', e: 'e' } });
});

test('spread 3', t => {
    const foo = {
        a: {
            b: 'b',
            c: [
               'd'
            ]
        }
    };
    const bar = clone(foo);
    bar.a.c = [ ...bar.a.c, 'e' ];
    t.deepEqual(foo.a.c, [ 'd' ]);
    t.deepEqual(bar.a.c, [ 'd', 'e' ]);
    t.deepEqual(foo, { a: { b: 'b', c: [ 'd' ] } });
    t.true(bar.a[SymMeta].patchedProps.has('c'));
    t.deepEqual(bar.a[SymMeta].patch, { c: [ 'd', 'e' ] });
});

test('spread 4', t => {
    const foo = {
        a: {
            b: 'b',
        },
        c: [ { d: 'd' } ]
    };
    const bar = clone(foo);
    bar.c[0] = { ...bar.c[0], ...{ another: 'entry' } };

    t.deepEqual(bar.a, {
        b: 'b',
    });

    t.deepEqual(bar.c, [
        {
            d: 'd',
            another: 'entry'
        }
    ]);
});

test('set an array', t => {
    const foo = {
        a: {
            b: 'b'
        }
    };
    const bar = clone(foo);
    bar.c = [ 'c', 'd' ];
    t.deepEqual(bar.c, [ 'c', 'd' ]);
    t.true(bar[SymMeta].patchedProps.has('c'));
    t.deepEqual(bar[SymMeta].patch, { c: [ 'c', 'd' ] });
});

test('base array', t => {
    const foo = [
        {
            a: 'a'
        }
    ];
    const bar = clone(foo);
    bar[0].a = 'b';
    t.deepEqual(foo[0].a, 'a');
    t.deepEqual(bar[0].a, 'b');
    t.true(bar[0][SymMeta].patchedProps.has('a'));
    t.deepEqual(bar[0][SymMeta].patch, { a: 'b' });
});

test('base array 2', t => {
    const foo = [
        {
            a: 'a'
        },
        [
            {
                b: 'b'
            },
            {
                c: 'c'
            }
        ]
    ];
    const bar = clone(foo);
    bar.push('b');
    t.deepEqual(bar, [
        { a: 'a' },
        [
            {
                b: 'b'
            },
            {
                c: 'c'
            }
        ],
        'b'
    ]);
    bar.push('b');
    t.deepEqual(bar, [
        { a: 'a' },
        [
            {
                b: 'b'
            },
            {
                c: 'c'
            }
        ],
        'b',
        'b'
    ]);
    t.deepEqual(foo, [
        { a: 'a' },
        [
            {
                b: 'b'
            },
            {
                c: 'c'
            }
        ]
    ]);
    t.true(bar[0][Sym]);
    bar[0].a = 'b';
    t.deepEqual(bar[0][SymMeta].patch, { a: 'b' });
    t.true(bar[0][SymMeta].patchedProps.has('a'));
    t.true(bar[1][0][Sym]);
    t.true(bar[1][1][Sym]);
});

test('base array 3', t => {
    const foo = [
        { a: 'a' }
    ];
    const bar = clone(foo);
    bar.push({ b: 'b' });
    t.deepEqual(foo, [
        { a: 'a' }
    ]);
    t.deepEqual(bar, [
        { a: 'a' },
        { b: 'b' }
    ]);
    t.true(bar[1][Sym]);
});

test('change length', t => {
    const foo = {
        a: {
            b: [ 1, 2, 3 ]
        }
    };
    const bar = clone(foo);
    bar.a.b.length = 1;
    t.deepEqual(foo.a.b, [ 1, 2, 3 ]);
    t.is(foo.a.b.length, 3);
    t.is(bar.a.b.length, 1);
    t.deepEqual(bar.a.b, [ 1 ]);
});

test('push 1', t => {
    const foo = {
        a: {
            b: 'b',
        },
        c: [ 'c' ]
    };
    const bar = clone(foo);
    bar.c.push('d');
    t.deepEqual(foo.c, [ 'c' ]);
    t.deepEqual(bar.c, [ 'c', 'd' ]);
});

test('push 2', t => {
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
    const bar = clone(foo);
    bar.a.b.push('new value');
    t.deepEqual(foo.a.b, [ { c: 'd' } ]);
    t.deepEqual(bar.a.b, [ { c: 'd' }, 'new value' ]);
});

test('delete shallow', t => {
    const foo = {
        a: 'a',
        b: 'b'
    };
    const bar = clone(foo);
    delete bar.b;
    t.deepEqual(foo, { a: 'a', b: 'b' });
    t.deepEqual(bar, { a: 'a' });
    t.true(bar[SymMeta].deletedProps.has('b'));
    t.deepEqual(bar[SymMeta].patch, { a: 'a' });
});

test('delete deep', t => {
    const foo = {
        a: 'a',
        b: {
            c: {
                d: 'd'
            },
        }
    };
    const bar = clone(foo);
    delete bar.b.c.d;
    t.deepEqual(foo, { a: 'a', b: { c: { d: 'd' } } });
    t.deepEqual(bar, { a: 'a', b: { c: { } } });
    t.true(bar.b.c[SymMeta].deletedProps.has('d'));
    t.deepEqual(bar.b.c[SymMeta].patch, {});
    bar.b.c.a = "a";
    t.true(bar.b.c[SymMeta].patchedProps.has('a'));
    t.false(bar.b.c[SymMeta].deletedProps.has('a'));
    t.deepEqual(bar.b.c[SymMeta].patch, { a: "a" });
    delete bar.b.c.a;
    t.true(bar.b.c[SymMeta].deletedProps.has('a'));
    t.deepEqual(bar.b.c[SymMeta].patch, {});
});

test('splice shallow', t => {
    const foo = [ 'a', 'b', 'c' ];
    const bar = clone(foo);
    bar.splice(1);
    t.deepEqual(foo, [ 'a', 'b', 'c' ]);
    t.deepEqual(bar, [ 'a' ]);
});

test('splice deep', t => {
    const foo = {
        a: [ 'a', 'b', 'c' ]
    };
    const bar = clone(foo);
    bar.a.splice(1);
    t.deepEqual(foo, {
        a: [ 'a', 'b', 'c' ]
    });
    t.deepEqual(bar, {
        a: [ 'a' ]
    });
    t.deepEqual(bar[SymMeta].patch, { a: [ 'a' ] });
});

test('shift shallow', t => {
    const foo = [ 'a', 'b', 'c' ];
    const bar = clone(foo);
    t.is('a', bar.shift());
    t.deepEqual(foo, [ 'a', 'b', 'c' ]);
    t.deepEqual(bar, [ 'b', 'c' ]);
});

test('shift deep', t => {
    const foo = { a: [ 'a', 'b', 'c' ] };
    const bar = clone(foo);
    t.is('a', bar.a.shift());
    t.deepEqual(foo, { a: [ 'a', 'b', 'c' ] });
    bar.a = [ 'foo' ];
    t.is('foo', bar.a.shift());
    t.deepEqual(bar, { a: [] });
    t.deepEqual(bar.a, []);
});

test('unshift shallow', t => {
    const foo = [ 'a', 'b', 'c' ];
    const bar = clone(foo);
    bar.unshift('z');
    t.deepEqual(foo, [ 'a', 'b', 'c' ]);
    t.deepEqual(bar, [ 'z', 'a', 'b', 'c' ]);
});

test('unshift deep', t => {
    const foo = { a: [ 'a', 'b', 'c' ] };
    const bar = clone(foo);
    bar.a.unshift('z');
    t.deepEqual(foo, { a: [ 'a', 'b', 'c' ] });
    t.deepEqual(bar, { a: [ 'z', 'a', 'b', 'c' ] });
});

// unshift after changes

test('pop shallow', t => {
    const foo = [ 'a', 'b', 'c' ];
    const bar = clone(foo);
    t.is('c', bar.pop());
    t.deepEqual(foo, [ 'a', 'b', 'c' ]);
    t.deepEqual(bar, [ 'a', 'b' ]);
});

test('pop deep', t => {
    const foo = { a: [ 'a', 'b', 'c' ] };
    const bar = clone(foo);
    t.is('c', bar.a.pop());
    t.deepEqual(foo, { a: [ 'a', 'b', 'c' ] });
    t.deepEqual(bar, { a: [ 'a', 'b' ] });
});

// TODO pop after changes

test('reverse shallow', t => {
    const foo = [ 'a', 'b', 'c' ];
    const bar = clone(foo);
    t.deepEqual([ 'c', 'b', 'a' ],  bar.reverse());
    t.deepEqual(foo, [ 'a', 'b', 'c' ]);
    t.deepEqual(bar, [ 'c', 'b', 'a' ]);
});

test('reverse deep', t => {
    const foo = { a: [ 'a', 'b', 'c' ] };
    const bar = clone(foo);
    t.deepEqual([ 'c', 'b', 'a' ],  bar.a.reverse());
    t.deepEqual(foo, { a: [ 'a', 'b', 'c' ] });
    t.deepEqual(bar, { a: [ 'c', 'b', 'a' ] });
});

// TODO reverse after changes

test('copyWithin shallow', t => {
    const foo = [ 'a', 'b', 'c' ];
    const bar = clone(foo);
    t.deepEqual([ 'c', 'b', 'c' ],  bar.copyWithin(0, 2, 3));
    t.deepEqual(foo, [ 'a', 'b', 'c' ]);
    t.deepEqual(bar, [ 'c', 'b', 'c' ]);
});

test('copyWithin shallow 2', t => {
    const foo = [ 'a', 'b', 'c', 'd', 'e' ];
    const bar = clone(foo);
    t.deepEqual([ 'a', 'd', 'e', 'd', 'e' ],  bar.copyWithin(1, 3));
    t.deepEqual(foo, [ 'a', 'b', 'c', 'd', 'e' ]);
    t.deepEqual(bar, [ 'a', 'd', 'e', 'd', 'e' ]);
});

test('copyWithin deep', t => {
    const foo = { a: [ 'a', 'b', 'c', 'd', 'e' ] };
    const bar = clone(foo);
    t.deepEqual([ 'a', 'd', 'e', 'd', 'e' ],  bar.a.copyWithin(1, 3));
    t.deepEqual(foo, { a: [ 'a', 'b', 'c', 'd', 'e' ] });
    t.deepEqual(bar, { a: [ 'a', 'd', 'e', 'd', 'e' ] });
    bar.a[1] = 'b';
    bar.a[2] = 'c';
    t.deepEqual(foo, { a: [ 'a', 'b', 'c', 'd', 'e' ] });
    t.deepEqual(bar, { a: [ 'a', 'b', 'c', 'd', 'e' ] });
    t.deepEqual([ 'a', 'd', 'e', 'd', 'e' ],  bar.a.copyWithin(1, 3));
    t.deepEqual(bar, { a: [ 'a', 'd', 'e', 'd', 'e' ] });
});

test('entries shallow', t => {
    const foo = [ 'a', 'b', 'c' ];
    const bar = clone(foo);
    t.deepEqual([ [ 0, 'a' ], [ 1, 'b' ], [ 2, 'c' ] ],  [ ...bar.entries() ]);
    t.deepEqual(foo, [ 'a', 'b', 'c' ]);
    t.deepEqual(bar, [ 'a', 'b', 'c' ]);
});

test('entries deep', t => {
    const foo = { a: [ 'a', 'b', 'c' ] };
    const bar = clone(foo);
    t.deepEqual([ [ 0, 'a' ], [ 1, 'b' ], [ 2, 'c' ] ],  [ ...bar.a.entries() ]);
    t.deepEqual(foo.a, [ 'a', 'b', 'c' ]);
    t.deepEqual(bar.a, [ 'a', 'b', 'c' ]);
    bar.a[2] = 'boom';
    t.deepEqual([ [ 0, 'a' ], [ 1, 'b' ], [ 2, 'boom' ] ],  [ ...bar.a.entries() ]);
});

test('fill shallow', t => {
    const foo = [ 'a', 'b', 'c', 'd', 'e' ];
    const bar = clone(foo);
    t.deepEqual([ 'a', 'b', 0, 0, 0 ],  bar.fill(0, 2));
    t.deepEqual(foo, [ 'a', 'b', 'c', 'd', 'e' ]);
    t.deepEqual(bar, [ 'a', 'b', 0, 0, 0 ]);
});

test('fill shallow 2', t => {
    const foo = [ 'a', 'b', 'c', 'd', 'e' ];
    const bar = clone(foo);
    t.deepEqual([ 'a', 'test', 'test', 'd', 'e' ],  bar.fill('test', 1, 3));
    t.deepEqual(foo, [ 'a', 'b', 'c', 'd', 'e' ]);
    t.deepEqual(bar, [ 'a', 'test', 'test', 'd', 'e' ]);
});

test('fill deep', t => {
    const foo = { a: [ 'a', 'b', 'c', 'd', 'e' ] };
    const bar = clone(foo);
    t.deepEqual([ 'a', 'test', 'test', 'd', 'e' ],  bar.a.fill('test', 1, 3));
    t.deepEqual(foo, { a: [ 'a', 'b', 'c', 'd', 'e' ] });
    t.deepEqual(bar, { a: [ 'a', 'test', 'test', 'd', 'e' ] });
    bar.a[1] = 'boom';
    t.deepEqual(bar, { a: [ 'a', 'boom', 'test', 'd', 'e' ] });
    t.deepEqual([ 'a', 'test', 'test', 'd', 'e' ],  bar.a.fill('test', 1, 2));
});

test('find shallow', t => {
    const foo = [ 1, 2, 3, 4, 5 ];
    const bar = clone(foo);
    t.deepEqual(3,  bar.find(v => v === 3));
    t.deepEqual(foo, [ 1, 2, 3, 4, 5 ]);
    t.deepEqual(bar, [ 1, 2, 3, 4, 5 ]);
});

test('find deep', t => {
    const foo = { a: [ 1, 2, 3, 4, 5 ] };
    const bar = clone(foo);
    t.deepEqual(3,  bar.a.find(v => v === 3));
    t.deepEqual(foo, { a: [ 1, 2, 3, 4, 5 ] });
    t.deepEqual(bar, { a: [ 1, 2, 3, 4, 5 ] });
    bar.a[2] = 0;
    t.deepEqual(bar, { a: [ 1, 2, 0, 4, 5 ] });
    t.is(void 0,  bar.a.find(v => v === 3));
    bar.a[4] = 3;
    t.is(3,  bar.a.find(v => v === 3));
});

test('findIndex shallow', t => {
    const foo = [ 1, 2, 3, 4, 5 ];
    const bar = clone(foo);
    t.deepEqual(2,  bar.findIndex(v => v === 3));
    t.deepEqual(foo, [ 1, 2, 3, 4, 5 ]);
    t.deepEqual(bar, [ 1, 2, 3, 4, 5 ]);
});

test('findIndex deep', t => {
    const foo = { a: [ 1, 2, 3, 4, 5 ] };
    const bar = clone(foo);
    t.deepEqual(2,  bar.a.findIndex(v => v === 3));
    t.deepEqual(foo, { a: [ 1, 2, 3, 4, 5 ] });
    t.deepEqual(bar, { a: [ 1, 2, 3, 4, 5 ] });
    bar.a[2] = 0;
    t.deepEqual(bar, { a: [ 1, 2, 0, 4, 5 ] });
    t.is(-1,  bar.a.findIndex(v => v === 3));
    bar.a[4] = 3;
    t.is(4, bar.a.findIndex(v => v === 3));
});

test('every shallow', t => {
    const foo = [ 'a', 'b', 'c' ];
    const bar = clone(foo);
    t.true(bar.every(v => typeof v === 'string'));
    t.false(bar.every(v => typeof v === 'number'));
    t.true(bar.every(v => [ 'a', 'b', 'c' ].includes(v)));
    t.false(bar.every(v => [ 'b', 'c' ].includes(v)));
    t.true(bar.every(v => v.length === 1));
});

// TODO every deep
// TODO every after changes

test('concat shallow', t => {
    const foo = [ 'a', 'b', 'c' ];
    const bar = clone(foo);
    t.deepEqual([ 'a', 'b', 'c', 1, 2, 3 ],  bar.concat([ 1, 2, 3]));
    t.deepEqual(foo, [ 'a', 'b', 'c' ]);
    t.deepEqual(bar, [ 'a', 'b', 'c' ]);
});

// TODO concat deep
// TODO concat after changes

test('filter shallow', t => {
    const foo = [ 1, 2, 3, 4, 5 ];
    const bar = clone(foo);
    t.deepEqual([ 1, 3, 5 ],  bar.filter(v => v % 2));
    t.deepEqual(foo, [ 1, 2, 3, 4, 5 ]);
    t.deepEqual(bar, [ 1, 2, 3, 4, 5 ]);
});

// TODO filter deep
// TODO filter after changes

test('reduce shallow', t => {
    const foo = [ 1, 2, 3, 4, 5 ];
    const bar = clone(foo);
    // every value is 2
    t.falsy(bar.reduce((acc, v) => (acc && v % 2), true));
    // some values are 2
    t.truthy(bar.reduce((acc, v) => (acc || v % 2), false));
    // double up
    t.deepEqual([ 1, 1, 2, 2, 3, 3, 4, 4, 5, 5 ], bar.reduce((acc, v) => {
        acc = [ ...acc, v, v ];
        return acc;
    }, []));
    t.deepEqual(foo, [ 1, 2, 3, 4, 5 ]);
    t.deepEqual(bar, [ 1, 2, 3, 4, 5 ]);
});

// TODO reduce deep
// TODO reduce after changes

test('reduceRight shallow', t => {
    const foo = [ 1, 2, 3, 4, 5 ];
    const bar = clone(foo);
    // every value is 2
    t.falsy(bar.reduceRight((acc, v) => (acc && v % 2), true));
    // some values are 2
    t.truthy(bar.reduceRight((acc, v) => (acc || v % 2), false));
    // double up
    t.deepEqual([ 5, 5, 4, 4, 3, 3, 2, 2, 1, 1 ], bar.reduceRight((acc, v) => {
        acc = [ ...acc, v, v ];
        return acc;
    }, []));
    t.deepEqual(foo, [ 1, 2, 3, 4, 5 ]);
    t.deepEqual(bar, [ 1, 2, 3, 4, 5 ]);
});

test('map shallow', t => {
    const foo = [ 1, 2, 3, 4, 5 ];
    const bar = clone(foo);
    t.deepEqual([ 11, 12, 13, 14, 15 ], bar.map(v => v + 10));
    t.deepEqual(foo, [ 1, 2, 3, 4, 5 ]);
    t.deepEqual(bar, [ 1, 2, 3, 4, 5 ]);
});

// TODO map deep
// TODO map after changes

test('keys', t => {
    const foo = [ 1, 2, 3, 4, 5 ];
    const bar = clone(foo);
    t.deepEqual([ 0, 1, 2, 3, 4 ], [ ...bar.keys() ]);
    t.deepEqual(foo, [ 1, 2, 3, 4, 5 ]);
    t.deepEqual(bar, [ 1, 2, 3, 4, 5 ]);
});

test('values', t => {
    const foo = [ 1, 2, 3, 4, 5 ];
    const bar = clone(foo);
    t.deepEqual([ 1, 2, 3, 4, 5 ], [ ...bar.values() ]);
    t.deepEqual(foo, [ 1, 2, 3, 4, 5 ]);
    t.deepEqual(bar, [ 1, 2, 3, 4, 5 ]);
});

test('flat', t => {
    const foo = [ 1, [ 2, [ 3, [ 4, 5 ] ] ] ];
    const bar = clone(foo);
    t.deepEqual([ 1, 2, [ 3, [ 4, 5 ] ] ], bar.flat());
    t.deepEqual([ 1, 2, 3, [ 4, 5 ] ], bar.flat(2));
    t.deepEqual([ 1, 2, 3, 4, 5 ], bar.flat(3));
    t.deepEqual(foo, [ 1, [ 2, [ 3, [ 4, 5 ] ] ] ]);
    t.deepEqual(bar, [ 1, [ 2, [ 3, [ 4, 5 ] ] ] ]);
});

test('forEach', t => {
    const foo = [ 1, 2, 3, 4, 5 ];
    const bar = clone(foo);
    t.plan(5);
    let i = 1;
    bar.forEach(v => t.is(i++, v));
});

// TODO forEach - test other call signatures
// TODO forEach - test after changes signatures
// TODO forEach - test deep

test('includes', t => {
    const a = { a: "a" };
    const b = { b: "b" };
    const foo = [ 1, 2, a, [ 4 , b ] ];
    const bar = clone(foo);
    t.is(false, bar.includes(a));
    t.is(true, bar.includes(1));
    bar[0] = 2;
    t.is(false, bar.includes(1));
    t.is(true, bar.includes(2));
    t.is(false, bar.includes(a));
    t.is(true, bar[3].includes(4));
    t.is(false, bar[3].includes(b));
    bar[3][0] = 6;
    t.is(false, bar[3].includes(4));
    bar[3][1] = 5;
    t.is(true, bar[3].includes(5));
});

test('indexOf', t => {
    const a = { b: "b" };
    const foo = [ 1, 2, a, 4, 5 ];
    const bar = clone(foo);
    t.is(-1, bar.indexOf(a));
    t.is(0, bar.indexOf(1));
    t.is(1, bar.indexOf(2));
    bar[0] = 2;
    t.is(-1, bar.indexOf(1));
    t.is(0, bar.indexOf(2));
    t.is(-1, bar.indexOf({ b: "b" }));
});

test('lastIndexOf', t => {
    const a = { b: "b" };
    const foo = [ 1, 2, a, 4, 4 ];
    const bar = clone(foo);
    t.is(4, bar.lastIndexOf(4));
    t.is(-1, bar.lastIndexOf(a));
    t.is(0, bar.lastIndexOf(1));
    t.is(1, bar.lastIndexOf(2));
    bar[0] = 2;
    t.is(-1, bar.lastIndexOf(1));
    t.is(1, bar.lastIndexOf(2));
    t.is(-1, bar.lastIndexOf({ b: "b" }));
});

test('join', t => {
    const foo = [ 'a', 'b', 'c' ];
    const bar = clone(foo);
    t.is('a,b,c', bar.join());
    t.is('abc', bar.join(''));
    // TODO - more tests!! rushing away to play mario kart with wife
});

test('slice shallow', t => {
    const foo = [ 'a', 'b', 'c' ];
    const bar = clone(foo);
    bar.slice(1);
    t.deepEqual(foo, [ 'a', 'b', 'c' ]);
    t.deepEqual(bar.slice(1), [ 'b', 'c' ]);
    t.deepEqual(bar.slice(1, 2), [ 'b' ]);
    t.deepEqual(bar.slice(-1), [ 'c' ]);
    t.deepEqual(bar.slice(-1, 1), []);
    t.deepEqual(bar, [ 'a', 'b', 'c' ]);
});

// TODO slice deep
// TODO slice after changes

test('some shallow', t => {
    const foo = [ 'a', 'b', 'c' ];
    const bar = clone(foo);
    t.true(bar.some(v => typeof v === 'string'));
    t.false(bar.some(v => typeof v === 'number'));
    t.true(bar.some(v => [ 'a', 'b', 'c' ].includes(v)));
    t.true(bar.some(v => 'c' === v));
    t.true(bar.some(v => v.length === 1));
});

test('sort shallow', t => {
    const foo = [ 'c', 'b', 'a', 'd' ];
    const bar = clone(foo);
    t.deepEqual(bar.sort(), [ 'a', 'b', 'c', 'd' ]);
    t.deepEqual(bar, [ 'a', 'b', 'c', 'd' ]);
    t.deepEqual(foo, [ 'c', 'b', 'a', 'd' ]);
});

// TODO sort deep
// TODO sort after changes

test('toLocaleString shallow', t => {
    var foo = ['¥7', 500, 8123, 12]; 
    var bar = clone(foo);
    t.is(bar.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }), '¥7,¥500,¥8,123,¥12');
    bar[0] = 7;
    t.is(bar.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' }), '¥7,¥500,¥8,123,¥12');
});

// TODO toLocaleString deep

test('toString shallow', t => {
    var foo = ['a', 'b', 'c', 'd']; 
    var bar = clone(foo);
    t.is(bar.toString(), 'a,b,c,d');
    bar[1] = 'z';
    t.is(bar.toString(), 'a,z,c,d');
});


// internals
test('cloning clones 1', t => {
    const foo = { a: { b: [ { c: { d: 'd' } } ] } };
    const bar = clone(foo);
    const baz = clone(bar);
    const qux = clone(baz);
    t.deepEqual(foo, bar[SymMeta].target);
    t.deepEqual(bar[SymMeta].target, baz[SymMeta].target);
    t.deepEqual(baz[SymMeta].target, qux[SymMeta].target);
    t.deepEqual(bar[SymMeta].patch, {});
    t.deepEqual(baz[SymMeta].patch, {});
    t.deepEqual(qux[SymMeta].patch, {});
    t.deepEqual(foo.a.b[0].c.d, bar[SymMeta].target.a.b[0].c.d);
    t.deepEqual(bar[SymMeta].target.a.b[0].c.d, baz[SymMeta].target.a.b[0].c.d);
    t.deepEqual(baz[SymMeta].target.a.b[0].c.d, qux[SymMeta].target.a.b[0].c.d);
    bar.e = 'e';
    baz.f = 'f';
    qux.g = 'g';
    t.deepEqual(bar[SymMeta].patch, { e: 'e' });
    t.deepEqual(baz[SymMeta].patch, { f: 'f' });
    t.deepEqual(qux[SymMeta].patch, { g: 'g' });
    t.deepEqual(foo.a, bar.a);
    t.deepEqual(bar.a, baz.a);
    t.deepEqual(baz.a, qux.a);
});

test('cloning clones 2', t => {
    const foo = { a: { b: [ { c: { d: 'd' } } ] } };
    const bar = clone(foo);
    const baz = clone(bar);
    const qux = clone(baz);
    bar.e = 'e';
    baz.f = 'f';
    qux.g = 'g';
    t.deepEqual(foo.a, bar.a);
    t.deepEqual(bar.a, baz.a);
    t.deepEqual(baz.a, qux.a);
    const xyzzy = clone(qux);
    xyzzy.h = 'h';
    t.deepEqual(xyzzy[SymMeta].patch, { h: 'h' });
    t.deepEqual(foo.a, xyzzy.a);
});

test('shaking out edge cases', t => {
    const blah = {};
    [ 'reduce' ].forEach(k => blah[k] = (v, ...args) => [][k].apply(clone(v) || [], args.map(clone)));
    const foo = [ { a: { b: [ { c: { d: 'd' } } ] } } ];
    const bar = blah.reduce(foo, (acc, v, k, i) => (acc[k] = v, acc), []);
    t.deepEqual(foo, bar);
});

})();
