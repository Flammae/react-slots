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
      ) => {
        if (
          !React.isValidElement(defaultNode) &&
          typeof defaultNode === "object" &&
          defaultNode !== null
        ) {
          throw new Error(
            "To utilize slots as JSX elements, it's essential to enable `babel-plugin-transform-react-slots`. Alternatively, you can opt for the function signature instead.",
          );
        }

        let _props;
        let _key = key;

        if (typeof props === "undefined" || props === null) {
          _props = {};
        } else if (typeof props !== "object") {
          throw new Error(
            "`props` mus be an object, instead saw " + typeof props,
          );
        } else if ("key" in props) {
          let { key, ...rest } = props;
          _key = key as any; // React will handle the bad keys
          _props = rest;
        } else {
          _props = props;
        }

        return that.children.get(slotName, defaultNode, _props, _key);
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
