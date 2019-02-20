'use strict';

module.exports = mediary;

const {
    isPrimitive,
    isPlainObject,
    reduce,
    toArray,
    getNumericKeys
} = require('./util');

const Sym = Symbol('mediary');
const SymTarget = Symbol('mediary.target');
const SymPatches = Symbol('mediary.patches');

const createPatch = (...a) =>
    a.length === 1
        ? { D: a[0] }
        : {
            A: a[0],
            value: a[1],
            inArray: a[2]
        };

const addPatch = (patches, ...a) =>
     (patches.push(createPatch(...a)), true);

const realizePatch = (patches) => patches.reduce((P, p) => {
    const { A, D, value, inArray } = p;
    if (A) {
        P.values[A] = p.value;
        P.D.delete(A);
        P.A.add(A);
    } else if (D) {
        P.A.delete(D);
        P.D.add(A);
        delete P.values[D];
    }
    if (inArray) P.values = toArray(P.values);
    return P;
}, { A: new Set(), D: new Set(), values: {} });

function mediary(given) {

    if (isPrimitive(given)
        || given[Sym]
        || !isPlainObject(given))
        return given;

    // TODO: cache realized patch using patches.length as key
    const patches = [];

    const isArray = Array.isArray(given);

    const mediated = reduce(given, (acc, v, k) => {
        acc[k] = mediary(v);
        return acc;
    });

    const handler = {

        defineProperty(target, key, attr) {
            // TODO
            return Reflect.defineProperty(target, key, attr);
        },

        deleteProperty(target, key) {
            return addPatch(patches, key);
        },

        isExtensible(target) {
            // TODO
            return Reflect.isExtensible(target);
        },

        preventExtensions(target) {
            // TODO
            return Reflect.preventExtensions(target);
        },

        get (target, key, receiver) {
            if (key === Sym) return true;
            if (key === SymPatches) return patches;
            if (key === SymTarget) return given;
            if (key === 'length' && Array.isArray(receiver)) return Math.max.apply(null, getNumericKeys(receiver)) + 1;
            const patch = realizePatch(patches);
            if (patch.D.has(key)) {
                return void 0;
            } else if (patch.A.has(key)) {
                return patch.values[key];
            } else {
                return target[key];
            }
        },

        getOwnPropertyDescriptor (target, key) {
            const patch = realizePatch(patches);
            if (patch.A.has(key)) {
                return Reflect.getOwnPropertyDescriptor(patch.values, key);
            } else if (!patch.D.has(key) && Reflect.has(target, key)) {
                return Reflect.getOwnPropertyDescriptor(target, key);
            } else {
                return void 0;
            }
        },

        getPrototypeOf (target) {
            // TODO
            return Reflect.getPrototypeOf(target);
        },

        setPrototypeOf (target, prototype) {
            // TODO
            return Reflect.getPrototypeOf(target, prototype);
        },

        ownKeys (target) {
            const patch = realizePatch(patches);
            const keys = [ ...(new Set([
                ...Reflect.ownKeys(given).filter((v, k) => !patch.D.has(k)),
                ...Object.keys(patch.values)
            ])) ];
            return keys;
        },

        has (target, key) {
            const patch = realizePatch(patches);
            return patch.A.has(key) || (!patch.D.has(key) && Reflect.has(target, key)); 
        },

        set (target, key, value, receiver) {
            // TODO: handle `length` change
            return addPatch(patches, key, value, isArray);
        }

    }

    const proxied = new Proxy(mediated, handler);

    return proxied;
}

mediary.Sym = Sym;
mediary.SymPatches = SymPatches;
