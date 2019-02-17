'use strict';

import test from 'ava';
import mediary, { PatchSymbol } from '.';

test('shallow', t => {
    const foo = {
        a: 'b'
    };
    const bar = mediary(foo);
    bar.a = 'c';
    bar.b = 'd';
    t.is(foo.a, 'b');
    t.is(bar.a, 'c');
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
    const bar = mediary(foo);
    bar.a.b[0].c = 'z';
    bar.a.e = 'z';
    t.is(foo.a.b[0].c, 'd');
    t.is(bar.a.b[0].c, 'z');
    t.is(foo.a.e, 'f');
    t.is(bar.a.e, 'z');
});

test('push 1', t => {
    const foo = {
        a: {
            b: 'b',
        },
        c: [ 'c' ]
    };
    const bar = mediary(foo);
    bar.c.push('d');
    t.deepEqual(foo.c, [ 'c' ]);
    t.deepEqual(bar.c, [ 'c', 'd' ]);
    t.deepEqual(bar.c[PatchSymbol], [ void 0, 'd' ]);
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
    const bar = mediary(foo);
    bar.a.b.push('new value');
    t.deepEqual(foo.a.b, [ { c: 'd' } ]);
    t.deepEqual(bar.a.b, [ { c: 'd' }, 'new value' ]);
    t.deepEqual(bar.a.b[PatchSymbol], [ void 0, 'new value' ]);
});

test('spread 1', t => {
    const foo = {
        a: {
            b: 'b',
            c: 'c'
        }
    };
    const bar = mediary(foo);
    bar.a = { ...bar.a, ...{ d: 'd'} };
    t.deepEqual(foo.a, { b: 'b', c: 'c' });
    t.deepEqual(bar.a, { b: 'b', c: 'c', d: 'd' });
    t.deepEqual(foo, { a: { b: 'b', c: 'c' } });
    t.deepEqual(bar[PatchSymbol], {});
    t.deepEqual(bar.a[PatchSymbol], { d: 'd' });
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
    const bar = mediary(foo);
    bar.a.c = { ...bar.a.c, ...{ e: 'e'} };
    t.deepEqual(foo.a.c, { d: 'd' });
    t.deepEqual(bar.a.c, { d: 'd', e: 'e' });
    t.deepEqual(foo, { a: { b: 'b', c: { d: 'd' } } });
    t.deepEqual(bar[PatchSymbol], {});
    t.deepEqual(bar.a[PatchSymbol], {});
    t.deepEqual(bar.a.c[PatchSymbol], { e: 'e' });
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
    const bar = mediary(foo);
    bar.a.c = [ ...bar.a.c, 'e' ];
    t.deepEqual(foo.a.c, [ 'd' ]);
    t.deepEqual(bar.a.c, [ 'd', 'e' ]);
    t.deepEqual(foo, { a: { b: 'b', c: [ 'd' ] } });
    t.deepEqual(bar[PatchSymbol], {});
    t.deepEqual(bar.a[PatchSymbol], {});
    t.deepEqual(bar.a.c[PatchSymbol], [ void 0, 'e' ]);
});

test('spread 4', t => {
    const foo = {
        a: {
            b: 'b',
        },
        c: [ { d: 'd'} ]
    };
    const bar = mediary(foo);
    bar.c[0] = { ...bar.c[0], ...{ another: 'entry' } };
    t.deepEqual(bar.c[PatchSymbol], []);
    t.deepEqual(bar.c[0][PatchSymbol], { another: 'entry' });
});

test('set an array', t => {
    const foo = {
        a: {
            b: 'b',
        }
    };
    const bar = mediary(foo);
    bar.c = [ 'c', 'd' ];
    t.deepEqual(bar.c, [ 'c', 'd' ]);
    t.deepEqual(bar[PatchSymbol], { c: [ 'c', 'd' ] });
});

test('base array', t => {
    const foo = [
        {
            a: 'a',
        }
    ];
    const bar = mediary(foo);
    bar[1] = 'b';
    t.deepEqual(bar, [ { a: 'a' }, 'b' ]);
    t.deepEqual(bar[PatchSymbol], [ void 0, 'b' ]);
});

test('base array 2', t => {
    const foo = [
        {
            a: 'a',
        }
    ];
    const bar = mediary(foo);
    bar.push('b');
    t.deepEqual(bar, [ { a: 'a' }, 'b' ]);
    t.deepEqual(bar[PatchSymbol], [ void 0, 'b' ]);
});
