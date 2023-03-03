import type {
	SlotName,
	TemplateFunction,
	CreateTemplate,
	SlotableNode,
} from "./types";

const templateFnCache: Map<SlotName, TemplateFunction<any, any>> = new Map();

/**
 * Gets TemplateFunction from cache or creates a new one.
 */
function getTemplateFunction(slotName: SlotName): TemplateFunction<any, any> {
	// Since react doesn't recommend creating function components in render phase,
	// we can use cache strategy which creates a function once during
	// the first render, and access the same function on subsequent renders.
	if (templateFnCache.has(slotName)) {
		return templateFnCache.get(slotName)!;
	}

	const TemplateFunction = () => {
		throw new Error("error");
	};
	TemplateFunction.slot = slotName;

	templateFnCache.set(slotName, TemplateFunction);

	return TemplateFunction;
}

export const Template = new Proxy(
	// Default Templates are same as named tamplates with `slot` set explicitly to `undefined`
	getTemplateFunction(undefined),
	{
		get: (target, prop) => {
			if (Reflect.has(target, prop)) {
				return Reflect.get(target, prop);
			}

			// Whatever consumer provides as prop will be the new named template
			return getTemplateFunction(prop);
		},
	}
) as CreateTemplate<any>;

/** Create typesafe `Template` */
export function createTemplate<T extends SlotableNode<any, any>>() {
	return Template as CreateTemplate<T>;
}
