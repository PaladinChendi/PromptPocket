// src/global.d.ts

// `DEBUG` is injected at build time by webpack DefinePlugin (see webpack.config.js):
//   `true` when built with `--env debug`, otherwise `false`.
// Source guards logs as `DEBUG && console.log(...)`; with DEBUG false, the call
// is folded to dead code and removed. This ambient declaration lets tsc/ts-loader
// type-check the bare `DEBUG` identifier before bundling.
declare const DEBUG: boolean;
