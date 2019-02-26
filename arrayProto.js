'use strict';

const arrayProto = [];

arrayProto.shift = function () {
    const [ _, ...rest ] = this;
    rest.forEach((v, i) => {
        this[i] = rest[i];
    });
    this.length = rest.length;
};

arrayProto.unshift = function (v) {
    const updated = [ v, ...this ];
    updated.forEach((v, i) => {
        this[i] = updated[i];
    });
};

module.exports = arrayProto;
