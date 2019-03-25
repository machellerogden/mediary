'use strict';

const {
    Sym,
    SymMeta
} = require('./Sym');

const {
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

const ObjectHandler = {

    defineProperty (meta, prop, attr) {
        addPatch(meta, prop);
        return Reflect.defineProperty(meta.patch, prop, attr);
    },

    getPrototypeOf (meta) {
        return Reflect.getPrototypeOf(meta.patch);
    },

    setPrototypeOf (meta) {
        return Reflect.setPrototypeOf(meta.patch);
    },

    deleteProperty (meta, prop) {
        rmPatch(meta, prop);
        return Reflect.deleteProperty(meta.patch, prop);
    },

    ownKeys (meta) {
        return [ ...meta.props ];
    },

    has (meta, prop) {
        return !meta.deletedProps.has(prop) && (meta.patchedProps.has(prop) || Reflect.has(meta.target, prop));
    },

    getOwnPropertyDescriptor (meta, prop) {
        if (meta.deletedProps.has(prop) || [ Sym, SymMeta ].includes(prop)) return nil;

        const desc = Reflect.has(meta.patch, prop)
            ? Reflect.getOwnPropertyDescriptor(meta.patch, prop)
            : Reflect.getOwnPropertyDescriptor(meta.target, prop);

        return desc && !meta.deletedProps.has(prop)
            ? { ...desc, writable: true, configurable: true }
            : nil;
    },

    get (meta, prop, receiver) {
        if (prop === Sym) return true;
        if (prop === SymMeta) return meta;
        if (meta.deletedProps.has(prop)) return nil;
        if (meta.patchedProps.has(prop)) return Reflect.get(meta.patch, prop);
        if (meta.givenProps.has(prop)) {
            meta.patchedProps.add(prop);
            return meta.patch[prop] = mediary(meta.target[prop]);
        }
        return Reflect.get(meta.target, prop);
    },

    set (meta, prop, value, receiver) {
        addPatch(meta, prop);
        return Reflect.set(meta.patch, prop, value);
    }
};

function addPatch(meta, prop) {
    meta.props.add(prop);
    meta.modifiedProps.add(prop);
    meta.patchedProps.add(prop);
    meta.deletedProps.delete(prop);
}

function rmPatch(meta, prop) {
    meta.props.delete(prop);
    meta.modifiedProps.add(prop);
    meta.deletedProps.add(prop);
    meta.patchedProps.delete(prop);
}

function mediary(given) {
    if (given == null
        || typeof given !== 'object'
        || given[Sym]) return given;

    deepFreeze(given);

    if (Array.isArray(given)) return new Proxy([ ...given ], ArrayHandler);

    validateObject(given);

    const givenProps = Object.getOwnPropertyNames(given);

    const meta = {
        target: given,
        givenProps: new Set(givenProps),

        patch: {},
        props: new Set(givenProps),
        modifiedProps: new Set(),
        patchedProps: new Set(),
        deletedProps: new Set()
    };

    return new Proxy(meta, ObjectHandler);
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
            if (meta.modifiedProps.has(prop)) {
                result[prop] = realize(given[prop]);
            } else {
                result[prop] = meta.target[prop];
            }
        }
    }
    return result;
}

exports.clone = given => mediary(realize(given));
exports.Sym = Sym;
exports.SymMeta = SymMeta;

// `produce` is a drop-in replacement for immer `produce`.
// This function provides a possible migration path.
exports.produce = (given, fn) => {
    const cloned = mediary(realize(given));
    fn(cloned);
    return cloned;
};
