import * as React from "react";
import { type Any } from "ts-toolbelt";
import { Function } from "ts-toolbelt";
import { forEachNode, forEachNodeReplace } from "./forEachNode";

type AllowedNodes = React.ElementType | StringConstructor | NumberConstructor;

type GetProps<T extends AllowedNodes> = T extends StringConstructor
  ? never
  : T extends NumberConstructor
  ? never
  : React.ComponentPropsWithRef<T>;

type GetNode<T extends AllowedNodes> = T extends NumberConstructor
  ? number
  : T extends StringConstructor
  ? string
  : React.ReactElement<
      GetProps<T>,
      Exclude<T, StringConstructor | NumberConstructor>
    >;

// In an ideal world, OverrideNodeProps would be an union of two objects where one has 'node'
// and the other one has 'props` but TS doesn't enforce that and
// using Union.Strict gives a really cryptic error.
type OverrideNodeProps<
  T extends AllowedNodes,
  U extends "throw" | "ignore" | "remove" = "throw",
  TNode = GetNode<T>,
  TProps = Any.Compute<GetProps<T>, "flat">,
> = {
  /**
   * An array specifying allowed React intrinsic element names or custom component names.
   * It restricts the provided element types or direct children types (if no content is provided).
   * Include capital String or capital Number to denote string and number nodes.
   * Combine with `enforce` to handle disallowed nodes and with `props` or `node` to transform matching nodes.
   */
  allowedNodes?: readonly T[];
  /**
   * Specifies the action to take with nodes that aren't allowed, in combination with `allowedNodes`.
   * By default an error is thrown when it comes across a disallowed node.
   */
  enforce?: U;
  children?: U extends "ignore" ? React.ReactNode : TNode;
  /**
   * Transforms the props of provided elements or fallback elements. You can provide a function that will be
   * called with the current props of the element, and the returned object will be merged into the existing props.
   * Alternatively, you can use an object with prop names and transformation functions.
   * Return value of transformation functions overrides the prop. There are some predefined Transformation
   * functions on OverrideNode object which you can use.
   */
  props?:
    | ((props: TProps) => Partial<TProps>)
    | {
        [K in keyof TProps]?: (
          prop: Exclude<TProps[K], undefined>,
          propName: K,
          slotName: string,
        ) => TProps[K];
      };
  /**
   * Called with each provided node and can be used to transform or replace each node.
   */
  node?: (node: TNode) => React.ReactNode;
};

export type OverrideConfig = React.ReactElement<
  OverrideNodeProps<any, "throw" | "ignore" | "remove">
>;

export type OverrideNode = {
  <T extends AllowedNodes, U extends "throw" | "ignore" | "remove">(
    props: OverrideNodeProps<T, U>,
  ): React.ReactElement | null;
  /** Concatenates a string x with a space to the original prop. */
  stringAppend: (
    x: string,
  ) => <T>(
    prop: T,
  ) =>
    | string
    | (undefined extends T ? undefined : never)
    | (null extends T ? null : never);
  /** prepends a string x with a space to the original prop.  */
  stringPrepend: (
    x: string,
  ) => <T>(
    prop: T,
  ) =>
    | string
    | (undefined extends T ? undefined : never)
    | (null extends T ? null : never);
  /** Intercepts a call to a prop and executes the x function before the original function. */
  chainBefore: <T extends (...args: any[]) => any>(
    x: Function.NoInfer<T>,
  ) => (prop: T, propName: keyof any, slotName: string) => T;
  /** Intercepts a call to a prop and executes the x function after the original function. */
  chainAfter: <T extends (...args: any[]) => any>(
    x: Function.NoInfer<T>,
  ) => (prop: T, propName: keyof any, slotName: string) => T;
  /** Overrides prop */
  override: <T>(x: Function.NoInfer<T>) => (prop: T) => T;
};

export const OverrideNode = (() => {
  throw new Error(
    `\`<OverrideNode />\` can only be a direct child of a slot element. \
Make sure \`OverrideNode\` is not wrapped in an element other than \`slot\``,
  );
}) as unknown as OverrideNode;

function stringConcat(a: unknown, b: unknown): string {
  let newA = a == undefined ? "" : "" + a;
  let newB = b == undefined ? "" : "" + b;

  return newA && newB ? `${newA} ${newB}` : `${newA}${newB}`;
}

function executeOrThrow(
  prop: ((...args: any[]) => any) | undefined,
  args: any[],
  propName: keyof any,
  slotName: string,
) {
  if (typeof prop === "function") {
    return prop(...args);
  } else if (prop == undefined) {
    return undefined;
  }
  throw new Error(
    `Expected the ${propName.toString()} prop for an element for ${slotName} slot to be a \`function\` or \`undefined\`, instead saw ${
      prop === null ? null : typeof prop
    } `,
  );
}

OverrideNode.stringAppend =
  (x) =>
  (prop): any => {
    if (x === undefined || x === null) {
      return prop;
    }
    return stringConcat(prop, x);
  };
OverrideNode.stringPrepend =
  (x) =>
  (prop): any => {
    if (x === undefined || x === null) {
      return prop;
    }
    return stringConcat(x, prop);
  };
OverrideNode.chainBefore =
  (x) =>
  (prop, propName, slotName): any => {
    return function (...args: Parameters<typeof prop>) {
      x(...args);
      return executeOrThrow(prop, args, propName, slotName);
    };
  };
