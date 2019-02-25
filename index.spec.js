'use strict';

import test from 'ava';
import { clone, Sym, SymMeta } from '.';

test('shallow', t => {
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

test('deep', t => {
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
    t.deepEqual(bar.c[SymMeta].patch, [ 'c', 'd' ]); // TODO: 'c' is coming from original object, though it's hard to write the proof here ... need better inspection capabilities
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
    t.deepEqual(bar.a.b[SymMeta].patch, [ { c: 'd' }, 'new value']); // TODO: same as above, { c: 'd' } is coming from original object
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
    t.deepEqual(bar[SymMeta].patch, { a: { b: 'b', c: 'c', d: 'd' } }); // TODO: more to test in terms of deep patching
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
    t.deepEqual(bar[SymMeta].patch, [ { a: 'a' }, 'b' ]);
});

test('delete', t => {
    const foo = {
        a: 'a',
        b: 'b'
    };
    const bar = clone(foo);
    delete bar.b;
    t.deepEqual(foo, { a: 'a', b: 'b' });
    t.deepEqual(bar, { a: 'a' });
    t.true(bar[SymMeta].deletions.has('b'));
    t.deepEqual(bar[SymMeta].patch, { a: 'a' }); // TODO: 'a' is coming from original object ... need a test to prove it
});
