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
        commonjs({exclude: ["port-std.js","port-native.js"]}),
        babel({ babelHelpers: "bundled", configFile: false,
              presets: [ "@babel/preset-env"]
        })
    ]
};

export default config_duktape;
