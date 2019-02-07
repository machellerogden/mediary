'use strict';

const Sym = Symbol('@mediary');

module.exports = mediary;

function mediary(given) {
    if (['string', 'number', 'boolean'].includes(typeof given)) return given;
    if (![ '[object Object]', '[object Array]' ].includes(Object.prototype.toString.call(given))) throw new TypeError(`Given value must be a simple object. Received: ${given}`);
    if (given[Sym]) return given;
    given[Sym] = true;
    const mediated = Array.isArray(given)
        ? given.reduce((acc, v, i) => (acc[i] = mediary(v), acc), [])
        : Object.entries(given).reduce((acc, [k, v]) => (acc[k] = mediary(v), acc), {});
    const next = Array.isArray(given)
        ? []
        : {};
    const deletions = new Set();
    const handler = {
        defineProperty(target, key, attr) {
            return Reflect.defineProperty(next, key, attr);
        },
        deleteProperty(target, key) {
            deletions.add(key);
            return Reflect.deleteProperty(next, key);
        },
        isExtensible(target) {
            return Reflect.isExtensible(next);
        },
        preventExtensions(target) {
            return Reflect.preventExtensions(next);
        },
        get (target, key) {
            if (next[key] != null) return Reflect.get(next, key);
            if (deletions.has(key)) return void 0;
            return Reflect.get(...arguments);
        },
        getOwnPropertyDescriptor (target, key) {
            if (deletions.has(key)) return Reflect.getOwnPropertyDescriptor(next, key);
            return Reflect.getOwnPropertyDescriptor(Array.isArray(next)
                ? [ ...target, ...next ]
                : { ...target, ...next }, key);
        },
        // TODO: needs consideration
        //getPrototypeOf (target) {
            //return Reflect.getPrototypeOf(next);
        //},
        //setPrototypeOf (target, prototype) {
            //return Reflect.getPrototypeOf(next, prototype);
        //},
        ownKeys (target) {
            const withDeletionsOmitted = Object.entries(target).reduce((acc, [k, v]) => {
                if (!deletions.has(k)) acc[k] = v;
                return acc;
            }, Array.isArray(next) ? [] : {});
            return Reflect.ownKeys(Array.isArray(next)
                ? [ ...withDeletionsOmitted, ...next ]
                : { ...withDeletionsOmitted, ...next })
        },
        has (target, key) {
            if (key in next) return true;
            if (deletions.has(key)) return false;
            return Reflect.has(target, key);
        },
        set (target, key, value) {
            return Reflect.set(next, key, value);
        }
    };
    return new Proxy(mediated, handler);
}
