export default {
  input: "dist/index.js",
  output: {
    file: "build/bundle.js",
    format: "cjs",
  },
  external: ["react", "ink", "ink-select-input", "ink-tab", "chalk"],
};