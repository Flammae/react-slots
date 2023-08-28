/* eslint-disable import/export */
import { cleanup, render } from "@testing-library/react";
import * as React from "react";
import { afterEach } from "vitest";
import {
	template,
	useSlot,
	type CreateTemplate,
	type Slot,
	type SlotChildren,
} from "../src";

afterEach(() => {
	cleanup();
});

type Props = {
	children?: SlotChildren<Slot<{ prop: string }>>;
};
function Child({ children }: Props) {
	const slot = useSlot(children);
}

// test("Default slot renders default templates, elements with unspecified react-slot attribute, react-slot='default', regular react nodes", () => {
//   // render()
//   <Child></Child>
// })

describe("Default slot", () => {
	type Props = {
		children?: SlotChildren<Slot<{ prop: string }> | Slot<"named">>;
	};

	function DefaultSlotTest({ children }: Props) {
		const { slot } = useSlot(children);

		return slot.default(<div>Default Content</div>, { prop: "test" });
	}

	const defaultTestTemplate = template as CreateTemplate<Props["children"]>;

	test("renders default templates, functions, elements with unspecified react-slot attribute, react-slot='default', regular react nodes", () => {
		const { asFragment } = render(
			<DefaultSlotTest>
				<defaultTestTemplate.default>
					<div>Default Template #1</div>
				</defaultTestTemplate.default>
				<defaultTestTemplate.default>
					{() => <div>Default Template #2</div>}
				</defaultTestTemplate.default>
				{() => {
					return <div>Function</div>;
				}}
				<defaultTestTemplate.named>
					<div>Should not be rendered</div>
				</defaultTestTemplate.named>
				<div>No react-slot attribute</div>
				<div react-slot="default">react-slots=default</div>
				JSXText
				{"string"}
				{42}
			</DefaultSlotTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  <div>
			    Default Template #1
			  </div>
			  <div>
			    Default Template #2
			  </div>
			  <div>
			    Function
			  </div>
			  <div>
			    No react-slot attribute
			  </div>
			  <div
			    react-slot="default"
			  >
			    react-slots=default
			  </div>
			  JSXTextstring42
			</DocumentFragment>
		`);
	});

	test("Calls child function with the right argument", () => {
		const { asFragment } = render(
			<DefaultSlotTest>
				{({ prop }) => <div>Function arg: {prop}</div>}
				<defaultTestTemplate.default>
					{({ prop }) => <div>Template function arg: {prop}</div>}
				</defaultTestTemplate.default>
			</DefaultSlotTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  <div>
			    Function arg: test
			  </div>
			  <div>
			    Template function arg: test
			  </div>
			</DocumentFragment>
		`);
	});

	test("Filters out null, undefined, boolean, keeps 0", () => {
		const { asFragment } = render(
			<DefaultSlotTest>
				{null}
				{undefined}
				<div>Just something to divide the content</div>
				{true}
				{false}
				{0}
			</DefaultSlotTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  <div>
			    Just something to divide the content
			  </div>
			  0
			</DocumentFragment>
		`);
	});
});

test("`hasSlot` keeps track of whether content is provided", () => {
	type Props = {
		children?: SlotChildren<Slot | Slot<"named">>;
	};

	function HasSlotTest({ children }: Props) {
		const { hasSlot } = useSlot(children);

		return <>{hasSlot.default ? "true" : "false"}</>;
	}

	const hasSlotTestTemplate = template as CreateTemplate<Props["children"]>;

	const { asFragment, rerender } = render(
		<HasSlotTest>
			{null}
			{undefined}
			{true}
			{false}
			<hasSlotTestTemplate.named>Should not count</hasSlotTestTemplate.named>
		</HasSlotTest>
	);

	expect(asFragment()).toMatchInlineSnapshot(`
		<DocumentFragment>
		  false
		</DocumentFragment>
	`);

	rerender(
		<HasSlotTest>
			{null}
			{undefined}
			{true}
			{false}
			{0}
		</HasSlotTest>
	);
	expect(asFragment()).toMatchInlineSnapshot(`
		<DocumentFragment>
		  true
		</DocumentFragment>
	`);

	rerender(
		<HasSlotTest>
			<hasSlotTestTemplate.default>Should count</hasSlotTestTemplate.default>
		</HasSlotTest>
	);
	expect(asFragment()).toMatchInlineSnapshot(`
		<DocumentFragment>
		  true
		</DocumentFragment>
	`);

	// JSXText
	rerender(<HasSlotTest> </HasSlotTest>);
	expect(asFragment()).toMatchInlineSnapshot(`
		<DocumentFragment>
		  true
		</DocumentFragment>
	`);

	rerender(<HasSlotTest></HasSlotTest>);
	expect(asFragment()).toMatchInlineSnapshot(`
		<DocumentFragment>
		  false
		</DocumentFragment>
	`);
});

describe("Template component", () => {
	type Props = {
		children?: SlotChildren<
			Slot<{ foo: string }> | Slot<"named", { bar: string }>
		>;
	};

	function TemplateComponentTest({ children }: Props) {
		const { slot } = useSlot(children);
		return (
			<>
				<div>{slot.default("default content", { foo: "foo" })}</div>
				<div>{slot.named("default content", { bar: "bar" })}</div>
			</>
		);
	}

	const testTemplate = template as CreateTemplate<Props["children"]>;

	test("child function is called with right arguments", () => {
		const { asFragment } = render(
			<TemplateComponentTest>
				{({ foo }) => foo}
				<testTemplate.named>{({ bar }) => bar}</testTemplate.named>
			</TemplateComponentTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  <div>
			    foo
			  </div>
			  <div>
			    bar
			  </div>
			</DocumentFragment>
		`);
	});
	test("renders children when not a function", () => {
		const { asFragment } = render(
			<TemplateComponentTest>
				<testTemplate.default>default template</testTemplate.default>
				<testTemplate.named>Named template</testTemplate.named>
			</TemplateComponentTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  <div>
			    default template
			  </div>
			  <div>
			    Named template
			  </div>
			</DocumentFragment>
		`);
	});
	test("renders `as` element with correct props when `as` is intrinsic element name", () => {
		const { asFragment } = render(
			<TemplateComponentTest>
				<testTemplate.default as="div" style={{ color: "red" }}>
					{({ foo }) => foo}
				</testTemplate.default>
				<testTemplate.named as="input" placeholder="foo"></testTemplate.named>
			</TemplateComponentTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  <div>
			    <div
			      style="color: red;"
			    >
			      foo
			    </div>
			  </div>
			  <div>
			    <input
			      placeholder="foo"
			    />
			  </div>
			</DocumentFragment>
		`);
	});
	test("renders `as` element with correct props when `as` is a custom component", () => {
		function CustomComp({
			prop,
			children,
		}: {
			prop: number;
			children: React.ReactNode;
		}) {
			return (
				<>
					<div>{children}</div>
					<div>{prop}</div>
				</>
			);
		}

		const { asFragment } = render(
			<TemplateComponentTest>
				<testTemplate.default as={CustomComp} prop={42}>
					{({ foo }) => foo}
				</testTemplate.default>
				<testTemplate.named as={CustomComp} prop={69}>
					A react node
				</testTemplate.named>
			</TemplateComponentTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  <div>
			    <div>
			      foo
			    </div>
			    <div>
			      42
			    </div>
			  </div>
			  <div>
			    <div>
			      A react node
			    </div>
			    <div>
			      69
			    </div>
			  </div>
			</DocumentFragment>
		`);
	});

	test("renders nothing when no children provided", () => {
		const { asFragment } = render(
			<TemplateComponentTest>
				<testTemplate.named></testTemplate.named>
			</TemplateComponentTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  <div>
			    default content
			  </div>
			  <div />
			</DocumentFragment>
		`);
	});

	test("renders 0", () => {
		const { asFragment } = render(
			<TemplateComponentTest>
				<testTemplate.named>0</testTemplate.named>
			</TemplateComponentTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  <div>
			    default content
			  </div>
			  <div>
			    0
			  </div>
			</DocumentFragment>
		`);
	});

	test("child function is called with an empty object when no props are provided", () => {
		function Test({ children }: any) {
			const { slot } = useSlot(children);
			return slot.default();
		}

		const { asFragment } = render(
			<Test>
				{(prop: {}) => {
					expect(prop).toEqual({});
					return null;
				}}
				<template.default>
					{(prop: {}) => {
						expect(prop).toEqual({});
						return null;
					}}
				</template.default>
			</Test>
		);
	});

	test("renders an element with a key if specified", () => {
		type Props = {
			children?: SlotChildren<Slot | Slot<"named">>;
		};
		function SlotTest({ children }: Props) {
			const { slot } = useSlot(children);

			const defaultElement = slot.default();
			expect(defaultElement?.props.children.key).toBe("1");

			const namedElement = slot.named();
			expect(namedElement?.props.children.key).toBe("2");

			return defaultElement;
		}

		render(
			<SlotTest>
				<template.default key={1}></template.default>
				<template.named key={2} as="div"></template.named>
			</SlotTest>
		);
	});
});

describe("Slot function", () => {
	test("renders provided content when called with no arguments", () => {
		function SlotTest({ children }: any) {
			const { slot } = useSlot(children);
			return slot.default();
		}

		const { asFragment } = render(<SlotTest>foo</SlotTest>);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  foo
			</DocumentFragment>
		`);
	});
	test("renders nothing when no arguments are provided and content is not provided", () => {
		function SlotTest({ children }: any) {
			const { slot } = useSlot(children);
			return slot.default();
		}

		const { asFragment } = render(<SlotTest></SlotTest>);

		expect(asFragment()).toMatchInlineSnapshot("<DocumentFragment />");
	});
	test("renders default content when no content is provided", () => {
		function SlotTest({ children }: any) {
			const { slot } = useSlot(children);
			return slot.default("default content");
		}

		const { asFragment } = render(<SlotTest></SlotTest>);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  default content
			</DocumentFragment>
		`);
	});
	test("renders 0 when provided as default content", () => {
		function SlotTest({ children }: any) {
			const { slot } = useSlot(children);
			return slot.default(0);
		}

		const { asFragment } = render(<SlotTest></SlotTest>);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  0
			</DocumentFragment>
		`);
	});
	test("calls template function with props", () => {
		function SlotTest({ children }: any) {
			const { slot } = useSlot(children);
			return slot.default(null, { prop: "knock " });
		}

		const { asFragment } = render(
			<SlotTest>
				<template.default>{({ prop }: any) => prop}</template.default>
				{({ prop }: any) => prop}
			</SlotTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  knock knock 
			</DocumentFragment>
		`);
	});
	test("renders an element with a key when provided with props. Props won't include key when executed", () => {
		type Props = {
			children: SlotChildren<Slot<{ prop: string }>>;
		};
		function SlotTest({ children }: Props) {
			const { slot } = useSlot(children);
			const element = slot.default(null, { prop: "foo", key: 1 });

			expect(element?.key).toBe("1");
			return element;
		}

		render(
			<SlotTest>
				<template.default>
					{(props) => {
						expect(props).toEqual({ prop: "foo" });
						return null;
					}}
				</template.default>
			</SlotTest>
		);
	});
	test("renders an element with a key when provided as third argument", () => {
		type Props = {
			children?: SlotChildren<Slot<{ prop: string }>>;
		};
		function SlotTest({ children }: Props) {
			const { slot } = useSlot(children);
			const element = slot.default(null, { prop: "foo" }, 1);

			expect(element?.key).toBe("1");
			return element;
		}

		render(<SlotTest></SlotTest>);
	});
	test("renders an element with the first key when provided with props as well as third argument", () => {
		type Props = {
			children?: SlotChildren<Slot<{ prop: string }>>;
		};
		function SlotTest({ children }: Props) {
			const { slot } = useSlot(children);
			const element = slot.default(null, { prop: "foo", key: 1 }, 2);

			expect(element?.key).toBe("1");
			return element;
		}

		render(<SlotTest></SlotTest>);
	});
	test("can render the same slot multiple times and provide different props", () => {
		type Props = {
			children?: SlotChildren<Slot<{ prop: string }>>;
		};
		function SlotTest({ children }: Props) {
			const { slot } = useSlot(children);
			return (
				<>
					{slot.default(null, { prop: "foo" })}
					{slot.default(null, { prop: "bar" })}
				</>
			);
		}

		const { asFragment } = render(
			<SlotTest>{({ prop }) => <div>{prop}</div>}</SlotTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  <div>
			    foo
			  </div>
			  <div>
			    bar
			  </div>
			</DocumentFragment>
		`);
	});
});

