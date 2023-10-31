/* eslint-disable import/export */
import { cleanup, render } from "@testing-library/react";
import * as React from "react";
import { afterEach } from "vitest";
import {
  template,
  useSlot,
  OverrideNode,
  type CreateTemplate,
  type Slot,
  type SlotChildren,
} from "../src";

afterEach(() => {
  cleanup();
});

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
      </DefaultSlotTest>,
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
      </DefaultSlotTest>,
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
      </DefaultSlotTest>,
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
    </HasSlotTest>,
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
    </HasSlotTest>,
  );
  expect(asFragment()).toMatchInlineSnapshot(`
		<DocumentFragment>
		  true
		</DocumentFragment>
	`);

  rerender(
    <HasSlotTest>
      <hasSlotTestTemplate.default>Should count</hasSlotTestTemplate.default>
    </HasSlotTest>,
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
      </TemplateComponentTest>,
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
      </TemplateComponentTest>,
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
      </TemplateComponentTest>,
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
      </TemplateComponentTest>,
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
      </TemplateComponentTest>,
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
      </TemplateComponentTest>,
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

    render(
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
      </Test>,
    );
  });

  test("renders an element with a key if specified", () => {
    type Props = {
      children?: SlotChildren<Slot | Slot<"named">>;
    };
    function SlotTest({ children }: Props) {
      const { slot } = useSlot(children);

      const defaultElement = slot.default();
      expect(defaultElement?.props.children[0].key).toBe(".$1");

      const namedElement = slot.named();
      expect(namedElement?.props.children[0].key).toBe(".$2");

      return defaultElement;
    }

    render(
      <SlotTest>
        <template.default key={1}></template.default>
        <template.named key={2} as="div"></template.named>
      </SlotTest>,
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
      </SlotTest>,
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
      </SlotTest>,
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
      <SlotTest>{({ prop }) => <div>{prop}</div>}</SlotTest>,
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
            1,
          )}
        </div>
        <div id="child-div-1">{slot.named(<>child's default content</>)}</div>
      </>
    );
  }

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
      </TemplateAsSlotTest>,
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
    render(
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
      </TemplateAsSlotTest>,
    );
  });
  test("renders child slot's default content when no children is provided", () => {
    const { asFragment } = render(
      // testing the named slot only
      <TemplateAsSlotTest>
        <template.default></template.default>
      </TemplateAsSlotTest>,
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
      </TemplateAsSlotTest>,
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
      expect(element?.props.children[0].key).toBe(".$2");
      expect(element?.props.children[0].props.children[0].key).toBe(".$3");
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
      </KeyTest>,
    );
  });
});

