import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { template, useSlot, type SlotChildren } from "../src";

describe("Console warnings with React 19", () => {
  beforeEach(() => {
    // Spy on console methods
    vi.spyOn(console, "warn");
    vi.spyOn(console, "error");
    vi.spyOn(console, "log");
  });

  it("should not log any warnings or errors when using default slots with various children configurations", () => {
    const TestComponent = (props: { children: SlotChildren }) => {
      const { slot } = useSlot(props.children);
      return <div>{slot.default()}</div>;
    };

    // Test single child
    render(
      <TestComponent>
        <div>Test content</div>
      </TestComponent>,
    );

    // Test multiple children
    render(
      <TestComponent>
        <div>Test content 1</div>
        <div>Test content 2</div>
        text node
      </TestComponent>,
    );

    // Test single template
    render(
      <TestComponent>
        <template.default>
          <div>Template content</div>
        </template.default>
      </TestComponent>,
    );

    // Test multiple templates with mixed content
    render(
      <TestComponent>
        <template.default>
          <div>Template 1</div>
          text node
        </template.default>
        <template.default>
          <div>Template 2</div>
        </template.default>
        <template.default>{() => <div>Template 3</div>}</template.default>
        {() => <div>Template 4</div>}
      </TestComponent>,
    );

    // Check that no console methods were called across all renders
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  it("should not log any warnings or errors when using named slots with various configurations", () => {
    // Test component with optional and required named slots
    const TestComponent1 = (props: { children: SlotChildren }) => {
      const { slot, hasSlot } = useSlot(props.children);
      return (
        <div>
          {hasSlot.header && slot.header()}
          {slot.content()}
          {slot.footer?.()}
        </div>
      );
    };

    // Test component with multiple instances of the same named slot
    const TestComponent2 = (props: { children: SlotChildren }) => {
      const { slot } = useSlot(props.children);
      return <div>{slot.foo()}</div>;
    };

    // Test optional and required named slots
    render(
      <TestComponent1>
        <template.header>
          <div>Header</div>
        </template.header>
        <template.content>
          <div>Content</div>
        </template.content>
      </TestComponent1>,
    );

    // Test multiple instances of the same named slot with mixed syntax
    render(
      <TestComponent2>
        <template.foo>
          <div>Foo Template 1</div>
        </template.foo>
        <template.foo>
          <div>Foo Template 2</div>
        </template.foo>
        <div slot-name="foo">Foo Direct</div>
      </TestComponent2>,
    );

    // Check that no console methods were called across all renders
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });
});
