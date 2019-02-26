'use strict';

const arrayProto = [];

arrayProto.shift = function () {
    const [ head, ...rest ] = this;
    rest.forEach((v, i) => {
        this[i] = rest[i];
    });
    this.length = rest.length;
    return head;
};

arrayProto.pop = function () {
    const length = this.length;
    const updated = this.slice(0, -1);
    updated.forEach((v, i) => {
        this[i] = rest[i];
    });
    const result = this[length - 1];
    delete this[length - 1];
    return result;
};

arrayProto.unshift = function (v) {
    const updated = [ v, ...this ];
    updated.forEach((v, i) => {
        this[i] = updated[i];
    });
};

module.exports = arrayProto;
