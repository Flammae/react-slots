import { useState } from "react";
import "./App.css";
import {
  createTemplate,
  Slot,
  SlotChildren,
  useSlot,
  template,
} from "@beqa/react-slots";

export type DialogTriggerProps = {
  children: SlotChildren<
    // Content labelled as 'trigger' with no props.
    // Shorthand for Slot<'trigger', {}>
    | Slot<"trigger">
    // Unlabelled content or content labelled as 'default'
    // Shorthand for Slot<'default', { isOpen: boolean; close: () => void }>
    | Slot<{ isOpen: boolean; close: () => void }>
  >;
};

export function DialogTrigger({ children }: DialogTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { slot } = useSlot(children); // The magic

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        {/* 'Trigger it' is a fallback if the parent doesn't provide trigger content */}
        <slot.trigger>Trigger it</slot.trigger>
      </button>
      {isOpen && (
        // Element props are passed up to the parent
        <slot.default isOpen={isOpen} close={() => setIsOpen(false)} />
      )}
    </div>
  );
}

// Create type-safe template for dialogTrigger by inferring DialogTrigger slots
export const dialogTriggerTemplate =
  createTemplate<DialogTriggerProps["children"]>();

export type DialogProps = {
  children: SlotChildren<
    // Our header element. Shorthand for Slot<'default', {}>
    | Slot
    | Slot<"description", { style: object }>
    // Since neither slot has props, we can combine type declaration for less keystrokes.
    // Shorthand for Slot<Slot<'primaryAction'> | Slot<'secondaryAction'>
    | Slot<"primaryAction" | "secondaryAction">
  >;
};

export function Dialog({ children }: DialogProps) {
  const { slot, hasSlot } = useSlot(children);

  return (
    <dialog open>
      <slot.default />
      {/* Only render horizontal line under header if header is provided */}
      {hasSlot && <hr />}
      <slot.description style={{ position: "center" }} />
      <div className="actions">
        <slot.secondaryAction />
        <slot.primaryAction />
      </div>
    </dialog>
  );
}

export const dialogTemplate = createTemplate<DialogProps["children"]>();

function App() {
  return (
    <DialogTrigger>
      {/* `dialogTriggerTemplate` is type-safe way to provide labelled content to slots.
						It's children will be rendered in place of the slots. 
						Children can also be a function that returns a react node; when provided 
						it receives the props passed by the child component.*/}
      <dialogTriggerTemplate.trigger>Delete</dialogTriggerTemplate.trigger>
      {/* Shorthand of <template.default>{({close}) => ...}</template.default>
				 		Since it's the default prop we don't have to wrap it with a template and it's still type-safe */}
      {({ close }) => (
        <Dialog>
          Are you sure you want to delete this item?
          {/* You don't have to use type-safe template if you don't want to */}
          <template.description>
            {({ style }) => <p style={style}>This action can't be reversed</p>}
          </template.description>
          {/* For simple elements you can also provide label with `slot-name` but it's not type-safe */}
          <button slot-name="primaryAction" onClick={close}>
            I understand
          </button>
        </Dialog>
      )}
    </DialogTrigger>
  );
}

export default App;
