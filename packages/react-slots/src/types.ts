import * as React from "react";
import { Any } from "ts-toolbelt";
import {
  COMPONENT_TYPE,
  DEFAULT_TEMPLATE_AS,
  SLOT_NAME,
  TEMPLATE_TYPE_IDENTIFIER,
  SLOT_TYPE_IDENTIFIER,
  type DefaultSlotName,
} from "./constants";

// Note on {} vs object in type args.
// We like to write `extends object` whenever a type is exported because it's
// bit more stricter to what can actually be assigned to it.
// For utility types that don't get exported but are used by other types,
// we prefer {} because it looks cleaner on hover

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

type ElementType =
  | Exclude<React.ComponentType<any>, SlotComponent<any>>
  | Exclude<React.ElementType, React.ComponentType<any>>;

// In edition to merging props and overriding children,
// this type also manages to maintain whether children in original type
// was defined as required or optional argument
type MergeTPropsAndTAsProps<
  TProps extends {},
  TAsProps extends {},
  _TAsProps extends {} = 0 extends TAsProps & 1
    ? { children?: React.ReactNode }
    : TAsProps,
> = {
  [K in keyof _TAsProps]: K extends "children"
    ? // Allow "as element" to have whatever it wants as a child.
      // Function as a child is reserved for props passed by <Slot> component,
      // so if "as element" also expects a function as a child, two functions must be provided, the first one
      // for the template and the second for the "as element".
      // eg: (props: TemplateProps) => (props: AsElementChildFunctionProps) => ReactElement
      | ((props: TProps) => _TAsProps[K])
        | Exclude<_TAsProps[K], (arg: any) => any>
    : _TAsProps[K];
};

type TemplateProps<
  TProps extends {},
  TAs extends ElementType | SlotComponent<any>,
  TAsProps extends TAs extends SlotComponent<any> ? TProps : {},
> = { as?: TAs } & (TAs extends SlotComponent<any>
  ? // When we have:
    // <otherCompTemplate.default as={thisCompSlot.default}/>
    // This makes sure that props that child (otherComponent) specified is optional (can be overridden)
    // but the extra props that's specified in parent component's (thisComp) slot type is required to provide
    {
      children?: React.ReactNode;
    } & Partial<TProps> &
      Omit<TAsProps, "children" | keyof TProps>
  : MergeTPropsAndTAsProps<TProps, TAsProps>);

type UnwrapProps<T extends React.ElementType> = T extends SlotComponent<
  infer TProps
>
  ? TProps
  : React.ComponentPropsWithoutRef<T>;

export type TemplateComponent<TName extends string, TProps extends object> = {
  <TAs extends ElementType | SlotComponent<any> = typeof DEFAULT_TEMPLATE_AS>(
    // Typescript is failing to enforce `UnwrapProps<TAs> extends TProps` so
    // the next best thing is to wrap the type in another conditional type
    // and provide a custom error.
    // It's probably a ts bug because TemplateProps on it's own works as expected

    // UnwrapProps<TAs> can be any, so to avoid props inferred as string, we guard the distributivity by wrapping it in []
    props: [UnwrapProps<TAs>] extends [
      TAs extends SlotComponent<any> ? TProps : any,
    ]
      ? TemplateProps<TProps, TAs, UnwrapProps<TAs>>
      : "Props of `SlotComponent<:Props:>` must extend Props of `TemplateComponent<:Name:, :Props:>` when used for `as` prop",
  ): React.ReactElement | null;
  [SLOT_NAME]: TName;
  [COMPONENT_TYPE]: typeof TEMPLATE_TYPE_IDENTIFIER;
};

export type TemplateComponentLikeElement<
  TName extends string,
  TProps extends {},
> = React.ReactElement<
  {
    children?: React.ReactNode | ((props: TProps) => React.ReactNode);
    as?: React.ElementType;
  },
  {
    (props: any): any;
    [SLOT_NAME]: TName;
    [COMPONENT_TYPE]: typeof TEMPLATE_TYPE_IDENTIFIER;
  }
>;

export type TemplateAsSlotComponentLikeElement<
  TName extends string,
  TProps extends {},
> = React.ReactElement<
  {
    children?: React.ReactNode;
    as?: SlotComponent<TProps>;
  },
  {
    (props: any): any;
    [SLOT_NAME]: TName;
    [COMPONENT_TYPE]: typeof TEMPLATE_TYPE_IDENTIFIER;
  }
>;

type SlottableNode<TName extends string | DefaultSlotName, TProps extends {}> =
  | TemplateComponentLikeElement<TName, TProps>
  | TemplateAsSlotComponentLikeElement<TName, TProps>
  | React.ReactElement<{ "slot-name": TName }>
  | (DefaultSlotName extends TName ? (props: TProps) => React.ReactNode : never)
  | (DefaultSlotName extends TName
      ? string | number | boolean | null | undefined
      : never);

// --------------- //

type SlotTuple<TName extends string, TProps extends {}> = [TName, TProps];

type SlotTupleToSlottableNode<T extends SlotTuple<string, {}>> =
  T extends SlotTuple<infer TName, infer TProps>
    ? SlottableNode<TName, TProps>
    : never;

/**
 * Removes the disallowed props without cluttering the type declaration.
 * Compared to Omit which shows up on hover
 */
