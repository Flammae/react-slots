import { build } from "esbuild";
import unplugin from "../../dist";
import glob from "tiny-glob";

async function main() {
  const entryPoints = await glob("../entries/*");

  await build({
    entryPoints,
    bundle: true,
    outdir: "./dist",
    external: ["*"],
    plugins: [unplugin.esbuild()],
  });
}

main();
