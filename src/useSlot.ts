import { Slot, SlotChildren } from "./types";

export function useSlot<T extends SlotChildren<Slot<any>>>(children: T) {
  const defaultSlots = [];
  const namedSlots =
}

// type T = SlotChildren<Slot<any>>
