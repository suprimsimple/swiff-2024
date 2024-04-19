import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
// import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";
export default {
  input: "src/index.js",
  output: {
    dir: "build",
    format: "es",
  },
  plugins: [
    nodeResolve(),
    babel({
      babelHelpers: "bundled",
      ignore: ["node_modules"],
      presets: ["@babel/preset-react"],
    }),
    // commonjs(),
    json(),
  ],
  external: [
    "react",
    "ink",
    "ink-select-input",
    "ink-tab",
    "ink-spinner",
    "ink-task-list",
    "chalk",
    "ssh2",
    "node-ssh",
    "lodash-es",
    "lodash.get",
    "node-cmd",
    "promise-mysql",
    "dotenv",
    "username",
    "update-notifier",
    "fs-extra",
    "ink-big-text",
    "child_process",
    "cli-spinners",
    "node-ssh",
  ],
};
