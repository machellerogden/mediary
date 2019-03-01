'use strict';

import test from 'ava';
import { clone, Sym, SymMeta } from '.';

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
    t.true(bar[SymMeta].additions.has('a'));
    t.true(bar[SymMeta].additions.has('b'));
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
    t.true(bar.a.b[0][SymMeta].additions.has('c'));
    t.true(bar.a[SymMeta].additions.has('e'));
    t.deepEqual(bar.a.b[0][SymMeta].patch, { c: 'z' });
    t.deepEqual(bar.a.b[SymMeta].patch[0][SymMeta].patch, { c: 'z' });
    t.deepEqual(bar.a[SymMeta].patch, { b: [ { c: 'z' } ], e: 'z' });
    t.true(bar.a[SymMeta].patch.b[Sym]);
    t.deepEqual(bar.a[SymMeta].patch.b[SymMeta].patch[0][SymMeta].patch, { c: 'z' });
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
    t.true(bar[SymMeta].additions.has('a'));
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
    t.true(bar.a[SymMeta].additions.has('c'));
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
    t.true(bar.a[SymMeta].additions.has('c'));
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

    t.true(bar.c[SymMeta].additions.has('0'));
    t.deepEqual(bar.c[SymMeta].patch, [ { d: 'd', another: 'entry' } ]);
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
    t.true(bar[SymMeta].additions.has('c'));
    t.deepEqual(bar[SymMeta].patch, { c: [ 'c', 'd' ] });
});

test('base array', t => {
    const foo = [
        {
            a: 'a'
        }
    ];
    const bar = clone(foo);
    bar[1] = 'b';
    t.deepEqual(bar[0], { a: 'a' });
    t.deepEqual(bar[1], 'b');
    t.deepEqual(bar.length, 2);
    t.true(bar[SymMeta].additions.has('1'));
    t.deepEqual(bar[SymMeta].patch, [ { a: 'a' }, 'b' ]);
});

test('base array 2', t => {
    const foo = [
        {
            a: 'a'
        }
    ];
    const bar = clone(foo);
    bar.push('b');
    t.deepEqual(bar, [ { a: 'a' }, 'b' ]);
    t.true(bar[SymMeta].additions.has('1'));
    t.false(bar[SymMeta].additions.has('2'));
    bar.push('b');
    t.deepEqual(bar, [ { a: 'a' }, 'b', 'b' ]);
    t.deepEqual(foo, [ { a: 'a' } ]);
    t.true(bar[SymMeta].additions.has('2'));
    t.deepEqual(bar[SymMeta].patch, [ { a: 'a' }, 'b', 'b' ]);
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
    t.true(bar.c[SymMeta].additions.has('1'));
    t.deepEqual(bar.c[SymMeta].patch, [ 'c', 'd' ]);
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
    t.true(bar.a.b[SymMeta].additions.has('1'));
    t.deepEqual(bar.a.b[SymMeta].patch, [ { c: 'd' }, 'new value']);
    t.deepEqual(bar.a.b[SymMeta].patch[0][SymMeta].patch, { c: 'd' });
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
    t.true(bar[SymMeta].deletions.has('b'));
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
    t.true(bar.b.c[SymMeta].deletions.has('d'));
    t.deepEqual(bar.b.c[SymMeta].patch, {});
    bar.b.c.a = "a";
    t.true(bar.b.c[SymMeta].additions.has('a'));
    t.false(bar.b.c[SymMeta].deletions.has('a'));
    t.deepEqual(bar.b.c[SymMeta].patch, { a: "a" });
    delete bar.b.c.a;
    t.true(bar.b.c[SymMeta].deletions.has('a'));
    t.deepEqual(bar.b.c[SymMeta].patch, {});
});

test('splice shallow', t => {
    const foo = [ 'a', 'b', 'c' ];
    const bar = clone(foo);
    bar.splice(1);
    t.deepEqual(foo, [ 'a', 'b', 'c' ]);
    t.deepEqual(bar, [ 'a' ]);
    t.deepEqual(bar[SymMeta].patch, [ 'a' ]);
    t.true(bar[SymMeta].deletions.has('1'));
    t.true(bar[SymMeta].deletions.has('2'));
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
    t.true(bar[SymMeta].patch.a[Sym]);
    t.deepEqual(bar.a[SymMeta].patch, [ 'a' ]);
    t.true(bar.a[SymMeta].deletions.has('1'));
    t.true(bar.a[SymMeta].deletions.has('2'));
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

// TODO - untested array prototype methods - many likely need shims:
// flat
// forEach
// includes
// indexOf
// join
// keys
// lastIndexOf
// slice
// some
// sort
// toLocaleString
// toString
// values
