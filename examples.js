'use strict'
// require Mediary

const Mediary = require('.');

const foo = {
    bar: {
        baz: [ 'qux' ]
    }
};

// Call any object once with Mediary.

const mediatedFoo = Mediary(foo);

// An immutable object representation will be returned. To demonstration this, let's assert the equality of our example objects.

const assert = require('assert');

assert.deepEqual(foo, mediatedFoo);

// We may now perform any native operation on this object without fear of mutating the original object.

mediatedFoo.bar.baz.push('boom');

// Let's assert again to make sure we know what's happening...

assert.deepEqual(foo, { bar: { baz: [ 'qux' ] } });
assert.deepEqual(mediatedFoo, { bar: { baz: [ 'qux', 'boom' ] } });

// The returned object is not a clone but rather it's a wrapper around the original object which mediates via patches which are applied via proxies and reflection.

// In order to see this however, we need to inspect the internal patches with Mediary has applied. Mediary exports a `PatchSymbol` which can be used for this purpose.

const { PatchSymbol } = Mediary;

assert(mediatedFoo.bar.baz[PatchSymbol], [ void 0, 'boom' ]);

// A sparse array is defined in this case, show that this was the only new object representation overlayed on the original data.

// Mediary can even efficiently create patches for changes which arrive via the native spread operator.

mediatedFoo.bar = { ...mediatedFoo.bar, ...{ bam: 'boom' } };

assert.deepEqual(foo, { bar: { baz: [ 'qux' ] } });
assert.deepEqual(mediatedFoo.bar[PatchSymbol], { bam: 'boom' });

// One caveat... there is a known bug which is proving difficult to track down.
// Patched array representations become serialized with string keys in addition to their number indexes.

try {
    assert.deepEqual(mediatedFoo, { bar: { baz: [ 'qux', 'boom' ] }, bam: 'boom' });
} catch (e) {
    console.log(e.message);
    // => { bar: { baz: [ 'qux', 'boom', '0': 'qux', '1': 'boom' ], bam: 'boom' } } deepEqual { bar: { baz: [ 'qux', 'boom' ] }, bam: 'boom' } 
}
