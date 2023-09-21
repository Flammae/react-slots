// Checks that transformation is not done when useSlot is not imported
import * as React from "react";

function useSlot() {
	return {
		slot: {
			default: function () {
				return <div />;
			},
		},
	};
}

const { slot } = useSlot();

<slot.default />;
