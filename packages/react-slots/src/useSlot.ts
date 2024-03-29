import * as React from "react";
import Children from "./children";
import type {
  SlotChildren,
  CreateSlot,
  SlotProps,
  SlotComponent,
  HasSlot,
} from "./types";
import { COMPONENT_TYPE } from "./constants";
import { HiddenArg } from "./HiddenArg";
import { OverrideConfig } from "./OverrideNode";

class SlotProxyFactory<T extends SlotChildren> {
  private children = new Children();
  private slotProxy: CreateSlot<T>;

  constructor() {
    this.slotProxy = new Proxy({} as CreateSlot<T>, {
      get: (target, property) => {
        if (
          Object.prototype.hasOwnProperty.call(target, property) ||
          typeof property === "symbol"
        ) {
          return Reflect.get(target, property);
        }
        const addedProperty = this.getSlotComponent(property);
        Reflect.set(target, property, addedProperty);
        return addedProperty;
      },
    });
  }

  private getSlotComponent(slotName: string): SlotComponent<any> {
    const that = this;

    const SlotComponent: SlotComponent<any> = Object.assign(
      (
        defaultNode?: React.ReactNode | SlotProps<{}>,
        props?: {},
        key?: React.Key,
        hiddenPreviousConfig?: HiddenArg<OverrideConfig[]>,
        hiddenPreviousDefaultNode?: HiddenArg<React.ReactNode>,
      ) => {
        if (
          !React.isValidElement(defaultNode) &&
          typeof defaultNode === "object" &&
          defaultNode !== null &&
          !(Symbol.iterator in defaultNode)
        ) {
          throw new Error(
            "To use slots as JSX elements, it's essential to enable `babel-plugin-transform-react-slots`. Alternatively, you can opt for the function signature instead.",
          );
        }

        let _props;
        let _slotNameAttr;
        let _key = key;

        if (props == undefined) {
          _props = {};
        } else if (typeof props !== "object") {
          throw new Error(
            "`props` must be an object, instead saw " + typeof props,
          );
        } else if ("key" in props || "slot-name" in props) {
          let { key, "slot-name": slotNameAttr, ...rest } = props as any;
          _props = rest;
          _slotNameAttr = slotNameAttr;
          _key = key;
        } else {
          _props = props;
        }

        return that.children.get(
          slotName,
          defaultNode,
          _props,
          _key,
          _slotNameAttr,
          hiddenPreviousConfig && hiddenPreviousConfig instanceof HiddenArg
            ? hiddenPreviousConfig.arg
            : [],
          hiddenPreviousDefaultNode &&
            hiddenPreviousDefaultNode instanceof HiddenArg
            ? hiddenPreviousDefaultNode.arg
            : [],
        );
      },
      {
        [COMPONENT_TYPE]: "slot" as const,
      },
    );

    return SlotComponent;
  }

  build(children: T): SlotProxyFactory<T> {
    this.children.build(children);
    return this;
  }

  getHasSlot(): HasSlot<T> {
    let hasSlot: { [index: string]: true | undefined } = {};
    for (const key of this.children.keys()) {
      hasSlot[key] = true;
    }
    return hasSlot as HasSlot<T>;
  }

  getSlotProxy(): CreateSlot<T> {
    return this.slotProxy;
  }
}

export function useSlot<T extends SlotChildren>(
  children: T,
): { slot: CreateSlot<T>; hasSlot: HasSlot<T> } {
  const proxyCreator = new SlotProxyFactory<T>();

  // const prevChildren = React.useRef<T>();
  // if (prevChildren.current !== children) {
  proxyCreator.build(children);
  // }
  let proxy = proxyCreator.getSlotProxy();
  // prevChildren.current = children;

  return { slot: proxy, hasSlot: proxyCreator.getHasSlot() };
}
