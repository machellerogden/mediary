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

function ownKeys() {
    return new Set([
        ...this.givenKeys.filter(k => !this.deletions.has(k)),
        ...this.additions
    ]);
}

function ObjectPrototype(given) {
    this.given = given;
    this.givenKeys = Reflect.ownKeys(given);
    this.additions = new Set();
    this.deletions = new Set();
    this.ownKeys = ownKeys;
    this.meta = {
        target: given,
        additions: this.additions,
        deletions: this.deletions,
        patch: this,
        ownKeys: ownKeys.bind(this)
    };

}

const objectHandler = {

    defineProperty(target, prop, attr) {
        target.additions.add(String(prop));
        target.deletions.delete(String(prop));
        return Reflect.defineProperty(target, prop, attr);
    },

    deleteProperty(target, prop) {
        target.deletions.add(String(prop));
        target.additions.delete(String(prop));
        return Reflect.deleteProperty(target, prop);
    },

    ownKeys (target) {
        return [ ...target.ownKeys() ];
    },

    has (target, prop) {
        return !target.deletions.has(String(prop)) && target.additions.has(prop) || Reflect.has(given);
    },

    getOwnPropertyDescriptor (target, prop) {
        if (target.deletions.has(String(prop)) || [ Sym, SymMeta ].includes(prop)) return void 0;

        const desc = Reflect.has(target, prop)
            ? Reflect.getOwnPropertyDescriptor(target, prop)
            : Reflect.getOwnPropertyDescriptor(target.given, prop);

        return desc && !target.deletions.has(prop)
            ? { ...desc, writable: true, configurable: true }
            : void 0;
    },

    get (target, prop, receiver) {
        if (prop === Sym) return true;
        if (prop === SymMeta) return target.meta;
        if (target.deletions.has(prop)) return void 0;

        if (!(target.additions.has(String(prop)) || target.deletions.has(String(prop))) && target.givenKeys.includes(prop)) {
            target.additions.add(String(prop));
            target.deletions.delete(String(prop));
            target[prop] = mediary(target.given[prop]);
        }

        const value = Reflect.has(target, prop)
            ? Reflect.get(target, prop)
            : Reflect.get(target.given, prop);

        return value;
    },

    set (target, prop, value, receiver) {
        target.additions.add(String(prop));
        target.deletions.delete(String(prop));
        return Reflect.set(target, prop, value);
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

    Reflect.setPrototypeOf(patch, new ObjectPrototype(given));

    return new Proxy(patch, objectHandler);
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