describe("Template as slot function", () => {
	type ChildProps = {
		children: SlotChildren<Slot<{ foo: string; bar: string }> | Slot<"named">>;
	};
	const childTemplate = template as CreateTemplate<ChildProps["children"]>;
	function Child({ children }: ChildProps) {
		const { slot } = useSlot(children);
		return (
			<>
				<div id="child-div-1">
					{slot.default(
						"child's default content",
						{ foo: "foo", bar: "bar" },
						1
					)}
				</div>
				<div id="child-div-1">{slot.named(<>child's default content</>)}</div>
			</>
		);
	}

	// TODO: Test that template of Slot<"named"> can accept slot of Slot<{foo: string}> for `as` but require foo to be set

	type TemplateAsSlotTestProps = {
		children: SlotChildren<
			| Slot<{ foo: string; bar: string; baz: string }>
			| Slot<"named", { baz?: string }>
		>;
	};
	function TemplateAsSlotTest({ children }: TemplateAsSlotTestProps) {
		const { slot } = useSlot(children);
		return (
			<Child>
				<childTemplate.default
					as={slot.default}
					foo="overridden foo"
					baz="baz"
					key={2}
				>
					Own default content
				</childTemplate.default>
				<childTemplate.named as={slot.named} baz="baz" />
			</Child>
		);
	}

	test("renders parent's content into child's slot", () => {
		const { asFragment } = render(
			<TemplateAsSlotTest>
				Rendered from parent
				<template.named as="button">Rendered from parent</template.named>
			</TemplateAsSlotTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  <div
			    id="child-div-1"
			  >
			    Rendered from parent
			  </div>
			  <div
			    id="child-div-1"
			  >
			    <button>
			      Rendered from parent
			    </button>
			  </div>
			</DocumentFragment>
		`);
	});
	test("merges child slot's props and own props. Own props overrides child props. Keys are omitted", () => {
		const { asFragment } = render(
			<TemplateAsSlotTest>
				<template.default>
					{(props: any) => {
						expect(props).toEqual({
							foo: "overridden foo",
							bar: "bar",
							baz: "baz",
						});
						return null;
					}}
				</template.default>
			</TemplateAsSlotTest>
		);
	});
	test("renders child slot's default content when no children is provided", () => {
		const { asFragment } = render(
			// testing the named slot only
			<TemplateAsSlotTest>
				<template.default></template.default>
			</TemplateAsSlotTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  <div
			    id="child-div-1"
			  />
			  <div
			    id="child-div-1"
			  >
			    child's default content
			  </div>
			</DocumentFragment>
		`);
	});
	test("renders own children even if child slot specified default content", () => {
		const { asFragment } = render(
			// testing the default slot only
			<TemplateAsSlotTest>
				<template.named></template.named>
			</TemplateAsSlotTest>
		);

		expect(asFragment()).toMatchInlineSnapshot(`
			<DocumentFragment>
			  <div
			    id="child-div-1"
			  >
			    Own default content
			  </div>
			  <div
			    id="child-div-1"
			  />
			</DocumentFragment>
		`);
	});
	test("respects parent template's keys, it's own keys and child slot's keys", () => {
		function Child({ children }: any) {
			const { slot } = useSlot(children);

			const element = slot.default(null, null, 1);
			expect(element?.key).toBe("1");
			expect(element?.props.children.key).toBe("2");
			expect(element?.props.children.props.children.key).toBe("3");
			return element;
		}

		function KeyTest({ children }: any) {
			const { slot } = useSlot(children);
			return (
				<Child>
					<template.default as={slot.default} key={2} />
				</Child>
			);
		}

		render(
			<KeyTest>
				<template.default key={3} />
			</KeyTest>
		);
	});
});
