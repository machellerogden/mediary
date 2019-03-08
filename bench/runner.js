#!/usr/bin/env node

const Table = require('easy-table')

module.exports = runner;

const { PerformanceObserver, performance } = require('perf_hooks');
const toMB = v => Math.round(v / 1024 / 1024 * 100) / 100;

function runner(label, times = 1000, fn) {

    let previousHeap = process.memoryUsage().heapUsed;

    function memory() {
        const heap = process.memoryUsage().heapUsed;
        p = previousHeap;
        previousHeap = process.memoryUsage().heapUsed;
        return `${toMB(heap - p)} MB`;
    }

    const obs = new PerformanceObserver((items) => {
        process.stdout.write('\n');
        const { name, duration } = items.getEntries()[0];
        console.log(Table.print([
            {
                'Test Name': name,
                'Heap Used': memory(),
                'Elapsed Time': `${duration} MS`
            }
        ]));
        performance.clearMarks();
    });

    obs.observe({ entryTypes: ['measure'] });

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
