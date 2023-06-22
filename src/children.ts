import * as React from "react";
import type { SlotName, SlotChildren, TemplateComponent } from "./types";
import {
	isNamedSlot,
	isTemplateElement,
	isTemplateFunction,
} from "./typeGuards";
import { DEFAULT_TEMPLATE_AS, SLOT_NAME } from "./constants";

/** Same as SlotableNode but without elements with `slot-name` property. */
type Child =
	| React.ReactElement
	| React.ReactElement<TemplateComponent<any, any>, any>
	| ((props: any) => React.ReactNode)
	| string
	| number
	| boolean
	| null
	| undefined;

export default class Children {
	#children = new Map<
		SlotName,
		{
			nodes: Child[];
			hasFunction: boolean;
		}
	>();

	private set(slotName: SlotName, node: Child): void {
		if (!this.#children.has(slotName)) {
			this.#children.set(slotName, {
				nodes: [],
				hasFunction: false,
			});
		}

		const child = this.#children.get(slotName)!;

		if (typeof node === "function" || isTemplateElement(node)) {
			child.hasFunction = true;
		}

		child.nodes.push(node);
	}

	build(children: SlotChildren): void {
		this.#children.clear();

		React.Children.forEach(children, (child) => {
			const isValidElement = React.isValidElement(child);

			if (isValidElement && isTemplateFunction(child.type)) {
				// <Template.foo />
				this.set(child.type[SLOT_NAME], child);
			} else if (isValidElement && isNamedSlot(child)) {
				// <div slot-name="foo" />
				const newElemenent = React.cloneElement(child);
				delete newElemenent.props["slot-name"];
				this.set(child.props["slot-name"], newElemenent);
			} else {
				// <div />, (props) => <div />, "foo", 42, true, false, null, undefined
				this.set(undefined, child as Child);
			}
		});
	}

	get(slotName: SlotName, props: {}): React.ReactNode {
		const children = this.#children.get(slotName);
		const Wrapper = React.Fragment;

		if (!children) {
			return undefined;
		}

		if (!children.hasFunction) {
			return React.createElement(
				Wrapper,
				{},
				...(children.nodes as React.ReactNode[])
			);
		}

		return React.createElement(
			Wrapper,
			{},
			...children.nodes.map((node) => {
				if (typeof node === "function") {
					return node(props);
				}
				if (isTemplateElement(node)) {
					const {
						as: Component = DEFAULT_TEMPLATE_AS,
						children,
						...componentProps
					} = node.props;

					Object.assign(componentProps, { key: node.key });

					return React.createElement(
						Component,
						componentProps,
						typeof children === "function" ? children(props) : children
					);
				}
				return node;
			})
		);
	}
}
