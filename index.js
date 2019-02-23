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

    const meta = {
        target: given,
        additions,
        deletions,
        patch,
        isArray,
        ownKeys
    };

    const overlay = new Proxy(patch, {
        get (target, prop, receiver) {
            return Reflect.has(target, prop)
                ? Reflect.get(target, prop)
                : Reflect.get(given, prop);
        },
        set (target, prop, value, receiver) {
            if (prop === 'length' && isArray) {
                // not this ... WIP
                givenKeys.forEach(key => {
                    console.log('key', key);
                    console.log('typeof key', typeof key);
                    if (!deletions.has(key)) {
                        additions.add(key);
                        Reflect.set(target, key, value, receiver);
                    }
                });
            } else {
                return Reflect.set(target, prop, value, receiver);
            }
        }
    });

    const handler = {

        defineProperty(target, prop, attr) {
            additions.add(prop);
            return Reflect.defineProperty(target, prop, attr);
        },

        deleteProperty(target, prop) {
            deletions.add(prop);
            return Reflect.deleteProperty(target, prop);
        },

        isExtensible(target) {
            return Reflect.isExtensible(target);
        },

        preventExtensions(target) {
            return Reflect.preventExtensions(target);
        },

        get (target, prop, receiver) {
            if (prop === Sym) return true;
            if (prop === SymMeta) return meta;

            if (prop === 'length' && isArray) return Math.max.apply(null, getNumeric([ ...ownKeys() ])) + 1;

            if (deletions.has(prop)) return void 0;

            if (givenKeys.includes(prop) || Reflect.ownKeys(target).includes(prop)) {
                target[prop] = mediary(target[prop]);
            }

            return Reflect.get(target, prop);
        },

        getOwnPropertyDescriptor (target, prop) {
            if (deletions.has(prop) || [ Sym, SymMeta ].includes(prop)) return void 0;
            if (givenKeys.includes(prop) || Reflect.ownKeys(target).includes(prop)) {
                target[prop] = mediary(target[prop]);
            }
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

        has (target, prop) {
            return !deletions.has(prop) && (Reflect.has(target, prop) || Reflect.has(given, prop));
        },

        set (target, prop, value, receiver) {
            additions.add(prop);
            return Reflect.set(target, prop, value);
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
