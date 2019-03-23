'use strict';

const { start, end, times } = require('hbu');

const source = require('../../data');

const handler = {

    defineProperty (target, prop, attr) {
        return Reflect.defineProperty(target, prop, attr);
    },

    deleteProperty (target, prop) {
        return Reflect.deleteProperty(target, prop);
    },

    ownKeys (target) {
        return Reflect.ownKeys(target);
    },

    has (target, prop) {
        return Reflect.has(target);
    },

    getOwnPropertyDescriptor (target, prop) {
        return Reflect.getOwnPropertyDescriptor(target, prop);
    },

    get (target, prop, receiver) {
        return Reflect.get(target, prop, receiver);
    },

    set (target, prop, value, receiver) {
        return Reflect.set(target, prop, value, receiver);
    }
};

const data = new Proxy(source, handler);

let i = 0;

start();

while (i < times) {
    [ 'a', 'b', 'c', 'd', 'e', 'f', 'g' ].forEach(k => {
        data[k].forEach(v => {
            v._id;
            v.index;
            v.guid;
            v.isActive;
            v.balance;
            v.picture;
            v.age;
            v.eyeColor;
            v.name;
            v.name.first;
            v.name.last;
            v.company;
            v.email;
            v.phone;
            v.address;
            v.about;
            v.registered;
            v.latitude;
            v.longitude;
            v.tags.forEach(v => v);
            v.range.forEach(v => v);
            v.friends.forEach(v => {
                v.id;
                v.name;
            });
            v.greeting;
            v.favoriteFruit;
        });
    });
    data.h;
    data.i;
    data.j;
    data.k;
    data.l;
    data.m;
    data.n;
    data.o;
    data.p;
    data.q;
    data.r;
    data.s;
    data.t;
    data.u;
    data.v;
    data.w;
    data.x;
    data.y;
    data.z;
    i++;
}

end();
