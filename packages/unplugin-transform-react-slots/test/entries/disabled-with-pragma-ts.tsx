/** Should not transform slot.default */

// Line comment before pragma is ok

// @disable-transform-react-slots
import * as React from "react";
import { type SlotChildren, type Slot, useSlot } from "@beqa/react-slots";

const { slot } = useSlot("children" as SlotChildren<Slot>);

if ("default" in slot) <slot.default />;
