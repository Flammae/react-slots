import { createUnplugin } from "unplugin";
import { createFilter } from "@rollup/pluginutils";
import { type Options, resolveOption, defaultInclude } from "./core/options";
import { transformAsync } from "@babel/core";
import transformReactSlots from "@beqa/babel-plugin-transform-react-slots";
import SyntaxTypescript from "@babel/plugin-syntax-typescript";

// Matches @disable-transform-react-slots at the very start. Only line comments or block comments can precede it
const isDisabledRegex =
	/^(?:\s*(?:\/\/[^\n\r]*|\/\*(?:.|[\n\r])*?\*\/))*\s*\/\/\s*@disable-transform-react-slots\W/;

function appendTestComment(code: string, isDisabled: boolean): string {
	if (isDisabled) {
		code +=
			"/* slot transformation skipped by unplugin-transform-react-slots */";
	} else {
		code += "/* slot transformation done by unplugin-transform-react-slots */";
	}
	return code;
}

export default createUnplugin<Options | undefined, false>((rawOptions) => {
	const options = resolveOption(rawOptions);
	const filter = createFilter(options.include, options.exclude);

	return {
		name: "unplugin-transform-react-slots",

		enforce: "pre",

		transformInclude(id) {
			return filter(id);
		},

		async transform(code, id) {
			if (id.endsWith(".ts")) {
				return appendTestComment(code, true);
			}

			if (isDisabledRegex.test(code)) {
				return appendTestComment(code, true);
			}

			if (!(code.includes("@beqa/react-slots") && code.includes("useSlot"))) {
				return appendTestComment(code, true);
			}

			const transformed = await transformAsync(code, {
				plugins: [
					id.endsWith(".tsx") ? [SyntaxTypescript, { isTSX: true }] : "",
					transformReactSlots,
				].filter(Boolean),
				filename: id,
			});

			if (!transformed) {
				throw new Error(
					"unplugin-transform-react-slots failed to transform file: " + id
				);
			}

			// TODO: test if returning babel sourcemap makes it better or worse
			return transformed.code && appendTestComment(transformed.code, false);
		},

		esbuild: {
			onLoadFilter:
				!!options.include && !Array.isArray(options.include)
					? options.include
					: defaultInclude,
			loader(code, id) {
				if (id.endsWith("tsx")) {
					return "tsx";
				}

				if (id.endsWith("ts")) {
					return "ts";
				}

				return "jsx";
			},
		},
	};
});
