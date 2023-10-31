import * as React from "react";
import { SlotChildren, template, useSlot, type Slot } from "../src";
import {
  COMPONENT_TYPE,
  SLOT_NAME,
  SLOT_TYPE_IDENTIFIER,
  TEMPLATE_TYPE_IDENTIFIER,
} from "../src/constants";
import { CreateSlot, CreateTemplate, SlotComponent } from "../src/types";

test("Slot Type", () => {
  expectTypeOf<Slot>().toEqualTypeOf<{ value: ["default", {}] }>();

  expectTypeOf<Slot<"foo">>().toEqualTypeOf<{ value: ["foo", {}] }>();

  expectTypeOf<Slot<{ foo: boolean }>>().toEqualTypeOf<{
    value: ["default", { foo: boolean }];
  }>();

  expectTypeOf<Slot<{ foo?: boolean }>>().toEqualTypeOf<{
    value: ["default", { foo?: boolean }];
  }>();

  expectTypeOf<Slot<"foo", { foo: boolean }>>().toEqualTypeOf<{
    value: ["foo", { foo: boolean }];
  }>();

  // undefined as the first argument should be the same as omitting the TName
  expectTypeOf<Slot<undefined>>().toEqualTypeOf<Slot>();
  expectTypeOf<Slot<undefined, { foo: string }>>().toEqualTypeOf<
    Slot<{ foo: string }>
  >();

  // TProps can be any
  expectTypeOf<Slot<"foo", any>>().toEqualTypeOf<{ value: ["foo", any] }>();
  expectTypeOf<Slot<string, any>>().toEqualTypeOf<{ value: [string, any] }>();

  // any in the first argument should transform to string
  expectTypeOf<Slot<any>>().toEqualTypeOf<{ value: [string, {}] }>();
  expectTypeOf<Slot<any, any>>().toEqualTypeOf<{ value: [string, any] }>();

  // Distributivity should work on both TName and TProps
  expectTypeOf<
    Slot<"foo" | "bar", { foo: string } | { bar: string }>
  >().toEqualTypeOf<{
    value:
      | ["foo", { foo: string } | { bar: string }]
      | ["bar", { foo: string } | { bar: string }];
  }>();

  // Disallowed props should be omitted
  expectTypeOf<
    Slot<{
      children: any;
      key?: string;
      ref: undefined;
      as?: unknown;
      thisIsOk: any;
    }>
  >().toEqualTypeOf<Slot<{ thisIsOk: any }>>();
  expectTypeOf<
    Slot<
      string,
      {
        children: any;
        key?: string;
        ref: undefined;
        as?: unknown;
        thisIsOk: any;
      }
    >
  >().toEqualTypeOf<Slot<string, { thisIsOk: any }>>();
});

