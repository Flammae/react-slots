import _defaultExport, { useSlot, _anythingElse } from "@beqa/react-slots";
import * as ReactSlots from "@beqa/react-slots";
import { useSlot as useSlotAlias } from "@beqa/react-slots";
let a = useSlotAlias;
const b = ReactSlots;
let c = b.useSlot;
const d = ReactSlots.useSlot;
let {
  slot: { ...e },
} = b.useSlot(); // <e /> but won't transform because it's lower case

// Transformation can be done in any scope
if (true) {
  a(); // Ignore, not using returned value
  let e = b.useSlot(); // <e.slot.anything />
  const { f } = c(); // Ignore, f is not a slot
  let { slot, g } = d(); // <slot.anything />
  const { slot: h } = useSlot(); // <h.anything />
  let {
    slot: { i: SlotName },
  } = useSlot(); // <SlotName />
  const { ...j } = e; // <j.slot.anything />;
  let { k: Anything, ...l } = ReactSlots.useSlot().slot; // <Anything /> <l.anythingElse />

  e.slot.anything(); // Ignore, not a jsx element
  slot.anything(<default-content-wrapper />); // MUST TRANSFORM
  h.anything(<default-content-wrapper>children</default-content-wrapper>); // MUST TRANSFORM
  SlotName(<default-content-wrapper />, {
    prop1: 1,
    prop2: "string",
    prop3: true,
  }); // MUST TRANSFORM
  <div>
    {/* MUST TRANSFORM */}
    {j.slot.anything(<default-content-wrapper />)}
  </div>;
  <div
    prop1={
      // MUST TRANSFORM BOTH
      Anything(
        <default-content-wrapper>
          {l.anythingElse(<default-content-wrapper />, {
            prop1: 1,
            prop2: "string",
            prop3: true,
          })}
        </default-content-wrapper>,
        {
          prop1: 1,
          prop2: "string",
          prop3: true,
        }
      )
    }
  />;
}
<e />; // won't transform because it's a lowercase name and jsx won't treat it as a variable name.
<h.anything />; // won't transform because h is defined in a different scope

d; // Nothing to see here

let f = c();
<f.some_otherProperty />; // won't transform because not accessing slot property on c();

function _functionName() {
  let f = c;
  let {
    slot: { ...g },
  } = f(); // <g.anything />

  return g.anything(<default-content-wrapper />); // MUST TRANSFORM
}

// The following syntax does nothing but should not throw;
if (useSlotAlias) {
}
if (useSlotAlias().slot.name) {
}
((useSlotAlias && useSlotAlias().slot) || useSlotAlias().slot.default) ??
  f.slot.default(<default-content-wrapper />); // Must transform