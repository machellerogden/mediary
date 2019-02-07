'use strict';

module.exports = (given) => {
    const next = {};
    const deletions = new Set();
    const handler = {
        defineProperty(target, ...rest) {
            return Reflect.defineProperty(next, ...rest);
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
            return Reflect.getOwnPropertyDescriptor({ ...target, ...next }, key);
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
            }, {});
            return Reflect.ownKeys({ ...withDeletionsOmitted, ...next })
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
    return new Proxy(given, handler);
};