test("SlotChildren", () => {
  type Literals = string | number | boolean | null | undefined;

  type Func<T> = [T] extends [unknown] ? (props: T) => React.ReactNode : never;

  type TypeOrArray<T> = T | TypeOrArray<T>[];

  type TemplateComponentLikeElement<
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

  type TemplateAsSlotComponentLikeElement<
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

  // SlotChildren with any should have sensible defaults
  expectTypeOf<
    TypeOrArray<
      | Literals
      | Func<any>
      | TemplateComponentLikeElement<string, any>
      | TemplateAsSlotComponentLikeElement<string, any>
      | React.ReactElement<{ "slot-name": string }>
    >
  >().toEqualTypeOf<SlotChildren<any>>();
  expectTypeOf<
    TypeOrArray<React.ReactElement<{ noSlotName: any }>>
  >().not.toMatchTypeOf<SlotChildren<any>>();

  // SlotChildren without type arguments should be the same as SlotChildren<any>
  expectTypeOf<SlotChildren<any>>().toEqualTypeOf<SlotChildren>();

  expectTypeOf<
    TypeOrArray<
      | Literals
      | Func<any>
      | TemplateComponentLikeElement<string, any>
      | TemplateAsSlotComponentLikeElement<string, any>
      | React.ReactElement<{ "slot-name": string }>
    >
  >().toEqualTypeOf<SlotChildren<Slot<string, any>>>();

  expectTypeOf<
    TypeOrArray<
      | Literals
      | Func<{}>
      | TemplateComponentLikeElement<"default", {}>
      | TemplateAsSlotComponentLikeElement<"default", {}>
      | React.ReactElement<{ "slot-name": "default" }>
    >
  >().toEqualTypeOf<SlotChildren<Slot>>();

  expectTypeOf<
    TypeOrArray<
      | Literals
      | Func<{ foo: string }>
      | TemplateComponentLikeElement<"default", { foo: string }>
      | TemplateAsSlotComponentLikeElement<"default", { foo: string }>
      | React.ReactElement<{ "slot-name": "default" }>
    >
  >().toEqualTypeOf<SlotChildren<Slot<{ foo: string }>>>();

  expectTypeOf<
    TypeOrArray<
      | TemplateComponentLikeElement<"name", { foo: string }>
      | TemplateAsSlotComponentLikeElement<"name", { foo: string }>
      | React.ReactElement<{ "slot-name": "name" }>
    >
  >().toEqualTypeOf<SlotChildren<Slot<"name", { foo: string }>>>();

  // Distributivity test
  expectTypeOf<
    TypeOrArray<
      | TemplateComponentLikeElement<"name", { foo: string }>
      | TemplateAsSlotComponentLikeElement<"name", { foo: string }>
      | React.ReactElement<{ "slot-name": "name" }>
      | Literals
      | Func<{ bar: string }>
      | TemplateComponentLikeElement<"default", { bar: string }>
      | TemplateAsSlotComponentLikeElement<"default", { bar: string }>
      | React.ReactElement<{ "slot-name": "default" }>
      | TemplateComponentLikeElement<"noProps", {}>
      | TemplateAsSlotComponentLikeElement<"noProps", {}>
      | React.ReactElement<{ "slot-name": "noProps" }>
    >
  >().toEqualTypeOf<
    SlotChildren<
      Slot<"name", { foo: string }> | Slot<{ bar: string }> | Slot<"noProps">
    >
  >();

  // Distributivity through Slot test
  expectTypeOf<
    TypeOrArray<
      | TemplateComponentLikeElement<"name", { bar: string } | { foo: string }>
      | TemplateAsSlotComponentLikeElement<
          "name",
          { bar: string } | { foo: string }
        >
      | React.ReactElement<{ "slot-name": "name" }>
      | Literals
      | Func<{ bar: string } | { foo: string }>
      | TemplateComponentLikeElement<
          "default",
          { bar: string } | { foo: string }
        >
      | TemplateAsSlotComponentLikeElement<
          "default",
          { bar: string } | { foo: string }
        >
      | React.ReactElement<{ "slot-name": "default" }>
    >
  >().toEqualTypeOf<
    SlotChildren<Slot<"name" | "default", { foo: string } | { bar: string }>>
  >();

  // Should merge duplicate names
  expectTypeOf<
    TypeOrArray<
      | TemplateComponentLikeElement<
          "name",
          { foo: string } | { bar: string } | { baz: string }
        >
      | TemplateAsSlotComponentLikeElement<
          "name",
          { foo: string } | { bar: string } | { baz: string }
        >
      | React.ReactElement<{ "slot-name": "name" }>
    >
  >().toEqualTypeOf<
    SlotChildren<
      | Slot<"name", { foo: string }>
      | Slot<"name", { bar: string }>
      | Slot<"name", { baz: string }>
    >
  >();
});

