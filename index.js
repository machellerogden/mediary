'use strict';

const {
    debug,
    reduce,
    toArray,
    getNumericKeys,
    deepFreeze
} = require('./util');

const Sym = Symbol('mediary');
const SymMeta = Symbol('mediary.meta');

function mediary(given) {
    if (given == null
        || typeof given !== 'object'
        || given[Sym]
        || !(Object.is(given.constructor, Object) || Object.is(given.constructor, Array)))
        return given;

    deepFreeze(given);

    const isArray = Array.isArray(given);
    const givenKeys = Reflect.ownKeys(given);

    const patch = isArray ? [] : {};
    const additions = new Set();
    const deletions = new Set();
    const ownKeys = () => [ ...additions, ...givenKeys.filter((_, k) => !deletions.has(k)) ];

    const meta = {
        given,
        additions,
        deletions,
        patch,
        isArray,
        ownKeys
    };

    const overlay = new Proxy(patch, {
        get (target, prop) {
            return Reflect.has(target, prop)
                ? target[prop]
                : givenKeys.includes(prop)
                    ? given[prop]
                    : void 0;
        }//,
        //set (target, prop, value, receiver) {
            //if (prop === 'length' && isArray) {
                //const length = Reflect.has(target, prop)
                    //? target[prop]
                    //: givenKeys.includes(prop)
                        //? given[prop]
                        //: 0;
                //if (value < length) {
                    //for (let i = 0; i < value; i++) {
                        //deletions.add(i);
                        //target.pop();
                    //}
                //} else if (value > length) {
                    //console.log('length set push - value', value);
                    //console.log('length set push - length', length);
                    //for (let i = target[prop]; i < value; i++) {
                        //additions.add(i);
                        //target.push(void 0);
                    //}
                //}
            //}
            //return Reflect.set(target, prop, value);
        //}
    });


    const handler = {

        defineProperty(target, prop, attr) {
            // TODO - need to add set logic here
            return Reflect.defineProperty(target, prop, attr);
        },

        deleteProperty(target, prop) {
            deletions.add(prop);
            return Reflect.deleteProperty(patch, prop);
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
            if (prop === SymMeta) return meta;
            if (prop === 'length' && Array.isArray(receiver)) return Math.max.apply(null, getNumericKeys(receiver)) + 1;

            if (deletions.has(prop)) return void 0;
            if (givenKeys.includes(prop) || Reflect.ownKeys(target).includes(prop)) {
                target[prop] = mediary(target[prop]);
            }
            return target[prop];
        },

        getOwnPropertyDescriptor (target, prop) {
            if (deletions.has(prop) || [ Sym, SymMeta ].includes(prop)) return void 0;
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
            return ownKeys();
        },

        has (target, prop) {
            return additions.has(prop) || (!deletions.has(prop) && Reflect.has(target, prop));
        },

        set (target, prop, value, receiver) {
            additions.add(prop);
            return Reflect.set(patch, prop, value);
        }

    }

    return new Proxy(overlay, handler);
}

function realize(given) {
    if (given != 'object'
        || !given[Sym]) return given;
    const {
        target,
        patch,
        ownKeys,
        isArray
    } = given[SymMeta];
    return ownKeys().reduce((acc, k) => {
        acc[k] = realize(Reflect.has(patch, k)
            ? patch[k]
            : target[k]);
    }, isArray ? [] : {});
}

const clone = given => mediary(realize(given));

exports.realize = realize;
exports.mediary = mediary;
exports.clone = clone;
exports.Sym = Sym;
exports.SymMeta = SymMeta;
