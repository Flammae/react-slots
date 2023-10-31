import * as React from "react";

const defaultValue = {
  close: () => {},
  titleId: "",
};

type Props = typeof defaultValue & { children: React.ReactNode };

export const DialogTriggerContext = React.createContext<
  undefined | typeof defaultValue
>(undefined);

export function DialogTriggerContextProvider({
  close,
  titleId,
  children,
}: Props) {
  const value = React.useMemo(() => ({ close, titleId }), [close, titleId]);

  return (
    <DialogTriggerContext.Provider value={value}>
      {children}
    </DialogTriggerContext.Provider>
  );
}

export function useDialogTriggerContext() {
  const setIsOpen = React.useContext(DialogTriggerContext);

  if (!setIsOpen) {
    throw new Error("useDialogTriggerContext used outside context provider");
  }

  return setIsOpen;
}
