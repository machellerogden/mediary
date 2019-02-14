'use strict';

const PatchSymbol = Symbol('@mediary.patch');

module.exports = Mediary;

const reduce = (a, fn, s) => Array.isArray(a)
    ? a.reduce(fn, s || [])
    : Object.entries(a).reduce((acc, [ k, v ], i, o) => fn(acc, v, k, o), s || {});

const isPrimitive = v => [
    'string',
    'number',
    'boolean'
].includes(typeof v);

const isValidObject = v => [
    '[object Object]',
    '[object Array]'
].includes(Object.prototype.toString.call(v));

const isNumber = n =>
    !isNaN(parseInt(n, 10)) && isFinite(n);

const getNumericKeys = v =>
    Object.getOwnPropertyNames(v).filter(isNumber).map(Number);

function set(target, key, value, receiver, patch, freeze) {
    if (key === 'length' && Array.isArray(receiver)) {
        if (typeof value !== 'number') throw new TypeError('length must be a number');
        const length = receiver.length;
        for (let i = value; i < length; i++) delete receiver[i];
        for (let i = value; i > length; i--) receiver.push(void 0);
    }

    if (isPrimitive(value)) return Reflect.set(patch, key, value, patch);

    if (isValidObject(value)) {
        if (!Reflect.has(receiver, key) || !isValidObject(receiver[key])) receiver[key] = Mediary(Array.isArray(value) ? [] : {}, freeze);
        return reduce(value, (acc, v, k) => {
            if (receiver[key][k] === v) return acc;
            return acc && set(receiver[key], k, v, receiver[key], receiver[key][PatchSymbol] || Mediary(Array.isArray(v) ? [] : {}), freeze);
        }, true);
    }

    return false;
}

function Mediary(given, freeze) {
    if (isPrimitive(given)) return given;
    if (!isValidObject(given)) throw new TypeError(`Given value must be a plain object or array. Received: ${given}`);
    if (given[PatchSymbol]) return given;
    if (freeze) Object.freeze(given);

    const mediated = reduce(given, (acc, v, k) => (acc[k] = Object.is(given, v) ? v : Mediary(v, freeze), acc));

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
            if (key === 'length' && Array.isArray(receiver)) return Math.max.apply(null, getNumericKeys(receiver)) + 1;
            if (Reflect.has(patch, key)) return Reflect.get(patch, key, patch);
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
            const pruned = reduce(target, (acc, v, k) => {
                if (k === PatchSymbol) return acc;
                if (!deletions.has(k)) acc[k] = v;
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
            return set(target, key, value, receiver, patch, freeze);
        }
    };
    return new Proxy(mediated, handler);
}

Mediary.PatchSymbol = PatchSymbol;
