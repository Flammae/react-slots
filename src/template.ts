import { SLOT_NAME } from "./constants";
import type {
	SlotName,
	TemplateComponent,
	CreateTemplate,
	Slots,
} from "./types";

const templateFnCache: Map<SlotName, TemplateComponent<any, any>> = new Map();

/**
 * Gets TemplateComponent from cache or creates a new one.
 */
function getTemplateComponent<T extends SlotName>(
	slotName: T
): TemplateComponent<T, any> {
	if (templateFnCache.has(slotName)) {
		return templateFnCache.get(slotName)!;
	}

	const TemplateComponent = Object.assign(
		() => {
			const name = String(TemplateComponent[SLOT_NAME]);
			throw new Error(
				`\`<Template.${name}>\` was rendered outside of \`useSlot()\`. \
				Make sure the \`children\` is passed to \`useSlot\` as an argument, \
				and that \`Template\` is a direct child (not nested in another element)`
			);
		},
		{ [SLOT_NAME]: slotName }
	);

	templateFnCache.set(slotName, TemplateComponent);

	return TemplateComponent;
}

export const Template = new Proxy(
	// Default Templates are same as named tamplates with `slot` set explicitly to `undefined`
	getTemplateComponent(undefined) as CreateTemplate<any>,
	{
		get: (target, prop) => {
			if (prop === SLOT_NAME) {
				return Reflect.get(target, prop);
			}
			// Whatever consumer provides as prop will be the new named template
			return getTemplateComponent(prop);
		},
	}
);

/** Create Typesafe Template */
export function createTemplate<T extends Slots>() {
	return Template as CreateTemplate<T>;
}
