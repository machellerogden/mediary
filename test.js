const foo = { bar: "baz" };

const handler = {
    get (t, k, r) {
        if (k === 'isProxy') return true;
        console.log(r.isProxy);
        return t[k];
    }
};

const bar = new Proxy(foo, handler);

debugger;
