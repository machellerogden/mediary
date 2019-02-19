'use strict';

module.exports = mediary;

const { debug } = require('./util');

const Sym = Symbol('@mediary.is');
const delSym = Symbol('@mediary.delete');

const primitives = new Set([ 'undefined', 'string', 'number', 'boolean' ]);
const plainObjects = new Set([ '[object Object]', '[object Array]' ]);

const isPrimitive = v => primitives.has(v);
const isPlainObject = v => plainObjects.has(Object.prototype.toString.call(v));

const createPatch = (key, value) => value === delSym
    ? { D: [ key ] }
    : { A: [ key, value ] };

const readPatch = (patches) => {
    return patches.reduce((P, p) => {
        const { A = [], D = [] } = p;
        const [ Ak, Av ] = A;
        const [ Dk ] = D;
        if (Ak) {
            P[Ak] = Av;
        } else if (Dk) {
            delete P[Dk];
        }
        return P;
    }, {});
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
            return acc;
          }, [])
        : Object.entries(given).reduce((acc, [ k, v ]) => {
            acc[k] = mediary(v);
            return acc;
          }, {});

    const handler = {

        defineProperty(target, key, attr) {
            debug('@defineProperty');
            return Reflect.defineProperty(target, key, attr);
        },

        deleteProperty(target, key) {
            debug('@deleteProperty');
            const patch = createPatch(key, value, true);
            patches.push(patch);
            return true;
            return Reflect.deleteProperty(target, key);
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
            return Reflect.get(target, key, receiver);
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
            // TODO: handle deep patches
            const patch = createPatch(key, value);
            patches.push(patch);
            return true;
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
