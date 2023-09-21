// @ts-check
import unplugin from "../../dist";
import glob from "tiny-glob";

async function main() {
	const entry = await glob("../entries/*");

	return /** @type {import('vite').UserConfig} */ ({
		plugins: [unplugin.vite()],
		build: {
			lib: {
				entry,
				formats: ["es"],
			},
			minify: false,
			outDir: "./dist",
			sourcemap: false,
		},
	});
}

export default main();
