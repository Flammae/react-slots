import * as React from "react";
import Children from "./children";
import type {
	Slots,
	SlotComponent,
	CreateSlotComponent,
	SlotName,
	SlotProps,
} from "./types";

class SlotProxyCreator<T extends Slots> {
	constructor() {
		// Function types have "name" and "length" properties on them which show up on hasOwnProperty check.
		// We override those to let users name their slots "name" or "length" if they want.
		// @ts-ignore
		this.SlotProxy.name = this.getSlotComponent("name");
		// @ts-ignore
		this.SlotProxy.length = this.getSlotComponent("length");
	}

	private children = new Children();

	private SlotProxy = new Proxy(
		this.getSlotComponent(undefined) as CreateSlotComponent<T>,
		{
			get: (target, property) => {
				if (Object.prototype.hasOwnProperty.call(target, property)) {
					return Reflect.get(target, property);
				}
				const addedProperty = this.getSlotComponent(property);
				Reflect.set(target, property, addedProperty);
				return addedProperty;
			},
		}
	);

	private getSlotComponent<TName extends SlotName, TProps extends {}>(
		slotName: TName
	): SlotComponent<TProps> {
		const that = this;

		function SlotComponent(props?: SlotProps<TProps>): any {
			const isChildrenProvided = that.children.has(slotName);

			if (typeof props === "undefined") {
				return isChildrenProvided;
			}

			const { children: slotChildren, ...rest } = props;

			if (!isChildrenProvided) {
				return slotChildren;
			}

			return that.children.get(slotName, rest);
		}

		return SlotComponent;
	}

	build(children: T): SlotProxyCreator<T> {
		this.children.build(children);
		return this;
	}

	getSlotProxy(): CreateSlotComponent<T> {
		return this.SlotProxy;
	}
}

/**
 * Returns Slot component
 */
export function useSlot<T extends Slots>(children: T): CreateSlotComponent<T> {
	const proxyCreator = new SlotProxyCreator<T>();

	const prevChildren = React.useRef<T>();
	if (prevChildren.current !== children) {
		proxyCreator.build(children);
	}
	let proxy = proxyCreator.getSlotProxy();
	prevChildren.current = children;

	return proxy;
}
