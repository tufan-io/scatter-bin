import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import shebang from 'rollup-plugin-add-shebang';
import json from "@rollup/plugin-json";

export default {
  input: "build/cli.js",
  output: {
    file: "dist/upload.cjs",
    format: "commonjs",
  },
  plugins: [
    json(),
    commonjs(),
    nodeResolve(),
    shebang({
      include: 'dist/upload.cjs'
    }),
  ],
};
