// @ts-nocheck

import _defaultExport, { useSlot, _anythingElse } from "@beqa/react-slots";
import * as ReactSlots from "@beqa/react-slots";
import { useSlot as useSlotAlias } from "@beqa/react-slots";

let a = useSlotAlias;
const b = ReactSlots;
let c = (b as SomeType).useSlot;
const d = ReactSlots.useSlot;
let {
	slot: { ...e },
}: any = b.useSlot() as SomeType; // <e /> but won't transform because it's lower case

// Transformation can be done in any scope
if (true) {
	a(); // Ignore, not using returned value
	let e: any = (b satisfies any).useSlot() as any; // <e.slot.anything />
	const { f }: SomeAnnotation = c<SomeTemplateArg>(); // Ignore, f is not a slot
	let { slot, g } = d<SomeTypeArg>() as unknown as SomeType; // <slot.anything />
	const { slot: h } = useSlot(); // <h.anything />
	let {
		slot: { i: SlotName },
	} = useSlot(); // <SlotName />
	const { ...j } = e; // <j.slot.anything />;
	let { k: Anything, ...l } = ReactSlots.useSlot().slot; // <Anything /> <l.anythingElse />

	l as any; // Ignore, expression statement

	e.slot.anything(); // Ignore, not a jsx element
	<slot.anything<TypeArg> />; // MUST TRANSFORM
	<h.anything<TypeArg>>children</h.anything>; // MUST TRANSFORM
	<SlotName prop1={1} prop2="string" prop3></SlotName>; // MUST TRANSFORM
	<div>
		{/* MUST TRANSFORM */}
		<j.slot.anything />
	</div>;
	<div
		prop1={
			// MUST TRANSFORM BOTH
			<Anything prop1={1} prop2="string" prop3>
				<l.anythingElse<TypeArg> prop1={1} prop2="string" prop3 />
			</Anything>
		}
	/>;
}

<e />; // won't transform because it's a lowercase name and jsx won't treat it as a variable name.
<h.anything />; // won't transform because h is defined in a different scope

d; // Nothing to see here

let f = c();
<f.some_otherProperty />; // won't transform because not accessing slot property on c();

function _functionName() {
	let f: SomeTypeWithArgs<TypeArg> =
		c satisfies any satisfies unknown as SomeTypeWithArgs<TypeArg>;
	let {
		slot: { ...g },
	} = f(); // <g.anything />

	return <g.anything></g.anything>; // MUST TRANSFORM
}
