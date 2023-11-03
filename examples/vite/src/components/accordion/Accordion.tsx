import { Slot, SlotChildren, useSlot } from "@beqa/react-slots";
import * as React from "react";
import Button from "../button/Button";
import { useStateControl } from "../../hooks/useStateControl";

type Props = {
  children?: SlotChildren<Slot<"summary"> | Slot>;
  onToggle?: (nextIsOpen: boolean) => void;
  isOpen?: boolean;
  defaultIsOpen?: boolean;
};

export function Accordion(props: Props) {
  const { slot } = useSlot(props.children);

  // Support both controlled and uncontrolled state
  const [isOpen, setIsOpen] = useStateControl(
    props.isOpen,
    props.defaultIsOpen,
    props.onToggle,
  );

  const panelId = React.useId();
  const buttonId = React.useId();

  return (
    <div className={`accordion accordion--${isOpen ? "open" : "closed"}`}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="secondary"
        className={"accordion__summary"}
        id={buttonId}
        aria-expanded={isOpen ? "true" : "false"}
        aria-controls={panelId}
      >
        <slot.summary>Details</slot.summary>
        <span className="accordion__icon" slot-name="right" aria-hidden="true">
          &#8249;
        </span>
      </Button>
      <section
        className="accordion__details"
        id={panelId}
        aria-labelledby={buttonId}
      >
        {isOpen && <slot.default />}
      </section>
    </div>
  );
}
