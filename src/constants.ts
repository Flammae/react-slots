import * as React from "react";

/**
 * Used for specifying slot name on a TemplateComponent.
 * We set it as a property on the function
 */
export const SLOT_NAME: unique symbol = Symbol("slot name");

export const DEFAULT_TEMPLATE_AS = React.Fragment;
