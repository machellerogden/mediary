'use strict';

module.exports = mediary;

const {
    debug,
    isPrimitive,
    isPlainObject,
    reduce
} = require('./util');

const Sym = Symbol('@mediary');
const SymPatches = Symbol('@mediary.patches');
const SymPatch = Symbol('@mediary.patch');

const createPatch = (...a) =>
    a.length === 1
        ? { D: a[0] }
        : { A: a[0], values: { [a[0]]: a[1] } };

const addPatch = (patches, ...a) =>
     (patches.push(createPatch(...a)), true);

const readPatch = (patches) => {
    return patches.reduce((P, p) => {
        const { A, D, values } = p;
        P.values = { ...P.values, ...p.values };
        if (A) {
            P.D.delete(A);
            P.A.add(A);
        } else if (D) {
            P.A.delete(D);
            P.D.add(A);
            delete P.values[D];
        }
        return P;
    }, { A: new Set(), D: new Set(), values: {} });
};

function mediary(given) {

    if (isPrimitive(given)
        || given[Sym]
        || !isPlainObject(given))
        return given;

    const patches = [];

    const mediated = reduce(given, (acc, v, k) => {
        acc[k] = mediary(v);
        addPatch(patches, k, acc[k]);
        return acc;
    });

    const handler = {

        defineProperty(target, key, attr) {
            debug('@defineProperty');
            return Reflect.defineProperty(target, key, attr);
        },

        deleteProperty(target, key) {
            debug('@deleteProperty');
            return addPatch(patches, key);
        },

        isExtensible(target) {
            debug('@isExtensible');
            return Reflect.isExtensible(target);
        },

        preventExtensions(target) {
            debug('@preventExtensions');
            return Reflect.preventExtensions(target);
        },

        get (target, key, receiver) {
            debug('@get');
            if (key === Sym) return true;
            if (key === SymPatches) return patches;
            const patch = readPatch(patches);
            if (key === SymPatch) return patch;
            return Reflect.get(patch.values, key, receiver);
        },

        getOwnPropertyDescriptor (target, key) {
            debug('@getOwnPropertyDescriptor');
            return Reflect.getOwnPropertyDescriptor(target, key);
        },

        getPrototypeOf (target) {
            debug('@getPrototypeOf');
            return Reflect.getPrototypeOf(target);
        },

        setPrototypeOf (target, prototype) {
            debug('@setPrototypeOf');
            return Reflect.getPrototypeOf(target, prototype);
        },

        ownKeys (target) {
            debug('@ownKeys');
            return [ ...readPatch(patches).A ].map(v => '' + v);
        },

        has (target, key) {
            debug('@has');
            return readPatch(patches).A.has(key);
        },

        set (target, key, value, receiver) {
            debug('@set');
            return addPatch(patches, key, value);
        }

    }

    const proxied = new Proxy(mediated, handler);

    return proxied;
}

mediary.Sym = Sym;
mediary.SymPatches = SymPatches;
mediary.SymPatch = SymPatch;
