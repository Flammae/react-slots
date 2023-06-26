import * as React from "react";
import { Union, Any } from "ts-toolbelt";
import { DEFAULT_TEMPLATE_AS, SLOT_NAME } from "./constants";

// Users can only define string slot names.
// `undefined` is reserved only for slots without names.
// While it wont be common, symbols can also be used as slot names
// and it's here for the sake of feature completion.
export type SlotName = string | symbol | undefined;

/**
 * @example
 * ```ts
 * type X = RemoveUndefinedValuesFromObject<{value: boolean | string | undefined}>
 * // {value: boolean | string}
 * ```
 */
type RemoveUndefinedValuesFromObject<T extends object> = T extends object
	? {
			[Name in keyof T]: Exclude<T[Name], undefined>;
	  }
	: never;

export type TemplateProps<
	Props extends object,
	As extends React.ElementType = typeof DEFAULT_TEMPLATE_AS
> = Any.Compute<
	{
		// Allow "as element" to have whatever it wants as a child.
		// Function as a child is reserved for props passed by <Slot> component,
		// so if "as element" also expects a function, two functions must be provided, the first one
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

export type TemplateComponent<TName extends SlotName, TProps extends object> = {
	<TAs extends React.ElementType = typeof DEFAULT_TEMPLATE_AS>(
		props: TemplateProps<TProps, TAs>
	): React.ReactElement | null;
	[SLOT_NAME]: TName;
};

export type SlottableNode<N extends SlotName, P extends object> =
	| React.ReactElement<TemplateProps<P>, TemplateComponent<N, P>>
	| React.ReactElement<{ "slot-name": N }, any>
	| (N extends undefined ? (props: P) => React.ReactNode : never)
	| (N extends undefined
			? string | number | boolean | null | undefined
			: never);

// --------------- //

type SlotTuple<TName extends SlotName, TProps extends object> = [TName, TProps];

type SlotTupleToSlottableNode<T extends SlotTuple<SlotName, object>> =
	T extends SlotTuple<infer TName, infer TProps>
		? SlottableNode<TName, TProps>
		: never;

type RemoveDuplicateSlots<
	U extends SlotTuple<SlotName, object>,
	_U = U
> = U extends SlotTuple<infer TName, {}>
	? SlotTuple<TName, {}> extends Exclude<_U, U>
		? never
		: U
	: never;

export type Slot<
	TName extends SlotName | object = undefined,
	TProps extends object = {}
> = TName extends object
	? SlotTuple<undefined, Exclude<TName, SlotName>>
	: SlotTuple<Exclude<TName, object>, object extends TProps ? {} : TProps>;

// Moving recursion outside helps to display Slots<...> consistently as SlottableNode<..., ...> on hover.
// Sometimes this shows up in the type declaration, hence why the ambiguous name
type Children<T extends SlottableNode<SlotName, object>> = T | Children<T>[]; // Something breaks if Iterable is used instead of an array

/**
 * Declares the type of children based on slots.
 * Provide the type union of `Slot` to accept different types of slotted children.
 * @example
 * ```ts
 * // Accepts children with 3 types of slots
 * type Children = Slots<Slot | Slot<"foo"> | Slot<"bar", {baz: boolean}>>
 * ```
 */
export type Slots<TSlot extends Slot<SlotName, {}> = Slot<SlotName, {}>> =
	| SlotTupleToSlottableNode<RemoveDuplicateSlots<TSlot>>
	| Children<SlotTupleToSlottableNode<RemoveDuplicateSlots<TSlot>>>;

/**
 * @example
 * ```ts
 * type X = GetTemplateUnions<Slots<Slot | Slot<'foo'> | Slot<bar: {baz: string}>>>
 * // | TemplateComponent
 * // | {foo: TemplateComponent<'foo', {}>
 * // | {bar: TemplateComponent<'bar', {baz: string}>}
 * ```
 */
type GetTemplateUnions<U> = U extends React.ReactElement<
	TemplateProps<any>,
	TemplateComponent<infer N, infer P>
>
	? N extends undefined
		? TemplateComponent<N, P>
		: { [Name in Exclude<N, undefined>]: TemplateComponent<N, P> }
	: never;

/**
 * @example
 * ```ts
 * type X = MergeTemplateUnions<
 *	| TemplateComponent<undefined, {}>
 *	| { foo: TemplateComponent<"foo", {}> }
 *	| { bar: TemplateComponent<"bar", { baz: string }> }
 * >;
 * // TemplateComponent & {
 * // 	foo: TemplateComponent<"foo", {}>,
 * // 	bar: TemplateComponent<"bar", {baz: string}>
 * // }
 * ```
 */
type MergeTemplateUnions<T extends object, _T extends object = T> = {
	1: T extends TemplateComponent<undefined, any>
		? T &
				RemoveUndefinedValuesFromObject<
					Union.Merge<Exclude<_T, TemplateComponent<undefined, any>>>
				>
		: never;
	0: RemoveUndefinedValuesFromObject<Union.Merge<_T>>;
}[Union.Has<_T, TemplateComponent<undefined, any>>];

/**
 * Create type-safe template
 * @example
 * ```ts
 * const MyComponentTemplate = Template as CreateTemplate<
 * 	Slots<Slot | Slot<"name", { foo: string }>>
 * >;
 * ```
 */
export type CreateTemplate<T extends Slots> = MergeTemplateUnions<
	GetTemplateUnions<T>
>;

// ------------------ //

export type SlotProps<TProps extends {}> = TProps & {
	children?: React.ReactNode;
};

export type SlotComponent<P extends {}> = {
	/** Slot Component */
	(props: SlotProps<P>): React.ReactElement | null;
	/** Check for slot content */
	(): boolean;
};

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
		? T & RemoveUndefinedValuesFromObject<Union.Merge<Exclude<_T, T>>>
		: never;
	0: RemoveUndefinedValuesFromObject<Union.Merge<_T>>;
}[Union.Has<_T, SlotComponent<any>>];

