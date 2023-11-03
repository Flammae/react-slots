import { OverrideNode, SlotChildren, useSlot } from "@beqa/react-slots";
import * as React from "react";
import { Accordion } from "./Accordion";
import { useStateControl } from "../../hooks/useStateControl";

type Props = {
  children: SlotChildren;
  defaultIsOpen?: React.Key | null;
  isOpen?: React.Key | null;
  onToggle?: (openKey: React.Key | null) => void;
};

export function AccordionList(props: Props) {
  const { slot } = useSlot(props.children);

  const [openKey, setOpenKey] = useStateControl(
    props.isOpen,
    props.defaultIsOpen,
    props.onToggle,
  );

  return (
    <div className="accordion-list">
      <slot.default>
        <OverrideNode
          allowedNodes={[Accordion]}
          // Override props when it's an Accordion element, when not just skip it.
          // This allows consumers to include arbitrary content in between accordions
          enforce="ignore"
          node={(el) => {
            if (!el.key) {
              console.error(
                "When using AccordionList each Accordion should have a unique key",
              );
            }

            // open selected Accordion
            return React.cloneElement(el, {
              defaultIsOpen: undefined,
              isOpen: !!openKey && el.key === openKey,
              onToggle(nextIsOpen: boolean) {
                console.log("toggle", nextIsOpen);
                setOpenKey(nextIsOpen ? el.key : null);
              },
            });
          }}
        />
      </slot.default>
    </div>
  );
}
