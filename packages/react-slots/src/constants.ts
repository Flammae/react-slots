import * as React from "react";

/**
 * Used for specifying slot name on a TemplateComponent.
 * We set it as a property on the function
 */
export const SLOT_NAME: unique symbol = Symbol("Slot name");

export const COMPONENT_TYPE: unique symbol = Symbol("Component type");

export const SLOT_TYPE_IDENTIFIER = "slot" as const;

export const TEMPLATE_TYPE_IDENTIFIER = "template" as const;

export const DEFAULT_TEMPLATE_AS = React.Fragment;

export const DEFAULT_SLOT_NAME = "default";

export const SLOT_NAME_ATTR = "slot-name";

export type SlotNameAttr = typeof SLOT_NAME_ATTR;

export type DefaultSlotName = typeof DEFAULT_SLOT_NAME;

// dummy text 2