test("Template", () => {
  expectTypeOf<CreateTemplate<any>>().toEqualTypeOf<
    CreateTemplate<SlotChildren>
  >();

  expectTypeOf(template.name[COMPONENT_TYPE]).toEqualTypeOf(
    TEMPLATE_TYPE_IDENTIFIER,
  );
  expectTypeOf(template.name[SLOT_NAME]).toEqualTypeOf<string>();

  // no error
  <template.anyKey />;
  <template.anyKey>No error</template.anyKey>;
  <template.anyKey>{(props: any) => "No error"}</template.anyKey>;
  // @ts-expect-error Extra prop
  <template.anyKey href="/test">{(props: any) => null}</template.anyKey>;
  // @ts-expect-error Type Arg must be the same as in `as` prop
  <template.anyKey<"div"> href="/test" as="a">
    {(props: any) => "No error"}
  </template.anyKey>;
  // no error
  <template.anyKey as="a" href="/test" />;
  // @ts-expect-error All required props must be provided
  <template.anyKey as={(props: { children: any }) => null} />;
  <template.anyKey as={(props: { children: any }) => null}>
    No error
  </template.anyKey>;
  // No error children is optional
  <template.anyKey as={(props: { children?: any }) => null} />;
  // @ts-expect-error `as` element doesn't have children
  <template.anyKey as={(props: { prop: string }) => null}>
    ERROR
  </template.anyKey>;
  // No error
  <template.anyKey as={useSlot("children" as any).slot.anyKey} />;

  // CreateTemplate removes undefined (important when children is optional and doing `CreateTemplate<typeof Props["children"]>)
  const testTemplate = template as CreateTemplate<
    | undefined
    | SlotChildren<
        | Slot
        | Slot<"named", { foo: string }>
        | Slot<"optionalArg", { optionalArg?: string }>
      >
  >;

  // No error
  <testTemplate.default />;
  <testTemplate.named />;
  <testTemplate.optionalArg />;
  // @ts-expect-error Should only access known keys
  <testTemplate.anyKey />;

  <testTemplate.default>No error</testTemplate.default>;
  <testTemplate.default>
    {(props) => {
      expectTypeOf(props).toEqualTypeOf({});
      return "No error";
    }}
  </testTemplate.default>;

  // No error
  <testTemplate.named>No error</testTemplate.named>;
  <testTemplate.named>
    {(props) => {
      expectTypeOf(props).toEqualTypeOf<{ foo: string }>();
      return "No error";
    }}
  </testTemplate.named>;

  // No error
  <testTemplate.optionalArg>
    {(props) => {
      expectTypeOf(props).toEqualTypeOf<{ optionalArg?: string }>();
      return "No error";
    }}
  </testTemplate.optionalArg>;

  // @ts-expect-error Extra prop
  <testTemplate.named href="/test">{(props) => null}</testTemplate.named>;
  // @ts-expect-error Type Arg must be the same as in `as` prop
  <testTemplate.named<"div"> href="/test" as="a">
    {(props: any) => "No error"}
  </testTemplate.named>;
  // no error
  <testTemplate.named as="a" href="/test" />;
  // @ts-expect-error All required props must be provided
  <testTemplate.named as={(props: { children: any }) => null} />;
  <testTemplate.named as={(props: { children: any }) => null}>
    No error
  </testTemplate.named>;
  // No error children is optional
  <testTemplate.named as={(props: { children?: any }) => null} />;
  // @ts-expect-error `as` element doesn't have children
  <testTemplate.named as={(props: { prop: string }) => null}>
    ERROR
  </testTemplate.named>;

  // No error. Slot props is the same as testTemplate props
  <testTemplate.named
    as={
      useSlot<SlotChildren<Slot<{ foo: string }>>>("children" as any).slot
        .default
    }
  ></testTemplate.named>;

  // No error. Slot props extends testTemplate props
  <testTemplate.named
    as={
      useSlot<SlotChildren<Slot<{ foo: string; bar: string }>>>(
        "children" as any,
      ).slot.default
    }
    bar="bar"
  ></testTemplate.named>;

  // @ts-expect-error If template has more required props, the extra props must be specified on the element
  <testTemplate.named
    as={
      useSlot<SlotChildren<Slot<{ foo: string; bar: string }>>>(
        "children" as any,
      ).slot.default
    }
  ></testTemplate.named>;

  // No error, bar is not required
  <testTemplate.named
    as={
      useSlot<SlotChildren<Slot<{ foo: string; bar?: string }>>>(
        "children" as any,
      ).slot.default
    }
    // No error on children
  >
    Children
  </testTemplate.named>;

  // @ts-expect-error Template props doesn't extends slot props
  <testTemplate.named
    as={
      useSlot<SlotChildren<Slot<{ bar?: string }>>>("children" as any).slot
        .default
    }
  ></testTemplate.named>;

  <testTemplate.named
    as={
      useSlot<SlotChildren<Slot<{ foo: string }>>>("children" as any).slot
        .default
    }
    // No error. Template props can be overridden
    foo="string"
  >
    {/* @ts-expect-error 'Slot as template' children cannot be a function */}
    {() => null}
  </testTemplate.named>;

  // No error. {} extends {optionalArg?: string}
  <testTemplate.optionalArg
    as={useSlot<SlotChildren<Slot<{}>>>("children" as any).slot.default}
  ></testTemplate.optionalArg>;
});

test("Slot", () => {
  expectTypeOf<CreateSlot<any>>().toEqualTypeOf<CreateSlot<SlotChildren>>();

  expectTypeOf(
    useSlot<any>("children").slot.anyKey[COMPONENT_TYPE],
  ).toEqualTypeOf(SLOT_TYPE_IDENTIFIER);

  // All the different call signatures on basic slot should all work
  useSlot<any>("children").slot.anyKey();
  useSlot<any>("children").slot.anyKey(null);
  useSlot<any>("children").slot.anyKey(null, {});
  useSlot<any>("children").slot.anyKey(null, {}, 1);
  const AnyKey = useSlot<any>("children").slot.anyKey;
  <AnyKey aProp={42}>children</AnyKey>;

  const slotTest = useSlot<
    SlotChildren<
      | Slot<"named", { prop1: string; prop2?: string }>
      | Slot<{ prop1?: string; prop2?: string }>
    >
  >("children" as any).slot;

  // @ts-expect-error Must provide first two arguments when at least one prop is not optional
  slotTest.named();
  // @ts-expect-error Must provide first two arguments when at least one prop is not optional
  slotTest.named(null);
  // No error. All props are optional
  slotTest.default();
  // @ts-expect-error Extra prop provided
  slotTest.named(null, { prop1: "foo", prop2: "bar", prop3: "string" });

  // @ts-expect-error Must provide all required props
  <slotTest.named prop2="foo" />;

  // No error. Accepts children
  <slotTest.default>children</slotTest.default>;
});
