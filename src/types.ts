import * as React from "react";
import { Union, Any } from "ts-toolbelt";
// Users can only define string solot names.
// Undefined is used only for default slots without names.
// While it wont be common, symbols can also be used as slot names
// and it's here for the sake of feature completion.
export type SlotName = Exclude<string, "slot"> | symbol | undefined;

function test13() {
	return null;
}
test13.slot = "test" as const;

let test12: TemplateFunction<"test", { test2: boolean }> = test13;

let test14: Slot<"test", { test2: boolean }> = React.createElement(
	({ "slot-name": slotName }) => null,
	{ "slot-name": "test" }
) as Slot<"test", { test2: boolean }>;
let test15: Slot<"test"> = React.createElement(test12) as Slot<"test">;

let test16: Slot<"undefined"> = [
	React.createElement("div", {
		"slot-name": "undefined",
	}),
	React.createElement("div", {
		"slot-name": "undefined",
	}),
];

let test17: Slot<{ test: boolean }> = React.createElement("div", {
	"slot-name": undefined,
});

export type TemplateProps<
	Props extends {},
	As extends React.ElementType = typeof React.Fragment
> = Any.Compute<
	{
		children?:
			| ((props: Props) => React.ComponentPropsWithoutRef<As>["children"])
			| Exclude<
					React.ComponentPropsWithoutRef<As>["children"],
					(arg: any) => any
			  >;
		$as?: As;
	} & Omit<React.ComponentPropsWithoutRef<As>, "children">,
	"flat"
>;

type X = TemplateProps<{ test: true }>;

export type TemplateFunction<Name extends SlotName, Props extends {}> = {
	<TAs extends React.ElementType>(
		props: TemplateProps<Props, TAs>
	): React.ReactElement | null;
	slot: Name;
};

export type SlotableNode<N extends SlotName, P extends {}> =
	| React.ReactElement<{ "slot-name": N }, any>
	| React.ReactElement<TemplateProps<P>, TemplateFunction<N, P>>
	| (N extends undefined ? (props: P) => React.ReactNode : never)
	| (N extends undefined ? string | number | boolean | null | undefined : never)
	| SlotableNode<N, P>[];

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

export type SlotChildren<S extends SlotableNode<any, any>> =
	| S
	| SlotChildren<S>[];

type GetTemplateUnions<T> = T extends React.ReactElement<
	TemplateProps<any>,
	TemplateFunction<infer N, infer P>
>
	? N extends undefined
		? TemplateFunction<N, P>
		: { [Name in Exclude<N, undefined>]: TemplateFunction<N, P> }
	: never;

type MergeTemplateUnions<T extends object, _T extends object = T> = {
	1: T extends TemplateFunction<undefined, any>
		? T & Union.Merge<Exclude<_T, TemplateFunction<undefined, any>>>
		: never;
	0: Union.Merge<_T>;
}[Union.Has<_T, TemplateFunction<undefined, any>>];

export type CreateTemplate<T> = MergeTemplateUnions<GetTemplateUnions<T>>;

type Children = SlotChildren<
	Slot<{ test: true }> | Slot<"name"> | Slot<"nam2e">
>;

let t: CreateTemplate<any>;
