import { createRequire } from 'module';

// Node.js currently does not support loading native module
// using ES6 module syntax
const require = createRequire(import.meta.url);
const nccc = require("../node-nccc/out/build/x64-Debug/node-nccc");

export default {
    nccc: nccc
};
