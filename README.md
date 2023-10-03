# @beqa/react-slots - Responsible React Parenting

The docs are work in progress.

## Quick look

```tsx
// DialogTrigger.tsx (Reusable DialogTrigger component)

export type DialogTriggerProps = {
	children: SlotChildren<
		// Content labelled as 'trigger.'
		// Shorthand for Slot<'trigger', {}>
		| Slot<"trigger">
		// Unlabelled content or content labelled as 'default,' with props
		// Shorthand for Slot<'default', { isOpen: boolean; close: () => void }>
		| Slot<{ isOpen: boolean; close: () => void }>
	>;
};

export function DialogTrigger({ children }: DialogTriggerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { slot } = useSlot(children); // The magic

	return (
		<div>
			<button onClick={() => setIsOpen(true)}>
				{/* 'Trigger it' is a fallback if the parent doesn't provide trigger content */}
				<slot.trigger>Trigger it</slot.trigger>
			</button>
			{isOpen && (
				// Element props are passed up to the parent
				<slot.default isOpen={isOpen} close={() => setIsOpen(false)} />
			)}
		</div>
	);
}

// Create type-safe template for dialogTrigger by inferring DialogTrigger slots
export const dialogTriggerTemplate =
	createTemplate<DialogTriggerProps["children"]>();
```

```tsx
// Dialog.tsx (Reusable Dialog component)

export type DialogProps = {
	children: SlotChildren<
		// Our header element. Shorthand for Slot<'default', {}>
		| Slot
		| Slot<"description", { style: object }>
		// Since neither slot has props, we can combine type declaration for less keystrokes.
		// Shorthand for Slot<Slot<'primaryAction'> | Slot<'secondaryAction'>
		| Slot<"primaryAction" | "secondaryAction">
	>;
};

export function Dialog({ children }: DialogProps) {
	const { slot, hasSlot } = useSlot(children);

	return (
		<dialog open>
			<slot.default />
			{/* Only render horizontal line under header if header is provided */}
			{hasSlot && <hr />}
			<slot.description style={{ position: "center" }} />
			<div className="actions">
				<slot.secondaryAction />
				<slot.primaryAction />
			</div>
		</dialog>
	);
}

export const dialogTemplate = createTemplate<DialogProps["children"]>();
```

```tsx
// App.tsx Consumer

function App() {
	return (
		<DialogTrigger>
			{/* `dialogTriggerTemplate` is type-safe way to provide labelled content to slots.
					It's children will be rendered in place of the slots. 
					Children can also be a function that returns a react node; when provided 
					it receives the props passed by the child component. */}
			<dialogTriggerTemplate.trigger>Delete</dialogTriggerTemplate.trigger>
			{/* Shorthand for <template.default>{({close}) => ...}</template.default>
					Since it's `default`  we don't have to wrap it with a template and it's still type-safe */}
			{({ close }) => (
				<Dialog>
					Are you sure you want to delete this item?
					{/* You don't have to use type-safe template if you don't want to */}
					<template.description>
						{({ style }) => <p style={style}>This action can't be reversed</p>}
					</template.description>
					{/* For simple elements you can also provide label with `slot-name` but it's not type-safe */}
					<button slot-name="primaryAction" onClick={close}>
						I understand
					</button>
				</Dialog>
			)}
		</DialogTrigger>
	);
}
```

## Install the Runtime Library

```bash
npm i @beqa/react-slots
```

## Install the Compile Time Plugin (Optional)

The compile time plugin is required to transform slot elements returned by useSlot into function invocations as shown below:

```tsx
// Before transpilation
<slot.default prop1={"foo"} prop2={42}>
	Fallback
</slot.default>;
// After transpilation
slot.default("Fallback", { prop1: "foo", prop2: 42 });
```

You have the option to skip installing the compile time plugin and start using slots as functions immediately.

If your project uses Vite, Rollup, or esbuild, you can install `@beqa/unplugin-transform-react-slots` and follow the configuration steps for your bundler. For other bundlers or if you are using Babel in your project, you should install `@beqa/babel-plugin-transform-react-slots`. Note that you don't need to install both plugins.

<details>
  <summary><strong>Babel Plugin</strong></summary>

```bash
npm i @beqa/babel-plugin-transform-react-slots
```

Add react-slots plugin to your babel config

```js
  // babel.config.json
  {
    "plugins": {"@beqa/babel-plugin-transform-react-slots"}
  }
```

</details>

<details>
  <summary><strong>Vite Integration</strong></summary>

```bash
npm i @beqa/unplugin-transform-react-slots
```

Add the `unplugin.vite` to your Vite configuration (vite.config.js) before the react plugin:

```js
// vite.config.js
import unplugin from "@beqa/unplugin-transform-react-slots";
import react from "@vitejs/plugin-react";

export default {
	plugins: [unplugin.vite(), react()],
};
```

</details>

<details>
  <summary><strong>Esbuild Integration</strong></summary>

```bash
npm i @beqa/unplugin-transform-react-slots
```

Add `unplugin.esbuild` to your plugins list in your esbuild config

```js
import unplugin from "@beqa/unplugin-transform-react-slots";

// esbuild.config.js
await build({
	plugins: [unplugin.esbuild()],
});
```

</details>

<details>
  <summary><strong>Rollup Integration</strong></summary>

```bash
npm i @beqa/unplugin-transform-react-slots
```

Add the `unplugin.rollup` to your plugins list before all other plugins in your Rollup configuration (rollup.config.js):

```js
import unplugin from "@beqa/unplugin-transform-react-slots";

// esbuild.config.js
await build({
	plugins: [unplugin.rollup()],
});
```

</details>

### Performance Optimization with Unplugin Options

```tsx
type Options = {
	include: RegEx;
	exclude: RegEx | RegEx[];
};

const options = {
	include: /\.(tsx)|(jsx)|(js)/,
} satisfies Options;

unplugin.yourBundler();
```

`unplugin-transform-react-slots` is designed to be fast at finding and transforming React slots. By default, it checks every JavaScript (js), JSX (jsx), and TypeScript (tsx) file in your project, excluding files in the node_modules directory. However, you can optimize its performance further by using specific options.

**include Option**

If you have other tools configured in a way that JSX syntax is only used in certain files, you can provide the include regular expression (RegEx) as an argument to your plugin. For instance:

```tsx
unplugin.yourBundler({ include: /\.(tsx)|(jsx)/ });
```

With this configuration, the plugin will only check .tsx and .jsx files in your project, improving performance by skipping unnecessary files.

**exclude Option**

Additionally, you can use the exclude option to exclude specific files or directories from being processed. This can be useful for excluding configuration files or large files that don't need slot transformation:

## Troubleshooting

`` Unsupported syntax: `useSlot` or an object holding a nested `useSlot` value used inside ...  ``

If you encounter this error message after initializing the compile-time plugin for your project, it likely indicates that the plugin is applied after React elements have already been transpiled. To resolve this issue, you should adjust your configuration to ensure that the plugin runs before other syntax transformations.

This error occurs when useSlot or the return value of useSlot is used in a way that could potentially mutate slots before they are used. It's important to note that this is a specific error related to the compile-time plugin.

If you wish to disable the transformation for a specific file where this error occurs, you can add the following comment at the beginning of the file:

```js
// @disable-transform-react-slots
```

After adding this comment, you should only use the function signature of slots in that file.
