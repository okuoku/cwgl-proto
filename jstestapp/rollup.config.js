import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";

const config_duktape = {
    input: "index.js",
    output: {
        dir: "output-duk",
        format: "iife",
        name: "loader",
    },
    plugins: [
        babel({ babelHelpers: "bundled", configFile: false,
              presets: [ "@babel/preset-env"]
        })
    ],
    external: ["./port-std.js", "./port-native.js"]
};

export default config_duktape;
