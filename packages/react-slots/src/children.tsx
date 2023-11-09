import * as React from "react";
import type { SlotChildren } from "./types";
import {
  isNamedSlot,
  isTemplateElement,
  isTemplateComponent,
  isSlotComponent,
} from "./typeGuards";
import { DEFAULT_SLOT_NAME, DEFAULT_TEMPLATE_AS, SLOT_NAME } from "./constants";
import { forEachNode, shouldDiscard } from "./forEachNode";
import {
  OverrideConfig,
  applyOverride,
  applyOverrideToAll,
  extractOverrideConfig,
} from "./OverrideNode";
import { HiddenArg } from "./HiddenArg";
import { template } from "./template";

const Slot = (props: any) => props.children;
function createSlotElement(
  children: React.ReactNode,
  key: React.Key | undefined,
  slotNameAttr: string | undefined,
  // Wrapper was initially a fragment but you can't have "slot-name" attr on it
  Wrapper: React.ElementType = Slot,
) {
  const props = {
    "slot-name": slotNameAttr,
    key: key,
  };
  if (key === undefined) delete props.key;
  if (slotNameAttr === undefined) delete props["slot-name"];

  return React.createElement(Wrapper, props, children);
}

function validateProps(props: {}) {
  if (props.hasOwnProperty("as")) {
    throw new Error("slot cannot have `as` property");
  }

  if (props.hasOwnProperty("children")) {
    throw new Error(
      "slot cannot have `children` property. Specify the children for fallback separately",
    );
  }

  if (props.hasOwnProperty("ref")) {
    throw new Error("slot cannot have ref");
  }
}

// function createTemplateElement

export default class Children {
  private children = new Map<
    string,
    {
      nodes: Exclude<React.ReactNode, Iterable<any>>[];
      hasTemplate: boolean;
    }
  >();

  private set(
    slotName: string,
    node: Exclude<React.ReactNode, Iterable<any>>,
  ): void {
    if (!this.children.has(slotName)) {
      this.children.set(slotName, {
        nodes: [],
        hasTemplate: false,
      });
    }

    const child = this.children.get(slotName)!;

    if (isTemplateElement(node)) {
      child.hasTemplate = true;
    }

    child.nodes.push(node);
  }

  build(children: SlotChildren): void {
    this.children.clear();

    forEachNode(children, (child) => {
      const isValidElement = React.isValidElement(child);

      if (isValidElement && isTemplateComponent(child.type)) {
        // <Template.foo />
        this.set(child.type[SLOT_NAME], child);
      } else if (isValidElement && isNamedSlot(child)) {
        // <div slot-name="foo" />
        const newProps: Partial<typeof child.props> = Object.assign(
          child.key ? { key: child.key } : {},
          child.props,
        );
        delete newProps["slot-name"];

        const newElement = React.createElement(child.type, newProps);
        this.set(child.props["slot-name"], newElement);
      } else if (typeof child === "function") {
        // (props) => <div />
        this.set(
          DEFAULT_SLOT_NAME,
          // We need to wrap functions in template elements so that later React.Children.map can operate on it
          <template.default>{child}</template.default>,
        );
      } else {
        // <div />, "foo", 42
        this.set(DEFAULT_SLOT_NAME, child);
      }
      // true, false, null, undefined is removed by forEachSlot
    });
  }

  get(
    slotName: string,
    defaultContent: React.ReactNode,
    props: {},
    slotKey: React.Key | undefined,
    slotNameAttr: string | undefined, // slot-name attribute on slot element
    previousOverrideConfig: OverrideConfig[],
    previousDefaultContent: React.ReactNode,
  ): React.ReactElement {
    validateProps(props);
    // It's important that we don't remove the key that consumer provides on both
    // template components and slot components. In both cases the original elements are
    // removed from the tree but we insert (usually) a fragment there with the same key that
    // was specified on the element.

    let { config, children: _defaultContent } = extractOverrideConfig(
      React.isValidElement(defaultContent) &&
        // babel-plugin-transform-react-slots wraps children with a special element called default-content-wrapper
        defaultContent.type === "default-content-wrapper"
        ? defaultContent.props.children
        : defaultContent,
      previousOverrideConfig,
      slotName,
    );

    if (!this.has(slotName)) {
      return createSlotElement(
        shouldDiscard(_defaultContent)
          ? previousDefaultContent
          : _defaultContent,
        slotKey,
        slotNameAttr,
      );
    }

    const children = this.children.get(slotName)!;

    if (!children.hasTemplate) {
      return createSlotElement(
        applyOverrideToAll(
          children.nodes,
          config,
          0,
          slotName,
          null,
        ) as React.ReactNode[],
        slotKey,
        slotNameAttr,
      );
    }

    return createSlotElement(
      React.Children.map(children.nodes, (node) => {
        if (isTemplateElement(node)) {
          let {
            as: Component = DEFAULT_TEMPLATE_AS,
            children,
            ...componentProps
          } = node.props;

          if ("ref" in node && node.ref !== null) {
            throw new Error(
              "Templates cannot have refs." + "as" in node.props
                ? " If you are trying to get a reference of the element in `as` prop, move the element inside children"
                : "",
            );
          }

          if (isTemplateComponent(Component)) {
            throw new Error(
              "Template can't accept another Template for `as` prop.",
            );
          }

          if (isSlotComponent(Component)) {
            if (typeof children === "function") {
              throw new Error(
                "Template whose `as` prop is a slot cannot have a function as a child",
              );
            }

            // when a slot A is being rendered by another slot B, A overrides B
            // in both default content and props
            return Component(
              children,
              {
                ...props,
                ...componentProps,
              },
              undefined,
              // @ts-expect-error Fourth and fifth arguments are not visible to consumers
              new HiddenArg(config),
              new HiddenArg(_defaultContent),
            );
          }

          const test = React.createElement(
            Component,
            componentProps,
            applyOverrideToAll(
              typeof children === "function" ? children(props) : children,
              config,
              0,
              slotName,
              logTemplateReturnedFunctionError,
            ),
          );
          return test;
        }
        // If not a template element
        const test = applyOverride(node, config, 0, slotName);
        return test;
      }),
      slotKey,
      slotNameAttr,
    );
  }

  has(slotName: string): boolean {
    return this.children.has(slotName);
  }

  keys() {
    return this.children.keys();
  }
}

function logTemplateReturnedFunctionError() {
  console.error(
    "The '${slotName}' template attempted to render a function, which is not a valid React element. This will be excluded from the final result.",
  );
}
