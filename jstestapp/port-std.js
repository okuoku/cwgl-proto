import fs from "fs";
import crypto from "crypto";
import perf_hooks from "perf_hooks";

export default {
    performance_now: perf_hooks.performance.now,
    fs_readFileSync: fs.readFileSync,
    crypto_randomFillSync: crypto.randomFillSync,
};
