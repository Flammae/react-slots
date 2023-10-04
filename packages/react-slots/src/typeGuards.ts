import * as React from "react";
import {
  SlotComponent,
  TemplateAsSlotComponentLikeElement,
  TemplateComponent,
  TemplateComponentLikeElement,
} from "./types";
import {
  COMPONENT_TYPE,
  SLOT_TYPE_IDENTIFIER,
  TEMPLATE_TYPE_IDENTIFIER,
} from "./constants";

function isReactSlotsComponent<N extends string, P extends {}>(
  component: string | React.JSXElementConstructor<any>,
): component is TemplateComponent<N, P> | SlotComponent<P> {
  return (
    typeof component === "function" && component.hasOwnProperty(COMPONENT_TYPE)
  );
}

export function isTemplateComponent<N extends string, P extends {}>(
  component: string | React.JSXElementConstructor<any>,
): component is TemplateComponent<N, P> {
  return (
    isReactSlotsComponent(component) &&
    component[COMPONENT_TYPE] === TEMPLATE_TYPE_IDENTIFIER
  );
}

export function isSlotComponent<P extends {}>(
  component: string | React.JSXElementConstructor<any>,
): component is SlotComponent<P> {
  return (
    isReactSlotsComponent(component) &&
    component[COMPONENT_TYPE] === SLOT_TYPE_IDENTIFIER
  );
}

export function isTemplateElement<N extends string, P extends {}>(
  element: React.ReactNode,
): element is
  | TemplateComponentLikeElement<N, P>
  | TemplateAsSlotComponentLikeElement<N, P> {
  return React.isValidElement(element) && isTemplateComponent(element.type);
}

/** Note: {"slot-name": undefined} also passes */
export function isNamedSlot<N extends string>(
  element: React.ReactElement,
): element is React.ReactElement<{ ["slot-name"]: N }> {
  return element.props.hasOwnProperty("slot-name");
}
