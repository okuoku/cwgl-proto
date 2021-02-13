const fs = require("fs");
const crypto = require("crypto");
const perf_hooks = require("perf_hooks");

module.exports = {
    performance_now: perf_hooks.performance.now,
    fs_readFileSync: fs.readFileSync,
    crypto_randomFillSync: crypto.randomFillSync,
};