describe("OverrideNode", () => {
  test("is ignored when it has no props", () => {
    function Parent({ children }: any) {
      const { slot } = useSlot(children);

      return (
        <div>
          <Child>
            <template.name as={slot.default}>
              <OverrideNode />
            </template.name>
          </Child>
        </div>
      );
    }

    function Child({ children }: any) {
      const { slot } = useSlot(children);

      return (
        <div>{slot.name(<OverrideNode>fallback content</OverrideNode>)}</div>
      );
    }

    const { asFragment: asFragment1 } = render(
      <Child>
        <div slot-name="name" />
      </Child>,
    );

    const { asFragment: asFragment2 } = render(<Child></Child>);

    const { asFragment: asFragment3 } = render(<Parent>content</Parent>);

    const { asFragment: asFragment4 } = render(<Parent></Parent>);

    expect(asFragment1()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div>
          <div />
        </div>
      </DocumentFragment>
    `);

    expect(asFragment2()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div>
          fallback content
        </div>
      </DocumentFragment>
    `);

    expect(asFragment3()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div>
          <div>
            content
          </div>
        </div>
      </DocumentFragment>
    `);

    expect(asFragment4()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div>
          <div>
            fallback content
          </div>
        </div>
      </DocumentFragment>
    `);
  });

  test("enforces node type", () => {
    {
      function Child({ children }: any) {
        const { slot } = useSlot(children);

        return (
          <div>
            {slot.name(
              <OverrideNode allowedNodes={["button"]}>
                <span />
              </OverrideNode>,
            )}
          </div>
        );
      }

      expect(() => render(<Child></Child>)).toThrow();
      expect(() =>
        render(
          <Child>
            <button slot-name="name"></button>
          </Child>,
        ),
      ).not.toThrow();
      expect(() => render(<Child slot-name="name">string</Child>)).toThrow();
    }

    {
      function Child({ children }: any) {
        const { slot } = useSlot(children);

        return (
          <div>
            {slot.default(
              <OverrideNode allowedNodes={[String, Number]} enforce="remove">
                fallback content
              </OverrideNode>,
            )}
          </div>
        );
      }
      const { asFragment } = render(
        <Child>
          <button>removed</button> This is kept <span>removed</span> {42} {true}
        </Child>,
      );

      expect(asFragment()).toMatchInlineSnapshot(`
        <DocumentFragment>
          <div>
             This is kept  42 
          </div>
        </DocumentFragment>
      `);
    }

    {
      function Child({ children }: any) {
        const { slot } = useSlot(children);

        return (
          <div>
            {slot.default(
              <OverrideNode allowedNodes={[String, Number]} enforce="ignore">
                <div />
              </OverrideNode>,
            )}
          </div>
        );
      }
      const { asFragment } = render(
        <Child>
          <span />
        </Child>,
      );

      expect(asFragment()).toMatchInlineSnapshot(`
        <DocumentFragment>
          <div>
            <span />
          </div>
        </DocumentFragment>
      `);

      const { asFragment: asFragment2 } = render(<Child></Child>);

      expect(asFragment2()).toMatchInlineSnapshot(`
        <DocumentFragment>
          <div>
            <div />
          </div>
        </DocumentFragment>
      `);
    }
  });

  test("overrides node when the node prop is specified, and content matches allowedNodes", () => {
    function Child({ children }: any) {
      const { slot } = useSlot(children);

      return (
        <>
          {slot.default(
            <OverrideNode
              enforce="ignore"
              allowedNodes={["button", String]}
              node={(node) => {
                return <div>{node}</div>;
              }}
            />,
          )}
        </>
      );
    }

    const { asFragment } = render(
      <Child>
        <template.default>
          <button />
        </template.default>
        foo
        <span>ignored</span>
        {42}
      </Child>,
    );

    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div>
          <button />
        </div>
        <div>
          foo
        </div>
        <span>
          ignored
        </span>
        42
      </DocumentFragment>
    `);
  });

  test("overrides all nodes when the node prop is specified and allowedNodes is not", () => {
    function Child({ children }: any) {
      const { slot } = useSlot(children);

      return (
        <>
          {slot.default(
            <OverrideNode
              enforce="ignore"
              node={(node) => {
                return <div>{node}</div>;
              }}
            />,
          )}
        </>
      );
    }

    const { asFragment } = render(
      <Child>
        <template.default>
          <button />
        </template.default>
        foo
        <span>included</span>
        {42}
      </Child>,
    );

    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div>
          <button />
        </div>
        <div>
          foo
        </div>
        <div>
          <span>
            included
          </span>
        </div>
        <div>
          42
        </div>
      </DocumentFragment>
    `);
  });

  test("node function is called only for nodes that get rendered", () => {
    function Child({ children, nodeFn }: any) {
      const { slot } = useSlot(children);

      return (
        <>
          {slot.default(
            <OverrideNode node={nodeFn}>Fallback content</OverrideNode>,
          )}
        </>
      );
    }

    function Parent({ children, childNodeFn, nodeFn }: any) {
      const { slot } = useSlot(children);

      return (
        <Child nodeFn={childNodeFn}>
          <template.default as={slot.default}>
            <OverrideNode node={nodeFn}>Fallback content 2</OverrideNode>
            Fallback content 3
          </template.default>
        </Child>
      );
    }

    render(
      <Child
        nodeFn={(node: React.ReactNode) => {
          expect(node).toBe("Fallback content");
        }}
      ></Child>,
    );

    render(
      <Child
        nodeFn={(node: React.ReactNode) => {
          expect(node).toBe("Content");
        }}
      >
        Content
      </Child>,
    );

    let callCount = 0;
    render(
      <Parent
        nodeFn={(node: any) => {
          expect(node).toBe("Fallback content 2");
          return <span>{node}</span>;
        }}
        childNodeFn={(node: any) => {
          let expectedContent = [
            <span>Fallback content 2</span>,
            "Fallback content 3",
          ];
          expect(node).toEqual(expectedContent[callCount++]);
          return node;
        }}
      ></Parent>,
    );
  });

  test("overrides props for elements specified by allowedNodes, ignores primitives", () => {
    function Child({ children }: any) {
      const { slot } = useSlot(children);

      return (
        <>
          {slot.default(
            <OverrideNode
              allowedNodes={[String, Number, "span"]}
              enforce="ignore"
              props={{
                className: OverrideNode.stringAppend("appended"),
                id: OverrideNode.stringPrepend("prepended"),
              }}
            >
              <span className="base">Fallback</span>
            </OverrideNode>,
          )}
        </>
      );
    }

    {
      const { asFragment } = render(<Child></Child>);

      expect(asFragment()).toMatchInlineSnapshot(`
        <DocumentFragment>
          <span
            class="base appended"
            id="prepended"
          >
            Fallback
          </span>
        </DocumentFragment>
      `);
    }

    {
      const { asFragment } = render(
        <Child>
          <div>content</div>
        </Child>,
      );

      expect(asFragment()).toMatchInlineSnapshot(`
        <DocumentFragment>
          <div>
            content
          </div>
        </DocumentFragment>
      `);
    }
  });

  test("prop functions are only called for nodes that get rendered", () => {
    function Child({ children, propsOverride }: any) {
      const { slot } = useSlot(children);

      return (
        <>
          {slot.default(
            <OverrideNode props={propsOverride}>
              <span className="fallback-1">Fallback 1</span>
            </OverrideNode>,
          )}
        </>
      );
    }

    function Parent({ children, childPropsOverride, propsOverride }: any) {
      const { slot } = useSlot(children);

      return (
        <Child propsOverride={childPropsOverride}>
          <template.default as={slot.default}>
            <OverrideNode props={propsOverride}>
              <div>Fallback 2</div>
            </OverrideNode>
            <section>Fallback 3</section>
          </template.default>
        </Child>
      );
    }

    render(
      <Child
        propsOverride={(props: any) => {
          expect(props).toEqual({
            className: "fallback-1",
            children: "Fallback 1",
          });
        }}
      ></Child>,
    );

    render(
      <Child
        propsOverride={(props: any) => {
          expect(props).toEqual({
            id: "test-id",
          });
        }}
      >
        <div id="test-id"></div>
      </Child>,
    );

    {
      let callCount = 0;
      render(
        <Parent
          propsOverride={(props: any) => {
            expect(props).toEqual({ children: "Fallback 2" });
            return { className: "added-class" };
          }}
          childPropsOverride={(props: any) => {
            let expectedProps = [
              { className: "added-class", children: "Fallback 2" },
              { children: "Fallback 3" },
            ];
            expect(props).toEqual(expectedProps[callCount++]);
          }}
        ></Parent>,
      );
    }

    {
      let callCount = 0;
      render(
        <Parent
          propsOverride={(props: any) => {
            expect(props).toEqual({ children: "Fallback 2" });
            return { className: "added-class" };
          }}
          childPropsOverride={(props: any) => {
            let expectedProps = [
              { className: "added-class", children: "Fallback 2" },
              { children: "Fallback 3" },
            ];
            expect(props).toEqual(expectedProps[callCount++]);
          }}
        ></Parent>,
      );
    }

    {
      render(
        <Parent
          propsOverride={(props: any) => {
            expect(props).toEqual({ children: "Content" });
            return { className: "added-class" };
          }}
          childPropsOverride={(props: any) => {
            let expectedProps = {
              className: "added-class",
              children: "Content",
            };

            expect(props).toEqual(expectedProps);
          }}
        >
          <div>Content</div>
        </Parent>,
      );
    }
  });

  test("prop function's return value is merged to the rest of the props", () => {
    function Child({ children, propsOverride }: any) {
      const { slot } = useSlot(children);

      return (
        <>
          {slot.default(
            <OverrideNode props={propsOverride}>
              <span className="fallback-1">Fallback 1</span>
            </OverrideNode>,
          )}
        </>
      );
    }

    const { asFragment } = render(
      <Child propsOverride={() => ({ id: "added-id" })} />,
    );

    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <span
          class="fallback-1"
          id="added-id"
        >
          Fallback 1
        </span>
      </DocumentFragment>
    `);
  });

  test("can be chained", () => {
    function Child({ children }: any) {
      const { slot } = useSlot(children);

      return slot.default([
        <OverrideNode
          node={(node) => {
            if (React.isValidElement(node)) {
              return React.createElement("span", node.props);
            }
            return node;
          }}
        ></OverrideNode>,
        <OverrideNode
          props={{ className: OverrideNode.stringAppend("child-added") }}
        ></OverrideNode>,
      ]);
    }

    function Parent({ children }: any) {
      const { slot } = useSlot(children);

      return (
        <Child>
          <template.default as={slot.default}>
            <OverrideNode node={(node) => <div>{node}</div>}>
              Parent's default content
            </OverrideNode>
            <OverrideNode props={() => ({ id: "parent-added" })}></OverrideNode>
          </template.default>
        </Child>
      );
    }

    {
      const { asFragment } = render(
        <Child>
          <div>content</div>
        </Child>,
      );
      expect(asFragment()).toMatchInlineSnapshot(`
        <DocumentFragment>
          <span
            class="child-added"
          >
            content
          </span>
        </DocumentFragment>
      `);
    }

    {
      const { asFragment } = render(<Parent></Parent>);
      expect(asFragment()).toMatchInlineSnapshot(`
        <DocumentFragment>
          <span
            class="child-added"
          >
            Parent's default content
          </span>
        </DocumentFragment>
      `);
    }

    {
      const { asFragment } = render(<Parent>Content</Parent>);
      expect(asFragment()).toMatchInlineSnapshot(`
        <DocumentFragment>
          <span
            class="child-added"
            id="parent-added"
          >
            Content
          </span>
        </DocumentFragment>
      `);
    }
  });

  test("maintains key equality of fallback content when reordered", () => {
    function Child({ children, defaultContent }: any) {
      const { slot } = useSlot(children);

      return slot.default(defaultContent);
    }

    const { asFragment, rerender, getByText } = render(
      <Child
        defaultContent={[
          <OverrideNode
            key={1}
            allowedNodes={["div"]}
            node={(node) => {
              return [
                <div id={node.props.id + "-override-1"}>
                  {node.props.children} override 1
                </div>,
                <div id={node.props.id + "-override-2"}>
                  {node.props.children} override 2
                </div>,
              ];
            }}
          >
            {[
              { id: "fallback-1", content: "Fallback 1" },
              { id: "fallback-2", content: "Fallback 2" },
            ].map(({ id, content }) => (
              <div id={id} key={id}>
                {content}
              </div>
            ))}
          </OverrideNode>,
          <OverrideNode key={2} props={{ className: () => "added-class" }}>
            {[
              { id: "fallback-3", content: "Fallback 3" },
              { id: "fallback-4", content: "Fallback 4" },
            ].map(({ id, content }) => (
              <div id={id} key={id}>
                {content}
              </div>
            ))}
          </OverrideNode>,
          <OverrideNode key={3}>
            <div>Fallback 5</div>
          </OverrideNode>,
        ]}
      ></Child>,
    );

    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div
          id="fallback-1-override-1"
        >
          Fallback 1 override 1
        </div>
        <div
          id="fallback-1-override-2"
        >
          Fallback 1 override 2
        </div>
        <div
          id="fallback-2-override-1"
        >
          Fallback 2 override 1
        </div>
        <div
          id="fallback-2-override-2"
        >
          Fallback 2 override 2
        </div>
        <div
          class="added-class"
          id="fallback-3"
        >
          Fallback 3
        </div>
        <div
          class="added-class"
          id="fallback-4"
        >
          Fallback 4
        </div>
        <div>
          Fallback 5
        </div>
      </DocumentFragment>
    `);

    let oneOne = getByText("Fallback 1 override 1");
    let oneTwo = getByText("Fallback 1 override 2");
    let twoOne = getByText("Fallback 2 override 1");
    let twoTwo = getByText("Fallback 2 override 2");
    let three = getByText("Fallback 3");
    let four = getByText("Fallback 4");
    let five = getByText("Fallback 5");

    rerender(
      // OverrideNode's swapped; objects to map swapped; Third Override's key changed
      <Child
        defaultContent={[
          <OverrideNode key={2} props={{ className: () => "added-class" }}>
            {[
              { id: "fallback-4", content: "Fallback 4" },
              { id: "fallback-3", content: "Fallback 3" },
            ].map(({ id, content }) => (
              <div id={id} key={id}>
                {content}
              </div>
            ))}
          </OverrideNode>,
          <OverrideNode
            key={1}
            allowedNodes={["div"]}
            node={(node) => {
              return [
                <div id={node.props.id + "-override-1"}>
                  {node.props.children} override 1
                </div>,
                <div id={node.props.id + "-override-2"}>
                  {node.props.children} override 2
                </div>,
              ];
            }}
          >
            {[
              { id: "fallback-2", content: "Fallback 2" },
              { id: "fallback-1", content: "Fallback 1" },
            ].map(({ id, content }) => (
              <div id={id} key={id}>
                {content}
              </div>
            ))}
          </OverrideNode>,
          <OverrideNode key="different-key">
            <div>Fallback 5</div>
          </OverrideNode>,
        ]}
      ></Child>,
    );

    expect(oneOne).toBe(getByText("Fallback 1 override 1"));
    expect(oneTwo).toBe(getByText("Fallback 1 override 2"));
    expect(twoOne).toBe(getByText("Fallback 2 override 1"));
    expect(twoTwo).toBe(getByText("Fallback 2 override 2"));
    expect(three).toBe(getByText("Fallback 3"));
    expect(four).toBe(getByText("Fallback 4"));
    expect(five).not.toBe(getByText("Fallback 5"));
  });

  test("maintains key equality of provided content when reordered", () => {
    function Child({
      children,
      defaultFallback,
      fooFallback,
      isReversed,
    }: any) {
      const { slot } = useSlot(children);

      return isReversed
        ? [
            slot.foo(fooFallback, null, 2),
            slot.default(defaultFallback, null, 1),
          ]
        : [
            slot.default(defaultFallback, null, 1),
            slot.foo(fooFallback, null, 2),
          ];
    }

    const { asFragment, getByText, rerender } = render(
      <Child
        defaultFallback={
          <OverrideNode
            allowedNodes={["span"]}
            node={(node) => [
              <div key="override-1">{node.props.children} override 1</div>,
              <div key="override-2">{node.props.children} override 2</div>,
            ]}
          />
        }
        fooFallback={
          <OverrideNode
            allowedNodes={["span"]}
            props={{ className: () => "added-class" }}
          />
        }
      >
        <span key={"default-1"}>Default 1</span>
        <span key={"default-2"}>Default 2</span>
        <span key={"foo-1"} slot-name="foo">
          Foo 1
        </span>
        <template.foo key="foo-2">
          <span key="foo-2-1">Foo 2.1</span>
          <span key="foo-2-2">Foo 2.2</span>
        </template.foo>
      </Child>,
    );

    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <div>
          Default 1 override 1
        </div>
        <div>
          Default 1 override 2
        </div>
        <div>
          Default 2 override 1
        </div>
        <div>
          Default 2 override 2
        </div>
        <span
          class="added-class"
        >
          Foo 1
        </span>
        <span
          class="added-class"
        >
          Foo 2.1
        </span>
        <span
          class="added-class"
        >
          Foo 2.2
        </span>
      </DocumentFragment>
    `);

    const default1_1 = getByText("Default 1 override 1");
    const default1_2 = getByText("Default 1 override 2");
    const default2_1 = getByText("Default 2 override 1");
    const default2_2 = getByText("Default 2 override 2");
    const foo1 = getByText("Foo 1");
    const foo2_1 = getByText("Foo 2.1");
    const foo2_2 = getByText("Foo 2.2");

    rerender(
      // Swapped the slot placements;
      // Swapped array items in node override;
      // Swapped content;
      // swapped children of template.foo
      <Child
        isReversed
        defaultFallback={
          <OverrideNode
            allowedNodes={["span"]}
            node={(node) => [
              <div key="override-2">{node.props.children} override 2</div>,
              <div key="override-1">{node.props.children} override 1</div>,
            ]}
          />
        }
        fooFallback={
          <OverrideNode
            allowedNodes={["span"]}
            props={{ className: () => "added-class" }}
          />
        }
      >
        <template.foo key="foo-2">
          <span key="foo-2-2">Foo 2.2</span>
          <span key="foo-2-1">Foo 2.1</span>
        </template.foo>
        <span key={"foo-1"} slot-name="foo">
          Foo 1
        </span>
        <span key={"default-2"}>Default 2</span>
        <span key={"default-1"}>Default 1</span>
      </Child>,
    );

    expect(default1_1).toBe(getByText("Default 1 override 1"));
    expect(default1_2).toBe(getByText("Default 1 override 2"));
    expect(default2_1).toBe(getByText("Default 2 override 1"));
    expect(default2_2).toBe(getByText("Default 2 override 2"));
    expect(foo1).toBe(getByText("Foo 1"));
    expect(foo2_1).toBe(getByText("Foo 2.1"));
    expect(foo2_2).toBe(getByText("Foo 2.2"));
  });
});
