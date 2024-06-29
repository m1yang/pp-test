import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import esbuild from "rollup-plugin-esbuild";

import { defineConfig } from "rollup";

export default defineConfig({
  input: "src/index.js",
  output: {
    file: "dist/index.js",
    format: "esm",
    name: "pp-test",
  },
  plugins: [
    resolve(),
    commonjs(),
    esbuild({
      target: "node14",
    }),
  ],
});
