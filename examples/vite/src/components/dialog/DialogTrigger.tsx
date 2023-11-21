import {
  Slot,
  SlotChildren,
  useSlot,
  OverrideNode,
  template,
  CreateTemplate,
} from "@beqa/react-slots";
import Modal from "react-modal";
import { useStateControl } from "../../hooks/useStateControl";
import { DialogTriggerContextProvider } from "./DialogTriggerContent";
import Button from "../button/Button";
import { useCallback } from "react";

const DIALOG_TITLE_ID = "dialog-title";

type Props = {
  children: SlotChildren<
    Slot | Slot<"dialog", { close: () => void; titleId: string }>
  >;
  onToggle?: (nextIsOpen: boolean) => void;
  // Supports both controlled and uncontrolled variants (similar to value and defaultValue props on <input />)
  isOpen?: boolean;
  defaultIsOpen?: boolean;
};

export function DialogTrigger(props: Props) {
  const { slot } = useSlot(props.children);

  const [isOpen, setIsOpen] = useStateControl(
    props.isOpen,
    props.defaultIsOpen,
    props.onToggle,
  );

  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <>
      <slot.default>
        <OverrideNode allowedNodes={[Button]} enforce="throw" />
        <OverrideNode
          allowedNodes={[Button]}
          enforce="throw"
          props={{
            onClick: OverrideNode.chainAfter(() => {
              setIsOpen(!isOpen);
            }),
          }}
        >
          <Button>Trigger It!</Button>
        </OverrideNode>
      </slot.default>
      {/* Wrap whatever element consumer provides for the dialog slot in a context so it can use setIsOpen inside */}
      <DialogTriggerContextProvider close={close} titleId={DIALOG_TITLE_ID}>
        <Modal isOpen={!!isOpen} onRequestClose={close}>
          {/* Passing these props up isn't necessary if consumer only uses Dialog for this slot, but if they decide to provide something custom instead, it could come in handy */}
          <slot.dialog
            titleId={DIALOG_TITLE_ID}
            close={() => setIsOpen(false)}
          />
        </Modal>
      </DialogTriggerContextProvider>
    </>
  );
}

export const dialogTriggerTemplate = template as CreateTemplate<
  Props["children"]
>;
