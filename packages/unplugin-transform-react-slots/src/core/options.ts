type FilterPattern = RegExp | RegExp[];

export interface Options {
	include?: FilterPattern;
	exclude?: FilterPattern;
}

export const defaultInclude =
	/\.(js)|(jsx)|(cjs)|(cjsx)|(mjs)|(mjsx)|(tsx)|(ctsx)|(mtsx)/;

export function resolveOption(options: Options = {}): Required<Options> {
	const include = options.include ?? defaultInclude;

	let exclude: FilterPattern = [/node_modules/];
	if (options.exclude) {
		exclude = exclude.concat(options.exclude);
	}

	return {
		include,
		exclude,
	};
}
