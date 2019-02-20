'use strict';

import test from 'ava';
import mediary, { Sym, SymPatches } from '.';

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
    t.deepEqual(bar.c[SymPatches][0], {
        A: '1',
        value: 'd',
        inArray: true
    });
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
    t.deepEqual(bar.a.b[SymPatches][0], {
        A: '1',
        value: 'new value',
        inArray: true
    });
});

// TODO
test.skip('change length', t => {
    const foo = {
        a: {
            b: [ 1, 2, 3 ]
        }
    };
    const bar = mediary(foo);
    bar.a.b.length = 1;
    t.deepEqual(foo.a.b, [ 1, 2, 3 ]);
    t.deepEqual(bar.a.b, [ 1 ]);
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
    t.deepEqual(bar[SymPatches][0], {
        A: 'a',
        value: {
            b: 'b',
            c: 'c',
            d: 'd'
        },
        inArray: false
    });
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
    t.deepEqual(bar.a[SymPatches][0], {
        A: 'c',
        value: { 
            d: 'd',
            e: 'e'
        },
        inArray: false
    });
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
    t.deepEqual(bar.a[SymPatches][0], {
        A: 'c',
        value: [ 'd', 'e' ],
        inArray: false
    });
});

test('spread 4', t => {
    const foo = {
        a: {
            b: 'b',
        },
        c: [ { d: 'd' } ]
    };
    const bar = mediary(foo);
    bar.c[0] = { ...bar.c[0], ...{ another: 'entry' } };

    t.deepEqual(bar.a, {
        b: 'b',
    });

    t.deepEqual(bar.c,[
        { d: 'd', another: 'entry' }
    ]);

    t.deepEqual(bar.c[SymPatches][0], {
        A: '0',
        value: {
            d: 'd',
            another: 'entry'
        },
        inArray: true
    });
});

test('set an array', t => {
    const foo = {
        a: {
            b: 'b'
        }
    };
    const bar = mediary(foo);
    bar.c = [ 'c', 'd' ];
    t.deepEqual(bar.c, [ 'c', 'd' ]);
    t.deepEqual(bar[SymPatches][0], {
        A: 'c',
        value: [ 'c', 'd' ],
        inArray: false
    });
});

test('base array', t => {
    const foo = [
        {
            a: 'a'
        }
    ];
    const bar = mediary(foo);
    bar[1] = 'b';
    t.deepEqual(bar[0], { a: 'a' });
    t.deepEqual(bar[1], 'b');
    t.deepEqual(bar.length, 2);
    t.deepEqual(bar[SymPatches][0], {
        A: '1',
        value: 'b',
        inArray: true
    });
});

test('base array 2', t => {
    const foo = [
        {
            a: 'a'
        }
    ];
    const bar = mediary(foo);
    bar.push('b');
    t.deepEqual(bar, [ { a: 'a' }, 'b' ]);
    t.deepEqual(bar[SymPatches][0], {
        A: '1',
        value: 'b',
        inArray: true
    });
});
