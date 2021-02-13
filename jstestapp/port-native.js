import FFI from "ffi-napi";
import { createRequire } from 'module';
const require = createRequire(import.meta.url); // FIXME: ???

const nccc = require("../node-nccc/out/build/x64-Debug/node-nccc");

export default {
    FFI: FFI, /* Tentative */
    nccc: nccc
};