export type CreateSlotComponent<T> = MergeSlotComponentUnions<
	GetSlotComponentUnions<T>
>;

// TODO: make SlotChildren appear as union of Slots instead of SlotChildren
// TODO: Test for <Template as={Foo} ref={React.createRef} /> - should be <Template as={React.forwardRef(Foo, ref)}
// TODO: Test for reordering
// TODO: Test for <Template as={Slot} />
// DONE: Implement isThere object
// TODO: Test for dumb shit like <Slot children={<div />}>foo</Slot>
// TODO: Test for React 18
// TODO: Test the default returns of Slot and Slots and other types

// function test13() {
// 	return null;
// }
// test13[SLOT_NAME] = "test" as const;

// let test12: TemplateComponent<"test", { test2: boolean }> = test13;

// let test14: Slots<Slot<"test", { test2: boolean }>> = React.createElement(
// 	({ "slot-name": slotName }) => null,
// 	{ "slot-name": "test" }
// ) as Slots<Slot<"test", { test2: boolean }>>;
// let test15: Slots<Slot<"test">> = React.createElement(test12) as Slots<
// 	Slot<"test">
// >;

// let test16: Slots<Slot<"undefined">> = React.createElement("div", {
// 	"slot-name": "undefined" as const,
// 	foo: "bar",
// });

// let test17: Slots<Slot<{ test: boolean }>> = React.createElement("div", {
// 	"slot-name": undefined,
// });

// type z = Slot<"name"> extends Slot<"name", { test: true }> ? "t" : "f";

// let t: CreateTemplate<e>;

// type e = Slots<Slot<"namee"> | Slot<"name", { not: true }> | Slot<"beka">>;
// type g = CreateTemplate<e>["name"];
// type f = Slots;

// type Test2 = Slot<"name"> extends Slot ? "true" : "false";
// type Test3 = Slot extends Slot<"name"> ? "true" : "false";
// type Test4 = Slot<undefined> extends Slot<undefined, { test: boolean }>
// 	? "true"
// 	: "false";
// type Test5 = Slot<undefined, { test: boolean }> extends Slot<undefined>
// 	? "true"
// 	: "false";
// type Test6 = Slot<"", { test: boolean }> extends Slot<undefined>
// 	? "true"
// 	: "false";
// type Test7 = Slot extends Slot<{ test: boolean }> ? "true" : "false";
// type Test8 = Slot<{ test: boolean }> extends Slot ? "true" : "false";

// type X = TemplateProps<{ test: true }>;

// let asdads: Slots<Slot<"chil"> | Slot<"na", { a: 1 }>>;

// type asdasdada = Slots<Slot<"name"> | Slot<"not", { yellow: true }>>;

// type asd2 = ___Slot<"not", { yellow: true }> extends ___Slot<"not", {yellow: false}> ? 1 : 0;
