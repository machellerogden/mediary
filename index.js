'use strict';

const {
    debug,
    reduce,
    toArray,
    lengthFromKeys,
    deepFreeze
} = require('./util');

const Sym = Symbol('mediary');
const SymMeta = Symbol('mediary.meta');

function mediary(given) {
    if (given == null || typeof given !== 'object' || given[Sym]) return given;

    if (!(Object.is(given.constructor, Object) || Object.is(given.constructor, Array))) {
        throw new TypeError('mediary only supports cloning simple objects (constructor must be `Object` or `Array`)');
    }

    deepFreeze(given);

    const isArray = Array.isArray(given);
    const givenKeys = Reflect.ownKeys(given);
    const patch = isArray ? [] : {};
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
    if (typeof given !== 'object'
        || !given[Sym]) return given;
    const {
        target,
        patch,
        ownKeys,
        isArray
    } = given[SymMeta];
    return reduce([ ...ownKeys() ], (acc, k) => {
        acc[k] = Reflect.has(patch, k)
            ? patch[k]
            : target[k];
        return acc;
    });
}

const clone = given => mediary(realize(given));

exports.realize = realize;
exports.mediary = mediary;
exports.clone = clone;
exports.Sym = Sym;
exports.SymMeta = SymMeta;
