import * as React from "react";
import type { SlotChildren, TemplateComponent } from "./types";
import {
	isNamedSlot,
	isTemplateElement,
	isTemplateComponent,
	isSlotComponent,
} from "./typeGuards";
import { DEFAULT_SLOT_NAME, DEFAULT_TEMPLATE_AS, SLOT_NAME } from "./constants";

function forEachSlot(
	children: SlotChildren,
	callback: (child: SlotChildren) => void
): void {
	switch (children) {
		case null:
		case undefined:
		case true:
		case false:
			return;
	}

	if (Array.isArray(children)) {
		children.forEach((child) => {
			forEachSlot(child, callback); // Recursively handle nested arrays
		});
	} else {
		callback(children);
	}
}

function createSlotElement(
	wrapper: React.ElementType,
	key: React.Key | undefined,
	children: React.ReactNode[]
) {
	return React.createElement(wrapper, key ? { key } : null, ...children);
}

function validateProps(props: {}) {
	if (props.hasOwnProperty("as")) {
		throw new Error("slot cannot have `as` property");
	}

	if (props.hasOwnProperty("children")) {
		throw new Error("slot cannot have `children` property");
	}

	if (props.hasOwnProperty("ref")) {
		throw new Error("slot cannot have ref");
	}
}

// function createTemplateElement

/** Same as SlottableNode but without elements with `slot-name` property. */
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
	private children = new Map<
		string,
		{
			nodes: Child[];
			hasFunction: boolean;
		}
	>();

	private set(slotName: string, node: Child): void {
		if (!this.children.has(slotName)) {
			this.children.set(slotName, {
				nodes: [],
				hasFunction: false,
			});
		}

		const child = this.children.get(slotName)!;

		if (typeof node === "function" || isTemplateElement(node)) {
			child.hasFunction = true;
		}

		child.nodes.push(node);
	}

	build(children: SlotChildren): void {
		this.children.clear();

		forEachSlot(children, (child) => {
			const isValidElement = React.isValidElement(child);

			if (isValidElement && isTemplateComponent(child.type)) {
				// <Template.foo />
				this.set(child.type[SLOT_NAME], child);
			} else if (isValidElement && isNamedSlot(child)) {
				// <div slot-name="foo" />
				const newProps: Partial<typeof child.props> = Object.assign(
					child.key ? { key: child.key } : {},
					child.props
				);
				delete newProps["slot-name"];

				const newElement = React.createElement(child.type, newProps);
				this.set(child.props["slot-name"], newElement);
			} else {
				// <div />, (props) => <div />, "foo", 42
				this.set(DEFAULT_SLOT_NAME, child as Child);
			}
			// true, false, null, undefined is removed by forEachSlot
		});
	}

	get(
		slotName: string,
		defaultContent: React.ReactNode,
		props: {},
		slotKey?: React.Key
	): React.ReactElement {
		// It's important that we don't remove the key that consumer provides on both
		// template components and slot components. In both cases the original elements are
		// removed from the tree but we insert (usually) a fragment there with the same key that
		// was specified on the element.

		const Wrapper = React.Fragment;

		if (!this.has(slotName)) {
			return createSlotElement(Wrapper, slotKey, [defaultContent]);
		}

		const children = this.children.get(slotName)!;

		if (!children.hasFunction) {
			return createSlotElement(
				Wrapper,
				slotKey,
				children.nodes as React.ReactNode[]
			);
		}

		validateProps(props);

		return createSlotElement(
			Wrapper,
			slotKey,
			children.nodes.map((node) => {
				if (typeof node === "function") {
					return node(props);
				}

				if (isTemplateElement(node)) {
					let {
						as: Component = DEFAULT_TEMPLATE_AS,
						children,
						...componentProps
					} = node.props;

					if ("ref" in node && node.ref !== null) {
						throw new Error(
							"Templates cannot have refs." + "as" in node.props
								? " If you are trying to get the reference of the element in `as` prop, move the element inside children."
								: ""
						);
					}

					if (isTemplateComponent(Component)) {
						throw new Error(
							"Template can't accept another Template for `as` prop."
						);
					}

					if (isSlotComponent(Component)) {
						if (typeof children === "function") {
							throw new Error(
								"Template whose `as` prop is a slot can't have a function as a child"
							);
						}

						// when a slot A is being rendered by another slot B, A overrides B
						// in both default content and props
						return Component(
							children || defaultContent,
							{
								...props,
								...componentProps,
							},
							node.key || undefined
						);
					}

					Object.assign(componentProps, node.key ? { key: node.key } : {});

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

	has(slotName: string): boolean {
		return this.children.has(slotName);
	}

	keys() {
		return this.children.keys();
	}
}
