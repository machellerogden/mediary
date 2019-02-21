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
const SymChanges = Symbol('mediary.changes');
const SymChangelog = Symbol('mediary.changelog');

const PropChange = (op, k) => ({ [op]: k });

const realizeChanges = changelog => changelog.reduce((P, { A, D }) => {
    if (A) {
        P.D.delete(A);
        P.A.add(A);
    } else if (D) {
        P.A.delete(D);
        P.D.add(A);
    }
    return P;
}, {
    A: new Set(),
    D: new Set()
});


function mediary(given) {
    if (given == null
        || !isPlainObject(given)
        || given[Sym])
        return given;

    const overlay = Array.isArray(given)
        ? []
        : {};

    Reflect.setPrototypeOf(overlay, given);

    const changelog = [];

    let changes = realizeChanges(changelog);

    const updateOverlay = (op, prop, value) => {
        const change = PropChange(op, prop);
        if (op === 'D') {
            delete overlay[prop];
        } else {
            overlay[prop] = value;
        }
        changelog.push(change);
        changes = realizeChanges(changelog);
        return true;
    };

    const isArray = Array.isArray(given);

    const handler = {

        defineProperty(target, prop, attr) {
            // TODO
            return Reflect.defineProperty(target, prop, attr);
        },

        deleteProperty(target, prop) {
            return updateOverlay('D', prop);
        },

        isExtensible(target) {
            // TODO
            return Reflect.isExtensible(target);
        },

        preventExtensions(target) {
            // TODO
            return Reflect.preventExtensions(target);
        },

        get (target, prop, receiver) {
            if (prop === Sym) return true;
            if (prop === SymChanges) return changes;
            if (prop === SymChangelog) return changelog;
            if (prop === SymTarget) return given;
            if (prop === 'length' && Array.isArray(receiver)) return Math.max.apply(null, getNumericKeys(receiver)) + 1;

            if (changes.D.has(prop)) return void 0;
            if (Reflect.ownKeys(given).includes(prop) || Reflect.ownKeys(target).includes(prop)) {
                target[prop] = mediary(target[prop]);
            }
            return target[prop];
        },

        getOwnPropertyDescriptor (target, prop) {
            if (changes.D.has(prop)) return void 0;
            if (Reflect.ownKeys(given).includes(prop) || Reflect.ownKeys(target).includes(prop)) {
                target[prop] = mediary(target[prop]);
            }
            return Reflect.getOwnPropertyDescriptor(target, prop);
        },

        getPrototypeOf (target) {
            // TODO
            return Reflect.getPrototypeOf(given);
        },

        setPrototypeOf (target, prototype) {
            // TODO
            return Reflect.getPrototypeOf(target, prototype);
        },

        ownKeys (target) {
            const keys = [ ...(new Set([
                ...Reflect.ownKeys(given).filter((v, k) => !changes.D.has(k)),
                ...Reflect.ownKeys(target)
            ])) ];
            return keys;
        },

        has (target, prop) {
            return changes.A.has(prop) || (!changes.D.has(prop) && Reflect.has(target, prop));
        },

        set (target, prop, value, receiver) {
            // TODO: handle `length` change
            return updateOverlay('A', prop, value);
        }

    }

    return new Proxy(overlay, handler);
}

mediary.Sym = Sym;
mediary.SymChanges = SymChanges;
mediary.SymChangelog = SymChangelog;
