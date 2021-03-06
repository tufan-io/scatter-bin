import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "build/index.js",
  output: {
    file: "dist/post-install.cjs",
    format: "commonjs",
  },
  plugins: [
    commonjs(),
    nodeResolve(),
  ],
};