OverrideNode.chainAfter =
  (x) =>
  (prop, propName, slotName): any => {
    return function (...args: Parameters<typeof prop>) {
      const returnVal = executeOrThrow(prop, args, propName, slotName);
      x(...args);
      return returnVal;
    };
  };
OverrideNode.override = (x) => () => {
  return x;
};

export function extractOverrideConfig(
  nodes: React.ReactNode,
  appendConfig: OverrideConfig[],
  slotName: string,
): {
  children: React.ReactNode;
  config: OverrideConfig[];
} {
  const config: OverrideConfig[] = [];

  const children = React.Children.map(nodes, (node) => {
    if (React.isValidElement(node) && node.type === OverrideNode) {
      node = node as OverrideConfig;
      config.push(node);

      if (node.props.children) {
        return (
          <OverrideChildren
            config={[node].concat(appendConfig)}
            slotName={slotName}
          >
            {node.props.children}
          </OverrideChildren>
        );
      } else {
        // Replace OverrideNode that has no children
        // with nulls to maintain the shape of children.
        return null;
      }
    } else {
      if (appendConfig.length) {
        return (
          <OverrideChildren config={appendConfig} slotName={slotName}>
            {node}
          </OverrideChildren>
        );
      }
      return node;
    }
  });

  return { config: config.concat(appendConfig), children };
}

function OverrideChildren(props: {
  children: React.ReactNode;
  config: OverrideConfig[];
  slotName: string;
}) {
  return applyOverrideToAll(
    props.children,
    props.config,
    0,
    props.slotName,
    () => {
      console.error(
        `The '${props.slotName}' slot attempted to render a function as fallback content, which is not a valid React element. It will be excluded from the final result.`,
      );
    },
  );
}

function isAllowed(
  type: any,
  allowedNodes: readonly AllowedNodes[] | undefined,
) {
  if (!Array.isArray(allowedNodes)) {
    return true;
  }
  return allowedNodes.includes(type);
}

function enforce<const T>(
  enforceType: "throw" | "ignore" | "remove" | undefined,
  child: T,
  allowedNodes: readonly AllowedNodes[],
  slotName: string,
) {
  switch (enforceType) {
    case "ignore":
      return child;
    case "remove":
      return null;
    case "throw":
    default:
      throw new Error(
        `${
          React.isValidElement(child)
            ? `${
                typeof child.type === "function"
                  ? (child.type as any).displayName || child.type.name
                  : child.type
              } element`
            : typeof child
        } is not a valid node type for the '${slotName}' slot. Allowed nodes are: ${allowedNodes.map(
          (n) =>
            n === String
              ? "string literal"
              : n === Number
              ? "number literal"
              : n,
        )}`,
      );
  }
}

export function applyOverrideToAll(
  children: React.ReactNode,
  config: OverrideConfig[],
  configStartIndex: number,
  slotName: string,
  logFunctionError: ((slotName: string) => void) | null,
) {
  if (logFunctionError) {
    forEachNode(children, (child) => {
      if (typeof child === "function") {
        logFunctionError(slotName);
      }
    });
  }

  return React.Children.map(children, (child) => {
    return applyOverride(
      child as Exclude<typeof child, Iterable<any>>,
      config,
      configStartIndex,
      slotName,
    );
  });
}

export function applyOverride(
  child: Exclude<React.ReactNode, Iterable<any>>,
  config: OverrideConfig[],
  configStartIndex: number,
  slotName: string,
): React.ReactNode {
  let newChild = child;

  for (let i = configStartIndex; i < config.length; i++) {
    switch (newChild) {
      case undefined:
      case null:
      case true:
      case false:
        return null;
    }

    let currentConfig = config[i].props;

    if ("props" in currentConfig && "node" in currentConfig) {
      console.error(
        `\`OverrideNode\` cannot have both \`props\` and \`node\` as props, only the \`node\` function will be executed. Found This error on \`OverrideNode\` of '${slotName}' slot`,
      );
    }

    if (
      !isAllowed(
        typeof newChild === "string"
          ? String
          : typeof newChild === "number"
          ? Number
          : React.isValidElement(newChild)
          ? newChild.type
          : newChild,
        currentConfig.allowedNodes,
      )
    ) {
      newChild = enforce(
        currentConfig.enforce,
        newChild,
        currentConfig.allowedNodes!,
        slotName,
      );
      continue;
    }

    if (typeof currentConfig.node === "function") {
      const overriddenNodes = currentConfig.node(newChild);
      // Consumer can override node's type and even return multiple nodes,
      // so we need to start applying the remaining override config to each of the returned nodes.
      return forEachNodeReplace(overriddenNodes, (node) => {
        if (typeof node === "function") {
          console.error(
            `A function was returned to replace a React node in the \`node\` property of the '${slotName}' slot's \`OverrideNode\`. Functions are not valid React elements and will be removed from the final result.`,
          );
          return null;
        }
        return applyOverride(node, config, i + 1, slotName);
      });
    }

    if (React.isValidElement(newChild)) {
      if (typeof currentConfig.props === "function") {
        newChild = React.cloneElement(
          newChild,
          currentConfig.props(newChild.props),
        );
      } else if (
        typeof currentConfig.props === "object" &&
        typeof currentConfig.props !== null
      ) {
        const newProps: typeof currentConfig.props = {};
        for (const [prop, override] of Object.entries(currentConfig.props)) {
          if (typeof override === "function") {
            newProps[prop] = override(
              (newChild.props as any)[prop],
              prop,
              slotName,
            );
          }
        }
        newChild = React.cloneElement(newChild, newProps);
      }
    }
  }

  return newChild;
}
