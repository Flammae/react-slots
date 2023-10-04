import { execSync } from "child_process";
import glob from "tiny-glob";

async function main() {
  const testDir = await glob("./test/*", { absolute: true });

  // const entries = testDir.find((val) => val.includes("entries"));
  const esbuild = testDir.find((val) => val.includes("esbuild"));
  const rollup = testDir.find((val) => val.includes("rollup"));
  const vite = testDir.find((val) => val.includes("vite"));

  console.log("\nEsbuild");
  execSync("npx esbuild --version", {
    cwd: esbuild,
    stdio: "inherit",
  });
  execSync("tsx esbuild.config.js", { cwd: esbuild, stdio: "inherit" });

  console.log("\nRollup");
  execSync("npx rollup --version", { cwd: rollup, stdio: "inherit" });
  execSync("npx rollup -c --bundleConfigAsCjs", {
    cwd: rollup,
    stdio: "inherit",
  });

  console.log("\nVite");
  execSync("npx vite --version", { cwd: vite, stdio: "inherit" });
  execSync("npx vite build", { cwd: vite, stdio: "inherit" });
}

main();
