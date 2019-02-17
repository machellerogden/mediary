'use strict';

const PatchSymbol = Symbol('@mediary.patch');

module.exports = mediary;

const debug = (...a) => process && process.env && process.env.DEBUG && console.log(...a);

const reduce = (a, fn, s) => Array.isArray(a)
    ? a.reduce(fn, s || [])
    : Object.entries(a).reduce((acc, [ k, v ], i, o) => fn(acc, v, k, o), s || {});

const isPrimitive = v => [
    'undefined',
    'string',
    'number',
    'boolean'
].includes(typeof v);

const isSimpleObject = v => [
    '[object Object]',
    '[object Array]'
].includes(Object.prototype.toString.call(v));

const isNumber = n =>
    !isNaN(parseInt(n, 10)) && isFinite(n);

const getNumericKeys = v =>
    Object.getOwnPropertyNames(v).filter(isNumber).map(Number);

function mediary(given, freeze) {
    if (isPrimitive(given)) return given;
    if (!isSimpleObject(given)) throw new TypeError(`Given value must be a plain object or array. Received: ${given}`);
    if (given[PatchSymbol]) return given;
    if (freeze) Object.freeze(given);

    const mediated = reduce(given, (acc, v, k) => (acc[k] = Object.is(given, v) ? v : mediary(v, freeze), acc));

    const patch = Array.isArray(given)
        ? []
        : {};

    const deletions = new Set();

    const handler = {

        defineProperty(target, key, attr) {
            return Reflect.defineProperty(patch, key, attr);
        },

        deleteProperty(target, key) {
            debug('@deleteProperty');
            deletions.add(key);
            return Reflect.deleteProperty(patch, key);
        },

        isExtensible(target) {
            debug('@isExtensible');
            return Reflect.isExtensible(patch);
        },

        preventExtensions(target) {
            debug('@preventExtensions');
            return Reflect.preventExtensions(patch);
        },

        get (target, key, receiver) {
            debug('@get');
            if (deletions.has(key)) return void 0;
            if (key === PatchSymbol) return patch;
            if (key === 'length' && Array.isArray(receiver)) return Math.max.apply(null, getNumericKeys(receiver)) + 1;
            if (Reflect.has(patch, key)) return Reflect.get(patch, key, patch);
            return Reflect.get(target, key, patch);
        },

        getOwnPropertyDescriptor (target, key) {
            debug('@getOwnPropertyDescriptor');
            if (process.env.DEBUG) console.log('@getOwnPropertyDescriptor');
            return (deletions.has(key) || Reflect.has(patch, key))
                ? Reflect.getOwnPropertyDescriptor(patch, key)
                : Reflect.getOwnPropertyDescriptor(target, key);
        },

        getPrototypeOf (target) {
            debug('@getPrototypeOf');
            if (process && process.env && process.env.DEBUG) console.log('@getOwnProperty');
            return Reflect.getPrototypeOf(patch);
        },

        setPrototypeOf (target, prototype) {
            debug('@setPrototypeOf');
            if (process.env.DEBUG) console.log('@getOwnPropertyDescriptor');
            return Reflect.getPrototypeOf(patch, prototype);
        },

        ownKeys (target) {
            debug('@ownKeys');
            const pruned = reduce(target, (acc, v, k) => {
                if (k === PatchSymbol) return acc;
                if (!deletions.has(k)) acc[k] = v;
                return acc;
            });

            return Array.from(new Set([
                ...Reflect.ownKeys(pruned),
                ...Reflect.ownKeys(patch)
            // TODO: determine is it's absolutely necessary to order the keys for arrays...
            ])).sort((a, b) => {
                if (a === 'length') return 1;
                if (b === 'length') return -1;
                return /[0-9]+/.test(a) && /[0-9]+/.test(b)
                    ? (+a) - (+b)
                    : 0;
            });
        },

        has (target, key) {
            debug('@has');
            if (deletions.has(key)) return false;
            if (key === PatchSymbol) return false;
            return Reflect.has(patch, key) || Reflect.has(target, key);
        },

        set (target, key, value, receiver) {
            debug('@set');
            // here be dragons... meta-reflections ahead. tred carefully.

            if (key === 'length' && Array.isArray(receiver)) { // reflect on proxy instance
                if (typeof value !== 'number') throw new TypeError('length must be a number');
                const length = receiver.length; // reflect via `get` trap
                for (let i = value; i < length; i++) delete receiver[i]; // delegates to `deleteProperty` trap
                for (let i = value; i > length; i--) receiver.push(void 0); // recursion! triggers `set` trap again as well as `get` and `ownKeys`
            }

            if (isPrimitive(value)) return Reflect.set(patch, key, value, patch);

            if (isSimpleObject(value)) {
                // if proxy doesn't have the key (as resolved by `has` trap)...
                if (!Reflect.has(receiver, key)
                    // ...or, if pre-existing value at given key on this instance (as resolved by `get` trap) is not a simple object
                    || !isSimpleObject(receiver[key])) {
                    // then, update patch with new array or object based on classification of given value.
                    patch[key] = Array.isArray(value) ? [] : {};
                }
                // walk given object applying needed updates and return boolean indicating success (per reflection contract)
                return reduce(value, (acc, v, k) => {
                    let cur = receiver[key][k]; // reflect via `get` trap
                    // skip identical values
                    if (cur === v || Object.is(cur, v)) return acc;
                    return acc && Reflect.set(receiver[key], k, v); // recursion!
                }, true);
            }

            // TODO: handle null?

            return false;
        }
    };
    return new Proxy(mediated, handler);
}

mediary.PatchSymbol = PatchSymbol;
