
import { build } from "esbuild";

await build({
  entryPoints: ["src/main.ts"],

  outfile: "packs/behavior_pack/scripts/main.js",

  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2020",

  external: [
    "@minecraft/server",
    "@minecraft/server-ui"
  ],

  sourcemap: false,
  minify: false,

  logLevel: "info"
});

console.log("ClimateCraft build completed successfully.");
