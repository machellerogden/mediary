'use strict';

const {
    Sym,
    SymMeta
} = require('./Sym');

const {
    reduce,
    deepFreeze,
    isNumber
} = require('./util');

const ArrayHandler = {
    get (target, prop, receiver) {
        if (prop === Sym) return true;
        if (isNumber(prop)) target[prop] = mediary(target[prop]);
        return Reflect.get(target, prop, receiver);
    }
};

function validateObject(given) {
    if (!(Object.is(given.constructor, Object) || Object.is(given.constructor, void 0))) {
        throw new TypeError('mediary only supports cloning simple objects (constructor must be `Object`, `Array` or `undefined`)');
    }
}

const internals = new WeakMap();

const ObjectHandler = {

    defineProperty(target, prop, attr) {
        const meta = internals.get(target);
        meta.additions.add(String(prop));
        meta.deletions.delete(String(prop));
        return Reflect.defineProperty(meta.patch, prop, attr);
    },

    deleteProperty(target, prop) {
        const meta = internals.get(target);
        meta.deletions.add(String(prop));
        meta.additions.delete(String(prop));
        return Reflect.deleteProperty(meta.patch, prop);
    },

    ownKeys (target) {
        return [ ...internals.get(target).ownKeys() ];
    },

    has (target, prop) {
        const meta = internals.get(target);
        return !meta.deletions.has(String(prop)) && (meta.additions.has(String(prop)) || Reflect.has(meta.target));
    },

    getOwnPropertyDescriptor (target, prop) {
        const meta = internals.get(target);
        if (meta.deletions.has(String(prop)) || [ Sym, SymMeta ].includes(prop)) return void 0;

        const desc = Reflect.has(meta.patch, prop)
            ? Reflect.getOwnPropertyDescriptor(meta.patch, prop)
            : Reflect.getOwnPropertyDescriptor(meta.target, prop);

        return desc && !meta.deletions.has(String(prop))
            ? { ...desc, writable: true, configurable: true }
            : void 0;
    },

    get (target, prop, receiver) {
        if (prop === Sym) return true;
        const meta = internals.get(target);
        if (prop === SymMeta) return meta;
        if (meta.deletions.has(String(prop))) return void 0;

        if (!(meta.additions.has(String(prop)) || meta.deletions.has(String(prop))) && meta.givenKeys.includes(prop)) {
            meta.additions.add(String(prop));
            meta.deletions.delete(String(prop));
            meta.patch[prop] = mediary(meta.target[prop]);
        }

        const value = Reflect.has(meta.patch, prop)
            ? Reflect.get(meta.patch, prop)
            : Reflect.get(meta.target, prop);

        return value;
    },

    set (target, prop, value, receiver) {
        const meta = internals.get(target);
        meta.additions.add(String(prop));
        meta.deletions.delete(String(prop));
        return Reflect.set(meta.patch, prop, value);
    }
};

function mediary(given) {
    if (given == null
        || typeof given !== 'object'
        || given[Sym]) return given;

    deepFreeze(given);

    if (Array.isArray(given)) return new Proxy([ ...given ], ArrayHandler);

    validateObject(given);

    const patch = {};

    const meta = {
        target: given,
        patch,
        givenKeys: Reflect.ownKeys(given),
        additions: new Set(),
        deletions: new Set(),
        ownKeys() {
            return new Set([
                ...this.givenKeys.filter(k => !this.deletions.has(k)),
                ...this.additions
            ]);
        }
    };

    const key = {};
    internals.set(key, meta);
    return new Proxy(key, ObjectHandler);
}

const clone = x => Array.isArray(x)
    ? x.map(clone)
    : x != null && typeof x === 'object'
        ? Object.entries(x).reduce((a, [k, v]) => (a[k] = clone(v), a), {})
        : x;

function realize(given) {
    if (given == null
        || typeof given !== 'object'
        || !given[Sym]) return given;
    return clone(given);
}

exports.realize = realize;
exports.clone = given => mediary(realize(given));
exports.mediary = mediary;
exports.Sym = Sym;
exports.SymMeta = SymMeta;

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
