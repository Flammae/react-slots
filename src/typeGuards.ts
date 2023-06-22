import * as React from "react";
import { SlotName, TemplateComponent, TemplateProps } from "./types";
import { SLOT_NAME } from "./constants";

export function isTemplateFunction<N extends SlotName, P extends {}>(
	component: string | React.JSXElementConstructor<any>
): component is TemplateComponent<N, P> {
	return typeof component === "function" && component.hasOwnProperty(SLOT_NAME);
}

export function isTemplateElement<N extends SlotName, P extends {}>(
	element: React.ReactNode
): element is React.ReactElement<TemplateProps<P>, TemplateComponent<N, P>> {
	return React.isValidElement(element) && isTemplateFunction(element.type);
}

/** Note: {"slot-name": undefined} also passes */
export function isNamedSlot<N extends SlotName>(
	element: React.ReactElement
): element is React.ReactElement<{ ["slot-name"]: N }> {
	return element.props.hasOwnProperty("slot-name");
}
