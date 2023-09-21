import unplugin from "../../dist/index.mjs";
import typescript from "rollup-plugin-typescript2";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import glob from "tiny-glob";

async function main() {
	const jsxEntries = await glob("../entries/*.jsx");

	const tsxEntries = await glob("../entries/*.tsx");

	return [
		{
			input: jsxEntries,
			output: {
				dir: "./dist",
			},
			plugins: [
				unplugin.rollup(),
				nodeResolve({
					extensions: [".js"],
				}),
				babel({
					babelHelpers: "bundled",
					presets: ["@babel/preset-react"],
					extensions: [".js", ".jsx"],
				}),
				commonjs(),
			],
			external: ["react"], // For cleaner build. Real projects won't need to specify this
		},
		{
			input: tsxEntries,
			output: {
				dir: "./dist",
			},
			plugins: [
				unplugin.rollup(),
				nodeResolve({
					extensions: [".js"],
				}),
				commonjs(),
				typescript({
					tsconfigOverride: {
						compilerOptions: {
							module: "ESNext",
							moduleResolution: "node10",
							jsx: "react",
						},
						include: ["./test/entries/**.tsx"],
					},
				}),
			],
			external: ["react"], // For cleaner build. Real projects won't need to specify this
		},
	];
}

export default main();
