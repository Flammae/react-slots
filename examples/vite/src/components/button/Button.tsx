import { Slot, SlotChildren, useSlot } from "@beqa/react-slots";
import * as React from "react";

type HTMLButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

type Props = Omit<HTMLButtonProps, "children"> & {
  children: SlotChildren<Slot<"left"> | Slot | Slot<"right">>;
  variant?: "primary" | "secondary";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
};

export default function Button({
  children,
  variant = "primary",
  onClick,
  className,
  ...rest
}: Props) {
  const { slot, hasSlot } = useSlot(children);
  return (
    <button
      className={[className, "button", `button--${variant}`]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      {...rest}
    >
      {hasSlot.left && (
        <span className="button__left">
          <slot.left />
        </span>
      )}
      <slot.default />
      {hasSlot.right && (
        <span className="button__right">
          <slot.right />
        </span>
      )}
    </button>
  );
}
