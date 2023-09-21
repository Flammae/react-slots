import { useSlot } from "@beqa/react-slots";

const { slot } = useSlot("children" as any);

// @ts-ignore unchecked index access config
<slot.default />; // should transform to slot.default();
