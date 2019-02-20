'use strict';

module.exports = mediary;

const {
    debug,
    isPrimitive,
    isPlainObject,
    reduce,
    toArray,
    getNumericKeys
} = require('./util');

const Sym = Symbol('mediary');
const SymTarget = Symbol('mediary.target');
const SymPatch = Symbol('mediary.patch');
const SymPatches = Symbol('mediary.patches');

const createPatch = (...a) =>
    a.length === 1
        ? { D: a[0] }
        : {
            A: a[0],
            value: a[1],
            inArray: a[2]
        };

const realizePatch = (patches) => patches.reduce((P, p) => {
    const { A, D, value, inArray } = p;
    if (A) {
        P.D.delete(A);
        P.A.add(A);
        P.values[A] = value;
    } else if (D) {
        P.A.delete(D);
        P.D.add(A);
        delete P.values[D];
    }
    if (inArray) P.values = toArray(P.values);
    return P;
}, {
    A: new Set(),
    D: new Set(),
    values: {}
});


function mediary(given) {
    if (given == null
        || !isPlainObject(given)
        || given[Sym])
        return given;

    const mediated = reduce(given, (acc, v, k) => {
        acc[k] = mediary(v); // TODO: lazy mediation? is it even possible? hate doing this
        return acc;
    });

    const patches = [];

    let patch = realizePatch(patches);

    const updatePatch = (...a) => {
        patches.push(createPatch(...a));
        patch = realizePatch(patches);
        return true;
    };

    const isArray = Array.isArray(given);

    const handler = {

        defineProperty(target, key, attr) {
            // TODO
            return Reflect.defineProperty(target, key, attr);
        },

        deleteProperty(target, key) {
            return updatePatch(key);
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
            if (key === SymPatch) return patch;
            if (key === SymPatches) return patches;
            if (key === SymTarget) return given;
            if (key === 'length' && Array.isArray(receiver)) return Math.max.apply(null, getNumericKeys(receiver)) + 1;

            if (patch.D.has(key)) return void 0;

            return patch.A.has(key)
                ? patch.values[key]
                : target[key];
        },

        getOwnPropertyDescriptor (target, key) {
            let descriptor;
            if (patch.A.has(key)) {
                descriptor = Reflect.getOwnPropertyDescriptor(patch.values, key);
            } else if (!patch.D.has(key) && Reflect.has(target, key)) {
                descriptor = Reflect.getOwnPropertyDescriptor(target, key);
            } else {
                return void 0;
            }
            descriptor.value = mediary(descriptor.value);
            return descriptor;
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
            const keys = [ ...(new Set([
                ...Reflect.ownKeys(given).filter((v, k) => !patch.D.has(k)),
                ...Object.keys(patch.values)
            ])) ];
            return keys;
        },

        has (target, key) {
            return patch.A.has(key) || (!patch.D.has(key) && Reflect.has(target, key)); 
        },

        set (target, key, value, receiver) {
            // TODO: handle `length` change
            updatePatch(key, value, isArray);
            return true;
        }

    }

    return new Proxy(mediated, handler);
}

mediary.Sym = Sym;
mediary.SymPatch = SymPatch;
mediary.SymPatches = SymPatches;
