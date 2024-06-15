import { resolve } from "path";

/** @type {import('vite').UserConfig} */
export default {
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/index.js"),
      name: "pp-test",
      // the proper extensions will be added
      fileName: 'index'
    },
  },
};
