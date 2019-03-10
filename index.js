'use strict';

const {
    Sym,
    SymMeta
} = require('./Sym');

const ArrayPrototype = require('./Array');

const {
    reduce,
    lengthFromKeys,
    deepFreeze
} = require('./util');

function mediary(given) {
    if (given == null || typeof given !== 'object' || given[Sym]) return given;

    if (!(Object.is(given.constructor, Object) || Object.is(given.constructor, Array) || Object.is(given.constructor, void 0))) {
        throw new TypeError('mediary only supports cloning simple objects (constructor must be `Object`, `Array` or `undefined`)');
    }

    deepFreeze(given);

    const isArray = Array.isArray(given);
    const givenKeys = Reflect.ownKeys(given);
    const patch = isArray ? [] : {};
    if (isArray) Reflect.setPrototypeOf(patch, ArrayPrototype);
    const additions = new Set();
    const deletions = new Set();

    const ownKeys = () => new Set([
        ...givenKeys.filter(k => !deletions.has(k)),
        ...additions
    ]);

    const changes = {
        add (p) {
            additions.add(String(p)),
            deletions.delete(String(p))
        },
        delete (p) {
            deletions.add(String(p)),
            additions.delete(String(p))
        },
        added (p) {
            return additions.has(String(p));
        },
        deleted (p) {
            return deletions.has(String(p));
        },
        touched (p) {
            return additions.has(String(p)) || deletions.has(String(p));
        }
    };

    const meta = {
        target: given,
        additions,
        deletions,
        patch,
        isArray,
        ownKeys
    };

    return new Proxy(patch, {

        defineProperty(target, prop, attr) {
            changes.add(prop);
            return Reflect.defineProperty(target, prop, attr);
        },

        deleteProperty(target, prop) {
            changes.delete(prop);
            return Reflect.deleteProperty(target, prop);
        },

        getPrototypeOf (target) {
            return Reflect.getPrototypeOf(target);
        },

        setPrototypeOf (target, prototype) {
            return Reflect.getPrototypeOf(target, prototype);
        },

        ownKeys (target) {
            return [ ...ownKeys() ];
        },

        has (target, prop) {
            return !changes.deleted(prop) && (additions.has(prop) || Reflect.has(given));
        },

        getOwnPropertyDescriptor (target, prop) {
            if (changes.deleted(prop) || [ Sym, SymMeta ].includes(prop)) return void 0;

            const desc = Reflect.has(target, prop)
                ? Reflect.getOwnPropertyDescriptor(target, prop)
                : Reflect.getOwnPropertyDescriptor(given, prop);

            if (isArray && prop === 'length') {
                return {
                    writable: true,
                    configurable: false,
                    enumerable: false,
                    value: lengthFromKeys([ ...ownKeys() ])
                };
            }

            return desc && !deletions.has(prop)
                ? { ...desc, writable: true, configurable: true }
                : void 0;
        },

        get (target, prop, receiver) {
            if (prop === Sym) return true;
            if (prop === SymMeta) return meta;
            if (changes.deleted(prop)) return void 0;
            if (prop === 'length' && isArray) {
                return lengthFromKeys([ ...ownKeys() ]);
            }

            if (!changes.touched(prop) && givenKeys.includes(prop)) {
                changes.add(prop);
                target[prop] = mediary(given[prop]);
            }

            const value = Reflect.has(target, prop)
                ? Reflect.get(target, prop)
                : Reflect.get(given, prop);

            return value;
        },

        set (target, prop, value, receiver) {
            if (prop === 'length' && isArray) {
                const length = lengthFromKeys([ ...ownKeys() ]);
                const v = parseInt(value, 10);
                let i = v;
                while (length > i) {
                    changes.delete(i);
                    Reflect.deleteProperty(target, i);
                    i++;
                }

                i = length;
                while (v > i) {
                    changes.add(i);
                    Reflect.set(target, i, void 0);
                    i++;
                }
            }
            changes.add(prop);
            return Reflect.set(target, prop, value);
        }
    });

}

function realize(given) {
    if (given == null
        || typeof given !== 'object'
        || !given[Sym]) return given;
    const {
        target,
        patch,
        ownKeys
    } = given[SymMeta];
    return reduce([ ...ownKeys() ], (acc, k) => {
        acc[k] = realize(given[k]);
        return acc;
    });
}

exports.clone = given => mediary(realize(given));
exports.realize = realize;
exports.mediary = mediary;
exports.Sym = Sym;
exports.SymMeta = SymMeta;


// Below are some functions which support immer's `produce` pattern.

// `produce` is a drop-in replacement for immer `produce`. returns plain old
// javascript object, just like immer. Warning: Performance of `produce` is
// poor. This is an antipattern in mediary. This function is here to provide
// a possible migration path. If you need something similar but want good
// performance please consider using the `create` function below instead.
exports.produce = (given, fn) => {
    const cloned = mediary(given);
    fn(cloned);
    return realize(cloned);
};

// `create` returns a mediary object. With mediary there is usually no need to
// ever "realize" the object. If you really want to use immer's `produce`
// pattern and you want good performance use the `create` method. But if you
// are thinking about using this, ask yourself "why am I using immer's pattern
// when I now have a transparent virtualization?". Again, this is here to
// provide a migration path.
exports.create = (given, fn) => {
    const cloned = mediary(given);
    fn(cloned);
    return cloned;
};
