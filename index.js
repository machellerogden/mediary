'use strict';

const {
    debug,
    reduce,
    toArray,
    getNumeric,
    deepFreeze
} = require('./util');

const Sym = Symbol('mediary');
const SymMeta = Symbol('mediary.meta');

function mediary(given) {
    if (given == null
        || typeof given !== 'object'
        || given[Sym]
        || !(Object.is(given.constructor, Object) || Object.is(given.constructor, Array)))
        return given;

    deepFreeze(given);

    const isArray = Array.isArray(given);
    const givenKeys = Reflect.ownKeys(given);

    const patch = isArray ? [] : {};
    const additions = new Set();
    const deletions = new Set();
    const ownKeys = () => new Set([
        ...additions,
        ...givenKeys.filter((_, k) => !deletions.has(k))
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

    const overlay = new Proxy(patch, {

        defineProperty(target, prop, attr) {
            changes.add(prop);
            return Reflect.defineProperty(target, prop, attr);
        },

        deleteProperty(target, prop) {
            changes.delete(prop);
            return Reflect.deleteProperty(target, prop);
        },

        getOwnPropertyDescriptor (target, prop) {
            if (changes.deleted(prop) || [ Sym, SymMeta ].includes(prop)) return void 0;

            if (!changes.touched(prop) && givenKeys.includes(prop)) {
                changes.add(prop);
                target[prop] = mediary(given[prop]);
            }

            return changes.added(prop)
                ? Reflect.getOwnPropertyDescriptor(target, prop)
                : givenKeys.includes(prop)
                    ? {
                        ...Reflect.getOwnPropertyDescriptor(given, prop),
                        writable: true,
                        configurable: isArray || prop !== 'length'
                      }
                    : void 0;
        },

        get (target, prop, receiver) {
            if (prop === Sym) return true;
            if (prop === SymMeta) return meta;

            if (changes.deleted(prop)) return void 0;

            if (prop === 'length' && isArray) {
                return Math.max.apply(null, getNumeric([ ...ownKeys() ].filter(k => !changes.deleted(k)))) + 1;
            }

            if (!changes.touched(prop) && givenKeys.includes(prop)) {
                changes.add(prop);
                target[prop] = mediary(given[prop]);
            }

            return additions.has(String(prop))
                ? Reflect.get(target, prop)
                : Reflect.get(given, prop);
        },
        set (target, prop, value, receiver) {
            if (prop === 'length' && isArray) {
                const length = Math.max.apply(null, getNumeric([ ...ownKeys() ])) + 1;
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
            return Reflect.set(target, prop, value, receiver);
        }
    });

    const handler = {

        defineProperty(target, prop, attr) {
            return Reflect.defineProperty(target, prop, attr);
        },

        deleteProperty(target, prop) {
            return Reflect.deleteProperty(target, prop);
        },

        isExtensible(target) {
            return Reflect.isExtensible(target);
        },

        preventExtensions(target) {
            return Reflect.preventExtensions(target);
        },

        get (target, prop, receiver) {
            return Reflect.get(target, prop);
        },

        getOwnPropertyDescriptor (target, prop) {
            return Reflect.getOwnPropertyDescriptor(target, prop);
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

        has (target, prop) { // TODO: can be deleted and still has'd via of prototype... need to fix
            return !changes.deleted(prop) && (Reflect.has(target, prop) || Reflect.has(given, prop));
        },

        set (target, prop, value, receiver) {
            return Reflect.set(target, prop, value, receiver);
        }
    }

    return new Proxy(overlay, handler);
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
    return [ ...ownKeys() ].reduce((acc, k) => {
        acc[k] = Reflect.has(patch, k)
            ? patch[k]
            : target[k];
        return acc;
    }, isArray ? [] : {});
}

const clone = given => mediary(realize(given));

exports.realize = realize;
exports.mediary = mediary;
exports.clone = clone;
exports.Sym = Sym;
exports.SymMeta = SymMeta;
