import * as React from "react";
import { useSlot } from "@beqa/react-slots";

const { slot } = useSlot();

<slot.default />; // should transform to slot.default();
