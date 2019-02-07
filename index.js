'use strict';

const PatchSymbol = Symbol('@mediary');

module.exports = mediary;

function mediary(given) {
    if ([ 'string', 'number', 'boolean' ].includes(typeof given)) return given;
    if (![ '[object Object]', '[object Array]' ].includes(Object.prototype.toString.call(given))) throw new TypeError(`Given value must be a simple object. Received: ${given}`);
    if (given[PatchSymbol]) return given;
    const mediated = Array.isArray(given)
        ? given.reduce((acc, v, i) => (acc[i] = mediary(v), acc), [])
        : Object.entries(given).reduce((acc, [k, v]) => (acc[k] = mediary(v), acc), {});
    const patch = Array.isArray(given)
        ? []
        : {};
    const deletions = new Set();
    const handler = {
        defineProperty(target, key, attr) {
            return Reflect.defineProperty(patch, key, attr);
        },
        deleteProperty(target, key) {
            deletions.add(key);
            return Reflect.deleteProperty(patch, key);
        },
        isExtensible(target) {
            return Reflect.isExtensible(patch);
        },
        preventExtensions(target) {
            return Reflect.preventExtensions(patch);
        },
        get (target, key) {
            if (key === PatchSymbol) return patch;
            if (patch[key] != null) return Reflect.get(patch, key);
            if (deletions.has(key)) return void 0;
            return Reflect.get(...arguments);
        },
        getOwnPropertyDescriptor (target, key) {
            if (deletions.has(key)) return Reflect.getOwnPropertyDescriptor(patch, key);
            return Reflect.getOwnPropertyDescriptor(Array.isArray(patch)
                ? [ ...target, ...patch ]
                : { ...target, ...patch }, key);
        },
        // TODO: needs consideration
        //getPrototypeOf (target) {
            //return Reflect.getPrototypeOf(patch);
        //},
        //setPrototypeOf (target, prototype) {
            //return Reflect.getPrototypeOf(patch, prototype);
        //},
        ownKeys (target) {
            const withDeletionsOmitted = Object.entries(target).reduce((acc, [k, v]) => {
                if (!deletions.has(k)) acc[k] = v;
                return acc;
            }, Array.isArray(patch) ? [] : {});
            return Reflect.ownKeys(Array.isArray(patch)
                ? [ ...withDeletionsOmitted, ...patch ]
                : { ...withDeletionsOmitted, ...patch })
        },
        has (target, key) {
            if (key in patch) return true;
            if (deletions.has(key)) return false;
            return Reflect.has(target, key);
        },
        set (target, key, value) {
            return Reflect.set(patch, key, value);
        }
    };
    return new Proxy(mediated, handler);
}

mediary.PatchSymbol = PatchSymbol;
