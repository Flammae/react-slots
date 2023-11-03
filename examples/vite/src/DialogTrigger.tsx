import "./App.css";
import {
  Slot,
  SlotChildren,
  useSlot,
  OverrideNode,
  template,
  CreateTemplate,
} from "@beqa/react-slots";
import Modal from "react-modal";
import { useStateControl } from "./useStateControl";
import { DialogTriggerContextProvider } from "./useDialogTriggerContext";
import Button from "./Button";
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
        {/*
         If provided element is Button -> add onClick prop;
         If DialogTrigger -> add onToggle;
         If no content provided -> render button 'Trigger it' as a fallback;
         Otherwise throw an error;
        */}
        <OverrideNode allowedNodes={[Button, DialogTrigger]} enforce="throw" />
        <OverrideNode
          allowedNodes={[Button]}
          enforce="ignore"
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
