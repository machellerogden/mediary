#!/usr/bin/env node

module.exports = runner;

const { PerformanceObserver, performance } = require('perf_hooks');
const toMB = v => Math.round(v / 1024 / 1024 * 100) / 100;

function runner(label, times = 1000, fn) {

    let previousMemory = process.memoryUsage();

    function logMemory(l) {
        if (l) console.log(l);
        const used = process.memoryUsage();
        for (let key in used) console.log(`${key} ${toMB(used[key] - previousMemory[key])} MB`);
        previousMemory = process.memoryUsage();
    }

    const obs = new PerformanceObserver((items) => {
        process.stdout.write('\n');
        const { name, duration } = items.getEntries()[0];
        console.log(name);
        console.log(duration);
        logMemory();
        performance.clearMarks();
    });

    obs.observe({ entryTypes: ['measure'] });

    logMemory('initial');

    let i = 0;
    performance.mark(`${label}_start`);
    while (times > i) {
        fn(i);
        i++;
    }
    performance.mark(`${label}_end`);
    performance.measure(label, `${label}_start`, `${label}_end`);
    obs.disconnect();
}
