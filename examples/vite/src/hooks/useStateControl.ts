import * as React from "react";

/**
 * Makes it possible for components to be both controlled and uncontrolled:
 * - Derives and maintains one source of truth from value and defaultValue.
 * - calls onChange on value change
 * */
export function useStateControl<T>(
  value: T | undefined,
  defaultValue: T | undefined,
  onChange: ((v: T, ...args: unknown[]) => void) | undefined,
): [T | undefined, (nextValue: T) => void] {
  const isControlled = value !== undefined;

  const [internalState, setInternalState] = React.useState(() =>
    isControlled ? value : defaultValue,
  );

  if (
    !isControlled &&
    internalState === undefined &&
    defaultValue !== undefined
  ) {
    // defaultValue was undefined at first but changed to some value
    setInternalState(defaultValue);
  }

  if (isControlled && value !== internalState) {
    // is controlled and a new value was provided. Sync internal state
    setInternalState(value);
  }

  const isControlledRef = React.useRef(isControlled);
  if (isControlledRef.current !== isControlled) {
    const wasControlled = isControlledRef.current;
    console.error(
      `A component changed from ${
        wasControlled ? "controlled" : "uncontrolled"
      } to ${
        isControlled ? "controlled" : "uncontrolled"
      }. This may lead to unexpected behavior.`,
    );
    isControlledRef.current = isControlled;
  }

  const setState = React.useCallback(
    (value: T) => {
      if (onChange && value !== internalState) {
        onChange(value);
      }

      if (!isControlled) {
        setInternalState(value);
      }
    },
    [internalState, isControlled, onChange],
  );

  return [internalState, setState];
}
