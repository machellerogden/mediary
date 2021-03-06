'use strict';

const { start, end, times } = require('hbu');

const { clone } = require('../../..');
const data = require('../../data');
const cloned = clone(data);

let i = 0;

start();

while (i < times) {
    [ 'a', 'b', 'c', 'd', 'e', 'f', 'g' ].forEach(k => {
        cloned[k].forEach(v => {
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
    cloned.h;
    cloned.i;
    cloned.j;
    cloned.k;
    cloned.l;
    cloned.m;
    cloned.n;
    cloned.o;
    cloned.p;
    cloned.q;
    cloned.r;
    cloned.s;
    cloned.t;
    cloned.u;
    cloned.v;
    cloned.w;
    cloned.x;
    cloned.y;
    cloned.z;
    i++;
}

end();
