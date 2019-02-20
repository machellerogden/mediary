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
const SymPatches = Symbol('mediary.patches');

const createPatch = (...a) =>
    a.length === 1
        ? { D: a[0] }
        : { A: a[0], values: { [a[0]]: a[1] }, isArray: a[2] };

const addPatch = (patches, ...a) =>
     (patches.push(createPatch(...a)), true);

const realizePatch = (patches) => patches.reduce((P, p) => {
    const { A, D, values, isArray } = p;
    const merged = { ...P.values, ...p.values };
    P.values = isArray
        ? toArray(merged)
        : merged;
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

function mediary(given) {

    if (isPrimitive(given)
        || given[Sym]
        || !isPlainObject(given))
        return given;

    const patches = [];

    const isArray = Array.isArray(given);

    const mediated = reduce(given, (acc, v, k) => {
        acc[k] = mediary(v);
        return acc;
    });

    const handler = {

        defineProperty(target, key, attr) {
            debug('#defineProperty');
            return Reflect.defineProperty(target, key, attr);
        },

        deleteProperty(target, key) {
            debug('#deleteProperty');
            return addPatch(patches, key);
        },

        isExtensible(target) {
            debug('#isExtensible');
            return Reflect.isExtensible(target);
        },

        preventExtensions(target) {
            debug('#preventExtensions');
            return Reflect.preventExtensions(target);
        },

        get (target, key, receiver) {
            debug('#get');
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
            debug('#getOwnPropertyDescriptor');

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
            debug('#getPrototypeOf');
            return Reflect.getPrototypeOf(target);
        },

        setPrototypeOf (target, prototype) {
            debug('#setPrototypeOf');
            return Reflect.getPrototypeOf(target, prototype);
        },

        ownKeys (target) {
            debug('#ownKeys');
            const patch = realizePatch(patches);
            const keys = [ ...(new Set([
                ...Reflect.ownKeys(given).filter((v, k) => !patch.D.has(k)),
                ...Object.keys(patch.values)
            ])) ];
            return keys;
        },

        has (target, key) {
            debug('#has');
            const patch = realizePatch(patches);
            return patch.A.has(key) || (!patch.D.has(key) && Reflect.has(target, key)); 
        },

        set (target, key, value, receiver) {
            debug('#set');

            // TODO: handle length change
            //if (key === 'length' && Array.isArray(receiver)) { // reflect on proxy instance
                //if (typeof value !== 'number') throw new TypeError('length must be a number');
                //const length = receiver.length; // reflect via `get` trap
                //for (let i = value; i < length; i++) delete receiver[i]; // delegates to `deleteProperty` trap
                //for (let i = value; i > length; i--) receiver.push(void 0); // recursion! triggers `set` trap again as well as `get` and `ownKeys`
            //}

            return addPatch(patches, key, value, isArray);
        }

    }

    const proxied = new Proxy(mediated, handler);

    return proxied;
}

mediary.Sym = Sym;
mediary.SymPatches = SymPatches;
