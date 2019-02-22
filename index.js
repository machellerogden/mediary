'use strict';

module.exports = mediary;

const {
    debug,
    reduce,
    toArray,
    getNumericKeys,
    deepFreeze
} = require('./util');

const Sym = Symbol('mediary');
const SymTarget = Symbol('mediary.target');
const SymChanges = Symbol('mediary.changes');

function mediary(given) {
    if (given == null
        || typeof given !== 'object'
        || given[Sym])
        return given;

    const isArray = Array.isArray(given);
    const givenKeys = Object.keys(given);

    deepFreeze(given);

    const overlay = new Proxy(isArray ? [] : {}, {
        get (target, prop) {
            return Reflect.has(target, prop)
                ? target[prop]
                : givenKeys.includes(prop)
                    ? given[prop]
                    : void 0;
        }
        // TODO: handle length change
        //,
        //set (target, prop, value) {
            //if (prop === 'length' && isArray) {
                //if (typeof value !== 'number') throw new TypeError('length must be a number');
                //const length = Reflect.has(target, prop)
                    //? target.length
                    //: given.length;
                //console.log('***');
                //console.log(length);
                //console.log('***');
                //for (let i = value; i < length; i++) delete target[i]; // delegates to `deleteProperty` trap
                //for (let i = value; i > length; i--) target.push(void 0); // recursion! triggers `set` trap again as well as `get` and `ownKeys`
            //}
            //return Reflect.set(target, prop, value);
        //}
    });

    let changes = {
        A: new Set(givenKeys),
        D: new Set()
    };

    const updateOverlay = (op, prop, value) => {
        if (op === 'D') {
            changes.D.add(prop);
            delete overlay[prop];
        } else {
            changes.A.add(prop);
            overlay[prop] = value;
        }
        return true;
    };


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
            if (prop === SymTarget) return given;
            if (prop === 'length' && Array.isArray(receiver)) return Math.max.apply(null, getNumericKeys(receiver)) + 1;

            if (changes.D.has(prop)) return void 0;
            if (givenKeys.includes(prop) || Reflect.ownKeys(target).includes(prop)) {
                target[prop] = mediary(target[prop]);
            }
            return target[prop];
        },

        getOwnPropertyDescriptor (target, prop) {
            if (changes.D.has(prop) || [ Sym, SymChanges, SymTarget ].includes(prop)) return void 0;
            if (givenKeys.includes(prop) || Reflect.ownKeys(target).includes(prop)) {
                target[prop] = mediary(target[prop]);
            }
            return Reflect.getOwnPropertyDescriptor(target, prop);
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
