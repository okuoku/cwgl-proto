import { babel } from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";

const config_duktape = {
    input: "index.js",
    output: {
        dir: "output-duk",
        format: "iife",
        name: "loader",
    },
    plugins: [
        resolve(),
        babel({ babelHelpers: "bundled", configFile: false,
              presets: [ "@babel/preset-env"]
        })
    ],
    external: ["./port-std.js", "./port-native.js"]
};

export default config_duktape;
