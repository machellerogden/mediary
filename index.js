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

const nil = void 0;

const ArrayHandler = {
    get (target, prop, receiver) {
        if (prop === Sym) return true;
        if (isNumber(prop)) target[prop] = mediary(target[prop]);
        return Reflect.get(target, prop, receiver);
    }
};

function validateObject(given) {
    if (!(Object.is(given.constructor, Object) || Object.is(given.constructor, nil))) {
        throw new TypeError('mediary only supports cloning simple objects (constructor must be `Object`, `Array` or `undefined`)');
    }
}

const internals = new WeakMap();

const ObjectHandler = {

    defineProperty (target, prop, attr) {
        const meta = internals.get(target);
        meta.additions.add(String(prop));
        meta.deletions.delete(String(prop));
        return Reflect.defineProperty(meta.patch, prop, attr);
    },

    deleteProperty (target, prop) {
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
        return !meta.deletions.has(prop) && (meta.additions.has(prop) || Reflect.has(meta.target, prop));
    },

    getOwnPropertyDescriptor (target, prop) {
        const meta = internals.get(target);
        if (meta.deletions.has(prop) || [ Sym, SymMeta ].includes(prop)) return nil;

        const desc = Reflect.has(meta.patch, prop)
            ? Reflect.getOwnPropertyDescriptor(meta.patch, prop)
            : Reflect.getOwnPropertyDescriptor(meta.target, prop);

        return desc && !meta.deletions.has(prop)
            ? { ...desc, writable: true, configurable: true }
            : nil;
    },

    get (target, prop, receiver) {
        if (prop === Sym) return true;
        const meta = internals.get(target);
        if (prop === SymMeta) return meta;
        if (meta.deletions.has(prop)) return nil;

        if (!meta.touched(prop) && meta.givenKeys.includes(prop)) {
            meta.additions.add(prop);
            meta.deletions.delete(prop);
            return meta.patch[prop] = mediary(meta.target[prop]);
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

function touched(prop) {
    return this.additions.has(prop) || this.deletions.has(prop);
}

function ownKeys() {
    return new Set([
        ...this.givenKeys.filter(k => !this.deletions.has(k)),
        ...this.additions
    ]);
}

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
        givenKeys: Object.getOwnPropertyNames(given),
        additions: new Set(),
        deletions: new Set(),
        touched,
        ownKeys
    };

    const key = {};
    internals.set(key, meta);
    return new Proxy(key, ObjectHandler);
}

function realize(given) {
    if (given == null
        || typeof given !== 'object'
        || !given[Sym]) return given;

    let result;

    if (Array.isArray(given)) {
        result = [];
        let i = given.length;
        while (i-- > 0) result[i] = realize(given[i]);
    } else {
        result = {};
        let meta = given[SymMeta];
        let keys = Object.getOwnPropertyNames(given);
        let i = keys.length;
        while (i-- > 0) {
            let prop = keys[i];
            if (meta.additions.has(prop)) {
                result[prop] = realize(given[prop]);
            } else {
                result[prop] = meta.target[prop];
            }
        }
    }
    return result;
}

exports.realize = realize;
exports.clone = given => mediary(realize(given));
exports.mediary = mediary;
exports.Sym = Sym;
exports.SymMeta = SymMeta;

// `produce` is a drop-in replacement for immer `produce`. This function
// is here to provide a possible migration path.
exports.produce = (given, fn) => {
    const cloned = mediary(realize(given));
    fn(cloned);
    return cloned;
};
