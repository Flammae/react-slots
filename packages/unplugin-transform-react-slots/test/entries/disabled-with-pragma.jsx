/** Should not transform slot.default */

// Line comment before pragma is ok

// @disable-transform-react-slots
// @ts-ignore
import * as React from "react";
// @ts-ignore
import { useSlot } from "@beqa/react-slots";

const { slot } = useSlot();

<slot.default />;
