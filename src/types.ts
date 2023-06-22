import * as React from "react";
import { Union, Any } from "ts-toolbelt";
import { DEFAULT_TEMPLATE_AS, SLOT_NAME } from "./constants";

// Users can only define string solot names.
// `undefined` is reserved only for slots without names.
// While it wont be common, symbols can also be used as slot names
// and it's here for the sake of feature completion.
export type SlotName = string | symbol | undefined;

function test13() {
	return null;
}
test13[SLOT_NAME] = "test" as const;

let test12: TemplateComponent<"test", { test2: boolean }> = test13;
const test123 = test12[SLOT_NAME];

let test14: Slot<"test", { test2: boolean }> = React.createElement(
	({ "slot-name": slotName }) => null,
	{ "slot-name": "test" }
) as Slot<"test", { test2: boolean }>;
let test15: Slot<"test"> = React.createElement(test12) as Slot<"test">;

let test16: Slot<"undefined"> = React.createElement("div", {
	"slot-name": "undefined",
	foo: "bar",
});

let test17: Slot<{ test: boolean }> = React.createElement("div", {
	"slot-name": undefined,
});

export type TemplateProps<
	Props extends {},
	As extends React.ElementType = typeof DEFAULT_TEMPLATE_AS
> = Any.Compute<
	{
		// Allow "as element" to have whatever it wants as a child.
		// Function as a child is reserved for props passed by <Slot> component,
		// so if "as element" also expects a function, two functions can be provided, the first one
		// for the template and the second for the "as element".
		// eg: (props: TemplateProps) => (props: AsElementChildFunctionProps) => ReactElement
		children?:
			| ((props: Props) => React.ComponentPropsWithoutRef<As>["children"])
			| Exclude<
					React.ComponentPropsWithoutRef<As>["children"],
					(arg: any) => any
			  >;
		as?: As;
	} & Omit<React.ComponentPropsWithoutRef<As>, "children">,
	"flat"
>;

type RemoveUndefined<T extends object> = T extends object
	? {
			[Name in keyof T]: Exclude<T[Name], undefined>;
	  }
	: never;

type X = TemplateProps<{ test: true }>;

export type TemplateComponent<Name extends SlotName, Props extends {}> = {
	<TAs extends React.ElementType = typeof DEFAULT_TEMPLATE_AS>(
		props: TemplateProps<Props, TAs>
	): React.ReactElement | null;
	[SLOT_NAME]: Name;
};

export type SlotableNode<N extends SlotName, P extends {}> =
	| React.ReactElement<{ "slot-name": N }, any>
	| React.ReactElement<TemplateProps<P>, TemplateComponent<N, P>>
	| (N extends undefined ? (props: P) => React.ReactNode : never)
	| (N extends undefined
			? string | number | boolean | null | undefined
			: never);
// | SlotableNode<N, P>[];

type Test2 = Slot<"name"> extends Slot ? "true" : "false";
type Test3 = Slot extends Slot<"name"> ? "true" : "false";
type Test4 = Slot<undefined> extends Slot<undefined, { test: boolean }>
	? "true"
	: "false";
type Test5 = Slot<undefined, { test: boolean }> extends Slot<undefined>
	? "true"
	: "false";
type Test6 = Slot<"", { test: boolean }> extends Slot<undefined>
	? "true"
	: "false";
type Test7 = Slot extends Slot<{ test: boolean }> ? "true" : "false";
type Test8 = Slot<{ test: boolean }> extends Slot ? "true" : "false";

export type Slot<
	N extends SlotName | object = undefined,
	P extends object = object
> = N extends object
	? SlotableNode<undefined, Exclude<N, SlotName>>
	: SlotableNode<Exclude<N, object>, object extends P ? {} : P>;

// Something breaks if Iterable is used instead of an array
// changed Slot<any> to Slot<SlotName> something might break.
export type SlotChildren<S extends SlotableNode<any, any> = Slot<SlotName>> =
	| S
	| SlotChildren<S>[];

type GetTemplateUnions<T> = T extends React.ReactElement<
	TemplateProps<any>,
	TemplateComponent<infer N, infer P>
>
	? N extends undefined
		? TemplateComponent<N, P>
		: { [Name in Exclude<N, undefined>]: TemplateComponent<N, P> }
	: never;

type MergeTemplateUnions<T extends object, _T extends object = T> = {
	1: T extends TemplateComponent<undefined, any>
		? T &
				RemoveUndefined<
					Union.Merge<Exclude<_T, TemplateComponent<undefined, any>>>
				>
		: never;
	0: RemoveUndefined<Union.Merge<_T>>;
}[Union.Has<_T, TemplateComponent<undefined, any>>];

export type CreateTemplate<T> = MergeTemplateUnions<GetTemplateUnions<T>>;

type Children = SlotChildren<
	Slot<{ test: true }> | Slot<"name"> | Slot<"nam2e">
>;

let t: CreateTemplate<any>;

// ------------------ //

export type SlotComponent<P extends {}> = (props: P) => React.ReactNode;

type GetSlotComponentUnions<T> = T extends React.ReactElement<
	TemplateProps<any>,
	TemplateComponent<infer N, infer P>
>
	? N extends undefined
		? SlotComponent<P>
		: { [Name in Exclude<N, undefined>]: SlotComponent<P> }
	: never;

type MergeSlotComponentUnions<T extends object, _T extends object = T> = {
	1: T extends SlotComponent<any>
		? T & RemoveUndefined<Union.Merge<Exclude<_T, T>>>
		: never;
	0: RemoveUndefined<Union.Merge<_T>>;
}[Union.Has<_T, SlotComponent<any>>];

type Ash = MergeSlotComponentUnions<GetSlotComponentUnions<SlotChildren>>;

export type CreateSlotComponent<T> = MergeSlotComponentUnions<
	GetSlotComponentUnions<T>
>;

type Test123421 = CreateSlotComponent<SlotChildren>;

// TODO: make SlotChildren appear as union of Slots instead of SlotChildren
// TODO: Test for <Template as={Foo} ref={React.createRef} /> - should be <Template as={React.forwardRef(Foo, ref)}
// TODO: Test for reordering
// TODO: Test for <Template as={Slot} />
// TODO: Implement isThere object
