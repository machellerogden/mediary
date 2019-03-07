'use strict';

/**
 * Each patch for given array value in a mediary clone will have the following
 * object set as its prototype. Shadowing the native Array prototype methods has
 * a performance impact but it's not significant. The code below is decently
 * optimized. As the mediary library matures, this will hopefully become
 * unneccesary.
 */

const { SymMeta } = require('./Sym');

const arrayProto = [];

arrayProto.shift = function () {
    var [ head, ...rest ] = this;
    var length = rest.length;
    var i = 0;
    while (i < length) this[i] = rest[i++];
    this.length = length;
    return head;
};

arrayProto.pop = function () {
    var last = this.length - 1;
    var result = this[last];
    delete this[last];
    return result;
};

arrayProto.unshift = function (v) {
    var updated = [ v, ...this ];
    var length = updated.length;
    var i = 0;
    while (i < length) this[i] = updated[i++];
};

arrayProto.reverse = function () {
    var length = this.length;
    var shallow = [ ...this ];
    var i = 0;
    while (length > 0) this[i++] = shallow[--length];
    return this;
};

arrayProto.copyWithin = function (at, start, end) {
    var selection = [ ...this ].slice(start, end);
    var until = at + selection.length;
    var end = ((this.length + selection.length) || 1) - 1;
    var i = 0;
    while (i < end) {
        let j = 0;
        while (i >= at && i < until) this[i++] = selection[j++];
        i++;
    }
    return this;
};

arrayProto.reduce = function (fn, init) {
    var acc = init == null
        ? arrayProto.shift.call(this)
        : init;
    var length = this.length;
    var i = 0;
    while (i < length) {
        acc = fn(acc, this[i], i, this);
        i++;
    }
    return acc;
};

arrayProto.reduceRight = function (fn, init) {
    var acc = init == null
        ? arrayProto.pop.call(this)
        : init;
    var i = this.length;
    while (i-- > 0) {
        acc = fn(acc, this[i], i, this);
    }
    return acc;
};

arrayProto.includes = function (v) {
    var length = this.length;
    var i = 0;
    var { patch, target, additions, deletions } = this[SymMeta];
    while (i < length) {
        if (additions.has(String(i)) || deletions.has(String(i))) {
            if (Object.is(patch[i++], v)) return true;
        } else {
            if (Object.is(target[i++], v)) return true;
        }
    }
    return false;
};

arrayProto.indexOf = function (v) {
    var length = this.length;
    var i = 0;
    var { patch, target, additions, deletions } = this[SymMeta];
    while (i < length) {
        if (additions.has(String(i)) || deletions.has(String(i))) {
            if (Object.is(patch[i], v)) return i;
        } else {
            if (Object.is(target[i], v)) return i;
        }
        i++;
    }
    return -1;
};

arrayProto.filter = function (fn, r) {
    r = r || this;
    var i = 0;
    var length = r.length;
    var acc = [];
    while (i < length) {
        if (fn(r[i], i, r)) acc.push(r[i]);
        i++;
    }
    return acc;
};

arrayProto.every = function (fn, r) {
    r = r || this;
    var i = 0;
    var length = r.length;
    var acc = true;
    while (i < length) {
        acc = acc && fn(r[i], i, r);
        i++;
    }
    return acc;
};

arrayProto.concat = function (...args) {
    var i = 0;
    var end = args.length;
    var acc = this;
    while (i < end) {
        if (Array.isArray(args[i])) {
            acc = [ ...acc, ...args[i] ];
        } else {
            acc = [ ...acc, args[i] ];
        }
        i++;
    }
    return acc;
};

arrayProto.map = function (fn) {
    var length = this.length;
    var acc = [];
    var i = 0;
    while (i < length) {
        acc[i] = fn(this[i], i, this);
        i++;
    }
    return acc;
};

arrayProto.join = function (sep = ',') {
    var length = this.length;
    var acc = '';
    var i = 0;
    while (i < length) {
        acc += String(this[i]);
        i++;
        if (i < length) acc += sep;
    }
    return acc;
};

arrayProto.forEach = function (fn) {
    var length = this.length;
    var acc = [];
    var i = 0;
    while (i < length) {
        fn(this[i], i, this);
        i++;
    }
    return;
};

arrayProto.flat = function (depth = 1) {
    var acc = [];
    var length = this.length;
    var i = 0;
    while (i < length) {
        if (Array.isArray(this[i])) {
            if (depth > 1) {
                acc = [ ...acc, ...arrayProto.flat.call(this[i], depth - 1) ];
            } else {
                acc = [ ...acc, ...this[i] ];
            }
        } else {
            acc = [ ...acc, this[i] ];
        }
        i++;
    }
    return acc;
};

module.exports = arrayProto;
