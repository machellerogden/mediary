'use strict';

module.exports = mediary;

const {
    debug,
    isPrimitive,
    isPlainObject
} = require('./util');

const Sym = Symbol('@mediary');
const delSym = Symbol('@mediary.delete');

const createPatch = (...a) =>
    a.length === 1
        ? { D: a[0] }
        : { A: a[0], values: { [a[0]]: a[1] } };

const addPatch = (patches, ...a) =>
     (patches.push(createPatch(...a)), true);

const readPatch = (patches) => {
    return patches.reduce((P, p) => {
        const { A, D, values } = p;
        P.values = { ...p.values };
        if (A) {
            P.D.delete(A);
            P.A.add(A);
        } else if (D) {
            P.A.delete(D);
            P.D.add(A);
            delete P.values[D];
        }
        return P;
    }, { A: new Set(), D: new Set() });
};

function mediary(given) {

    if (isPrimitive(given)
        || given[Sym]
        || !isPlainObject(given))
        return given;

    const patches = [];

    const mediated = Array.isArray(given)
        ? given.reduce((acc, v, i) => {
            acc[i] = mediary(v);
            addPatch(patches, i, v);
            return acc;
          }, [])
        : Object.entries(given).reduce((acc, [ k, v ]) => {
            acc[k] = mediary(v);
            addPatch(patches, k, v);
            return acc;
          }, {});

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
            const patch = readPatch(patches);
            console.log('@get - patch', patch)
            return Reflect.get(patch, key, receiver);
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
            return Reflect.ownKeys(target);
        },

        has (target, key) {
            debug('@has');
            return Reflect.has(target, key);
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

const foo = mediary({
    first: {
        a: "a",
        b: "b"
    },
    second: {
        a: "a",
        b: "b"
    }
});

debugger;
