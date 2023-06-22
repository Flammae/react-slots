import type {
	SlotChildren,
	SlotComponent,
	CreateSlotComponent,
	SlotName,
} from "./types";
import Children from "./children";

class SlotProxyCreator<T extends SlotChildren> {
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

	private getSlotComponent<Tn extends SlotName, Tp extends {}>(
		slotName: Tn
	): SlotComponent<Tp> {
		const that = this;
		function SlotComponent(props: Tp) {
			return that.children.get(slotName, props);
		}
		return SlotComponent;
	}

	getSlotProxy(children: T) {
		this.children.build(children);
		return this.SlotProxy;
	}
}

export function useSlot<T extends SlotChildren>(
	children: T
): CreateSlotComponent<T> {
	const proxyCreator = new SlotProxyCreator<T>();

	const proxy = proxyCreator.getSlotProxy(children);

	return proxy;
}
