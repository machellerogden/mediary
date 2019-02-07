'use strict';

import test from 'ava';
import mediary, { PatchSymbol } from '.';

test('shallow mediation', t => {
    const foo = {
        a: 'b'
    };
    const bar = mediary(foo);
    bar.a = 'c';
    bar.b = 'd';
    t.is(foo.a, 'b');
    t.is(bar.a, 'c');
});

test('deep mediation', t => {
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

test('push', t => {
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

test('spread', t => {
    const foo = {
        something: {
            a: 'a',
            b: 'b'
        }
    };
    const bar = mediary(foo);
    bar.something = { ...bar.something, ...{ c: 'c'} };
    t.deepEqual(foo.something, { a: 'a', b: 'b' });
    t.deepEqual(bar.something, { a: 'a', b: 'b', c: 'c' });
    t.deepEqual(foo, { something: { a: 'a', b: 'b' } });
    // TODO: consider using something like deep-object-diff detailed patching to make this stuff more efficient
    t.deepEqual(bar[PatchSymbol], { something: { a: 'a', b: 'b', c: 'c' } });
});
