import {
  COMPONENT_TYPE,
  SLOT_NAME,
  TEMPLATE_TYPE_IDENTIFIER,
} from "./constants";
import type { TemplateComponent, CreateTemplate, SlotChildren } from "./types";

const templateFnCache: Map<string, TemplateComponent<any, any>> = new Map();

/**
 * Gets TemplateComponent from cache or creates a new one.
 */
function getTemplateComponent<T extends string>(
  slotName: T,
): TemplateComponent<T, {}> {
  if (templateFnCache.has(slotName)) {
    return templateFnCache.get(slotName)!;
  }

  const TemplateComponent = Object.assign(
    () => {
      const name = String(TemplateComponent[SLOT_NAME]);
      throw new Error(
        `\`<Template.${name}>\` was rendered outside of \`useSlot()\`. \
Make sure the \`children\` is passed to \`useSlot\` as an argument, \
and that \`Template\` is a direct child (not nested in another element)`,
      );
    },
    {
      [COMPONENT_TYPE]: TEMPLATE_TYPE_IDENTIFIER,
      [SLOT_NAME]: slotName,
    },
  );

  templateFnCache.set(slotName, TemplateComponent);

  return TemplateComponent;
}

export const template = new Proxy({} as CreateTemplate<any>, {
  get: (target, prop) => {
    if (typeof prop === "symbol") {
      return Reflect.get(target, prop);
    }
    // Whatever consumer provides as prop will be the new named template
    return getTemplateComponent(prop);
  },
});

/** Create Type-safe Template */
export function createTemplate<T extends SlotChildren>() {
  return template as CreateTemplate<T>;
}
