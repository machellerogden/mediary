'use strict';

/**
 * Each patch for given array value in a mediary clone will have the following
 * object set as its prototype. Shadowing the native Array prototype methods has
 * a performance impact but it's not significant. The code below is decently
 * optimized. As the mediary library matures, this will hopefully become
 * unneccesary.
 */

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
    var i = 0;
    var shallow = [ ...this ];
    while (length > 0) this[i++] = shallow[--length];
    return this;
};

arrayProto.copyWithin = function (to, start, end) {
    var selection = [ ...this ].slice(start, end);
    var i = 0;
    var insertStart = to;
    var insertEnd = to + selection.length;
    var end = ((this.length + selection.length) || 1) - 1;
    while (i < end) {
        let j = 0;
        while (i >= insertStart && i < insertEnd) this[i++] = selection[j++];
        i++;
    }
    return this;
};

module.exports = arrayProto;
