import * as React from "react";

type Props = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export default function Button({
  children,
  variant = "primary",
  onClick,
}: Props) {
  return (
    <button
      className={`button ${
        variant === "primary" ? "button--primary" : "button--secondary"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