type OmitDisallowedProps<T extends {}> = T extends
  | { children?: any }
  | { key?: any }
  | { as?: any }
  | { ref?: any }
  ? { [P in Exclude<keyof T, "children" | "as" | "key" | "ref">]: T[P] }
  : T;

type DistributiveKeyOf<T extends {}> = T extends unknown ? keyof T : never;

export type Slot<
  TName extends string | undefined | object = undefined,
  TProps extends object = {},
> = 0 extends TName & 1
  ? SlotTuple<string, TProps>
  : TName extends object
  ? SlotTuple<DefaultSlotName, OmitDisallowedProps<TName>>
  : SlotTuple<
      TName extends undefined ? DefaultSlotName : Exclude<TName, object>,
      0 extends TProps & 1
        ? any // only true when TProps is any. Important for providing Base type to extend from
        : DistributiveKeyOf<OmitDisallowedProps<TProps>> extends never
        ? {} // When an empty object (or object with disallowed keys) are passed, change the type to `{}` because it looks clearer on hover
        : TProps extends unknown
        ? OmitDisallowedProps<TProps>
        : never
    >;

type MergeDuplicateSlots<
  U extends SlotTuple<string, any>,
  _U extends SlotTuple<string, any> = U,
> = U extends unknown ? SlotTuple<U[0], Extract<_U, [U[0], any]>[1]> : never;

// Moving recursion outside helps display SlotChildren<...> consistently as SlottableNode<..., ...> on hover.
// Sometimes this shows up in the type declaration on hover, hence why the ambiguous name
type Children<T extends SlottableNode<string, any>> = T | Children<T>[]; // Something breaks if Iterable is used instead of an array

type AnyCase<TSlot> = 0 extends TSlot & 1 ? Slot<string, any> : TSlot;

/**
 * Declares the type of children based on slots.
 * Provide the type union of `Slot` to accept different types of slotted children.
 * @example
 * ```ts
 * // The following type accepts children with three types of slots
 * type Children = Slots<Slot | Slot<"foo"> | Slot<"bar", {baz: boolean}>>
 * ```
 */
export type SlotChildren<TSlot extends Slot<string, any> = Slot<string, any>> =
  | SlotTupleToSlottableNode<MergeDuplicateSlots<AnyCase<TSlot>>>
  | Children<SlotTupleToSlottableNode<MergeDuplicateSlots<AnyCase<TSlot>>>>;

/**
 * @example
 * ```ts
 * type X = GetTemplateUnions<Slots<Slot | Slot<'foo'> | Slot<"bar", {baz: string}>>>
 * // | {default: TemplateComponent<"default", {}>
 * // | {foo: TemplateComponent<'foo', {}>
 * // | {bar: TemplateComponent<'bar', {baz: string}>}
 * ```
 */
type GetTemplateUnions<U> = U extends TemplateAsSlotComponentLikeElement<
  infer N,
  infer P
>
  ? { [Name in Exclude<N, undefined>]: TemplateComponent<N, P> }
  : never;
/**
 * Create type-safe template
 * @example
 * ```ts
 * const MyComponentTemplate = Template as CreateTemplate<
 * 	Slots<Slot | Slot<"name", { foo: string }>>
 * >;
 * ```
 */
export type CreateTemplate<T extends SlotChildren> = {} & Any.Compute<
  UnionToIntersection<
    GetTemplateUnions<Exclude<0 extends T & 1 ? SlotChildren : T, undefined>>
  >,
  "flat"
>;

// ------------------ //

export type SlotProps<TProps extends {}> = TProps & {
  children?: React.ReactNode;
};

// If all properties on P are optional then defaultContent and props can be optional,
// Otherwise both should be specified
export type SlotComponent<P extends {}> = {
  [COMPONENT_TYPE]: typeof SLOT_TYPE_IDENTIFIER;
} & ([Partial<P>] extends [P]
  ? {
      /** Slot Component */
      (props: SlotProps<P>): React.ReactElement | null;
      /** Slot Function */
      (
        defaultContent?: React.ReactNode,
        props?: P & { key?: React.Key },
        key?: React.Key,
      ): React.ReactElement | null;
    }
  : {
      /** Slot Component */
      (props: SlotProps<P>): React.ReactElement | null;
      /** Slot Function */
      (
        defaultContent: React.ReactNode,
        props: P & { key?: React.Key },
        key?: React.Key,
      ): React.ReactElement | null;
    });

type GetSlotComponentUnions<T> = T extends TemplateAsSlotComponentLikeElement<
  infer N,
  infer P
>
  ? { [Name in N]: SlotComponent<P> }
  : never;

type CreateSlotComponent<T extends SlotChildren> = {} & Any.Compute<
  UnionToIntersection<
    GetSlotComponentUnions<0 extends T & 1 ? SlotChildren : T>
  >,
  "flat"
>;

export type CreateSlot<T extends SlotChildren> = CreateSlotComponent<T>;

// -------------------- //

export type HasSlot<T extends SlotChildren> = Any.Compute<{
  [Name in Extract<
    T,
    React.ReactElement<{ "slot-name": string }>
  >["props"]["slot-name"]]: true | undefined;
}>;

// export type HasSlot<T extends Slots> = T extends TemplateAsSlotComponentLikeElement<<

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
