import * as React from "react";
import {
  COMPONENT_TYPE,
  DEFAULT_TEMPLATE_AS,
  SLOT_NAME,
  TEMPLATE_TYPE_IDENTIFIER,
  SLOT_TYPE_IDENTIFIER,
  type DefaultSlotName,
} from "./constants";
import { Pretty, UnionToIntersection } from "./typeUtils";

// Note on {} vs object in type args.
// We like to write `extends object` whenever a type is exported because it's
// bit more stricter to what can actually be assigned to it.
// For utility types that don't get exported but are used by other types,
// we prefer {} because it looks cleaner on hover

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
    ? // Only allow children of the as element to be ReactNode.
      // This is done because slots change the children before passing it to
      // the initialized as element.
      _TAsProps[K] extends React.ReactNode
      ? _TAsProps[K] | ((props: TProps) => _TAsProps[K])
      : never
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
    // but the extra props that's specified in parent component's slot type is required to provide
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
      : "Custom error: Props of `SlotComponent<:Props:>` must extend props of `TemplateComponent<:Name:, :Props:>` when used for `as` prop",
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
  | { "slot-name"?: any }
  ? {
      [P in Exclude<
        keyof T,
        "children" | "as" | "key" | "ref" | "slot-name"
      >]: T[P];
    }
  : T;

type DistributiveKeyOf<T extends {}> = T extends unknown ? keyof T : never;

export type Slot<
  TName extends string | undefined | object = undefined,
  TProps extends object = {},
> = {
  value: 0 extends TName & 1
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
};

type MergeDuplicateSlots<
  U extends SlotTuple<string, any>,
  _U extends SlotTuple<string, any> = U,
> = U extends unknown ? SlotTuple<U[0], Extract<_U, [U[0], any]>[1]> : never;

// Moving recursion outside helps display SlotChildren<...> consistently as SlottableNode<..., ...> on hover.
// Sometimes this shows up in the type declaration on hover, hence why the ambiguous name
// FIXME: Something used to break if Iterable was used instead of an array but can't remember what, although
// using iterable makes it so that ReactNode is assignable to SlotChildren<Slot>
type Children<T extends SlottableNode<string, any>> = T | Iterable<Children<T>>;

type UnwrapValue<T extends Slot<string, any>> = T["value"];

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
  | SlotTupleToSlottableNode<MergeDuplicateSlots<UnwrapValue<AnyCase<TSlot>>>>
  | Children<
      SlotTupleToSlottableNode<MergeDuplicateSlots<UnwrapValue<AnyCase<TSlot>>>>
    >;

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
 */
export type CreateTemplate<T extends SlotChildren> = Pretty<
  UnionToIntersection<
    GetTemplateUnions<Exclude<0 extends T & 1 ? SlotChildren : T, undefined>>
  >
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

type CreateSlotComponent<T extends SlotChildren> = {} & Pretty<
  UnionToIntersection<
    GetSlotComponentUnions<0 extends T & 1 ? SlotChildren : T>
  >
>;

export type CreateSlot<T extends SlotChildren> = CreateSlotComponent<T>;

// -------------------- //

export type HasSlot<T extends SlotChildren> = Pretty<{
  [Name in Extract<
    T,
    React.ReactElement<{ "slot-name": string }>
  >["props"]["slot-name"]]: true | undefined;
}>;

// -------------------- //
