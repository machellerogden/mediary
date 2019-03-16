'use strict';

const {
    Sym,
    SymMeta
} = require('./Sym');

const {
    reduce,
    deepFreeze
} = require('./util');

const unsupported = given =>
    given == null
    || typeof given !== 'object'
    || Array.isArray(given);

const mediateNestedArrays = (given, recurrence) =>
    Array.isArray(given)
        ? given.map(v => Array.isArray(v)
            ? mediateNestedArrays(v)
            : mediary(v, recurrence))
        : mediary(given, recurrence);

function mediary(given, recurrence) {
    if (Array.isArray(given) && !recurrence) return mediateNestedArrays(given, false);
    if (unsupported(given) || given[Sym]) return given;

    if (!(Object.is(given.constructor, Object) || Object.is(given.constructor, void 0))) {
        throw new TypeError('mediary only supports cloning simple objects (constructor must be `Object` or `undefined`)');
    }

    deepFreeze(given);

    const givenKeys = Reflect.ownKeys(given);
    const patch = {};
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

            return desc && !deletions.has(prop)
                ? { ...desc, writable: true, configurable: true }
                : void 0;
        },

        get (target, prop, receiver) {
            if (prop === Sym) return true;
            if (prop === SymMeta) return meta;
            if (changes.deleted(prop)) return void 0;

            if (!changes.touched(prop) && givenKeys.includes(prop)) {
                changes.add(prop);
                if (Array.isArray(given[prop])) {
                    target[prop] = mediateNestedArrays(given[prop], true);
                } else {
                    target[prop] = mediary(given[prop], true);
                }
            }

            const value = Reflect.has(target, prop)
                ? Reflect.get(target, prop)
                : Reflect.get(given, prop);

            return value;
        },

        set (target, prop, value, receiver) {
            changes.add(prop);
            return Reflect.set(target, prop, value);
        }
    });

}
const clone = x => Array.isArray(x)
    ? x.map(clone)
    : x != null && typeof x === 'object'
        ? Object.entries(x).reduce((a, [k, v]) => (a[k] = clone(v), a), {})
        : x;

function realize(given) {
    if (Array.isArray(given)) return given.map(realize);
    if (unsupported(given) || !given[Sym]) return given;
    return clone(given);
}

exports.realize = realize;
exports.clone = given => mediary(realize(given));
exports.mediary = mediary;
exports.Sym = Sym;
exports.SymMeta = SymMeta;

// Below are some functions which support immer's `produce` pattern.

// `produce` is a drop-in replacement for immer `produce`. This function
// is here to provide a possible migration path. Note that `produce`
// returns a mediary object, unlike immer's `produce` which returns a
// plain old javascript object. With mediary there is no need to
// ever "realize" the object.
exports.produce = (given, fn) => {
    const cloned = mediary(realize(given));
    fn(cloned);
    return cloned;
};
