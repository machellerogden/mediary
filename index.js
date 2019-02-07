'use strict';

const PatchSymbol = Symbol('@mediary');

module.exports = mediary;

const reduce = (a, fn, s) => Array.isArray(a)
    ? a.reduce(fn, s || [])
    : Object.entries(a).reduce((acc, [ k, v ], i, o) => fn(acc, v, k, o), s || {});

function mediary(given) {
    if ([ 'string', 'number', 'boolean' ].includes(typeof given)) return given;
    if (![ '[object Object]', '[object Array]' ].includes(Object.prototype.toString.call(given))) throw new TypeError(`Given value must be a simple object. Received: ${given}`);
    if (given[PatchSymbol]) return given;
    const mediated = reduce(given, (acc, v, i) => (acc[i] = mediary(v), acc));
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
        get (target, key, receiver) {
            if (deletions.has(key)) return void 0;
            if (key === PatchSymbol) return patch;
            if (key === 'length' && [ target, patch ].every(v => typeof v[key] === 'number')) {
                return target.length > patch.length
                    ? Reflect.get(target, key, patch)
                    : Reflect.get(patch, key, patch);
            }
            if (Reflect.has(patch, key)) return Reflect.get(patch, key, patch)
            return Reflect.get(target, key, patch);
        },
        getOwnPropertyDescriptor (target, key) {
            return (deletions.has(key) || Reflect.has(patch, key))
                ? Reflect.getOwnPropertyDescriptor(patch, key)
                : Reflect.getOwnPropertyDescriptor(target, key);
        },
        getPrototypeOf (target) {
            return Reflect.getPrototypeOf(patch);
        },
        setPrototypeOf (target, prototype) {
            return Reflect.getPrototypeOf(patch, prototype);
        },
        ownKeys (target) {
            const pruned = reduce(target, (acc, v, i) => {
                if (i === PatchSymbol) return acc;
                if (!deletions.has(i)) acc[i] = v;
                return acc;
            });
            return Array.from(new Set([
                ...Reflect.ownKeys(pruned),
                ...Reflect.ownKeys(patch)
            ])).sort((a, b) => {
                if (a === 'length') return 1;
                if (b === 'length') return -1;
                return /[0-9]+/.test(a) && /[0-9]+/.test(b)
                    ? (+a) - (+b)
                    : 0;
            });
        },
        has (target, key) {
            if (deletions.has(key)) return false;
            if (key === PatchSymbol) return false;
            return Reflect.has(patch, key) || Reflect.has(target, key);
        },
        set (target, key, value, receiver) {
            return Reflect.set(patch, key, mediary(value), patch);
        }
    };
    return new Proxy(mediated, handler);
}

mediary.PatchSymbol = PatchSymbol;
