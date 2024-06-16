import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";
import nodePolyfills from "rollup-plugin-polyfill-node";

export default[
  {
    input: "src/index.js",
    output: {
      dir: "build",
      format: "esm",
    },
    plugins: [
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
        presets: ["@babel/preset-env", "@babel/preset-react"],
      }),
      json(),
      commonjs(),
      terser(),
      nodeResolve(),
      nodePolyfills(),
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
      "lodash-es",
      "lodash.get",
      "promise-mysql",
      "dotenv",
      "username",
      "update-notifier",
      "fs-extra",
      "ink-big-text",
      "cli-spinners",
      "node-ssh",
      "timers-promises",
      "semver",
      "pino",
      "pino-pretty"
    ],
  },
  // {
  //   input: "src/index.js",
  //   output: {
  //     // dir: "dist",
  //     file: 'build/bundle.cjs.js',
  //     format: "cjs",
  //   },
  //   plugins: [
  //     babel({
  //       babelHelpers: "bundled",
  //       exclude: "node_modules/**",
  //       presets: ["@babel/preset-env", "@babel/preset-react"],
  //     }),
  //     json(),
  //     commonjs(),
  //     terser(),
  //     nodeResolve(),
  //     nodePolyfills(),
  //   ],
  //   external: [
  //     "react",
  //     "ink",
  //     "ink-select-input",
  //     "ink-tab",
  //     "ink-spinner",
  //     "ink-task-list",
  //     "chalk",
  //     "ssh2",
  //     "lodash-es",
  //     "lodash.get",
  //     "promise-mysql",
  //     "dotenv",
  //     "username",
  //     "update-notifier",
  //     "fs-extra",
  //     "ink-big-text",
  //     "cli-spinners",
  //     "node-ssh",
  //     "timers-promises",
  //     "semver",
  //     "pino",
  //     "pino-pretty"
  //   ],
  // }
]
