'use strict';

const { start, end, times } = require('hbu');

const { produce } = require('immer');
const data = require('../../data');

let i = 0;

start();

while (i < times) {
    produce(data, draft => {
        [ 'a', 'b', 'c', 'd', 'e', 'f', 'g' ].forEach(k => {
            draft[k].forEach(v => {
                v._id = 123;
                v.index = 123;
                v.guid = 'cf9c9748-672d-4661-8c5c-2ef6c4e69679';
                v.isActive = false;
                v.balance = 123.01;
                v.picture = 'cat.gif';
                v.age = 4;
                v.eyeColor = 'blue';
                v.name = {};
                v.name.first = 'Jane';
                v.name.last = 'Doe';
                v.company = 'NA';
                v.email = 'jdoe@yopmail.com';
                v.phone = '555-555-5555';
                v.address = '123 W Apple St';
                v.about = 'developer';
                v.registered = false;
                v.latitude = '123';
                v.longitude = '123';
                v.tags.push('foo');
                v.tags.push('bar');
                v.tags.push('baz');
                v.tags = v.tags.map(v => 'bar');
                v.range = v.range.map(v => 'bar');
                v.friends = v.friends.map(v => ({
                    id: Math.ceil(Math.random() * 100000),
                    name: 'Pete'
                }));
                v.greeting = 'hello';
                v.favoriteFruit = 'papaya';
            });
        });
        draft.h = 'h';
        draft.i = 'i';
        draft.j = 'j';
        draft.k = 'k';
        draft.l = 'l';
        draft.m = 'm';
        draft.n = 'n';
        draft.o = 'o';
        draft.p = 'p';
        draft.q = 'q';
        draft.r = 'r';
        draft.s = 's';
        draft.t = 't';
        draft.u = 'u';
        draft.v = 'v';
        draft.w = 'w';
        draft.x = 'x';
        draft.y = 'y';
        draft.z = 'z';
    });
    i++;
}

end();
