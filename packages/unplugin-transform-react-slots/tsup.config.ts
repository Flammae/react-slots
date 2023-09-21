import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["./src/*.ts"],
	format: ["cjs", "esm"],
	target: "node16.14",
	clean: true,
	dts: true,
});
