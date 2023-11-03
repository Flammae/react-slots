import {
  CreateTemplate,
  OverrideNode,
  Slot,
  SlotChildren,
  template,
  useSlot,
} from "@beqa/react-slots";
import { useDialogTriggerContext } from "./useDialogTriggerContext";
import Button from "./Button";

type Props = {
  children: SlotChildren<
    Slot<"title"> | Slot<"content"> | Slot<"primary"> | Slot<"secondary">
  >;
  disableAutoClose?: boolean;
};

export default function Dialog(props: Props) {
  const { close, titleId } = useDialogTriggerContext();
  const { slot } = useSlot(props.children);

  // Auto close dialog if uncontrolled after any button click
  const onClickOverride = OverrideNode.chainAfter(() => {
    if (props.disableAutoClose) {
      return;
    }
    close();
  });

  return (
    <div className="dialog">
      <h1 className="dialog__title" id={titleId}>
        <slot.title />
      </h1>

      <div className="dialog__content">
        <slot.content />
      </div>

      <div className="dialog__actions">
        <slot.secondary>
          <OverrideNode
            allowedNodes={[Button]}
            props={{
              onClick: onClickOverride,
              // If variant is not provided on the button, make it secondary
              variant: (prop) => prop || "secondary",
            }}
          />
        </slot.secondary>
        <slot.primary>
          <OverrideNode
            allowedNodes={[Button]}
            props={{
              onClick: onClickOverride,
              // If variant is not provided on the button, make it primary
              variant: (prop) => prop || "primary",
            }}
          />
        </slot.primary>
      </div>
    </div>
  );
}

export const dialogTemplate = template as CreateTemplate<Props["children"]>;
