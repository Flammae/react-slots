# @beqa/react-slots - Responsible React Parenting

The docs are work in progress.

## Quick Guide: Using Slots to Create Reusable DialogTrigger and Dialog Components

For a live example, check out this [StackBlitz demo.](https://stackblitz.com/edit/vitejs-vite-pz81vn?file=vite.config.ts,src%2FApp.tsx)

**Creating the DialogTrigger Component**

```tsx
export type DialogTriggerProps = {
  children: SlotChildren<
    | Slot<"trigger"> // Content labeled as 'trigger.'
    | Slot<{ isOpen: boolean; close: () => void }> // Unlabeled content or labeled as 'default,' with props
  >;
};

export function DialogTrigger({ children }: DialogTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { slot } = useSlot(children); // Inferred magic

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>
        {/* Render Trigger here or use 'Trigger it' as fallback if no trigger content provided. */}
        <slot.trigger>Trigger it</slot.trigger>
      </button>
      {isOpen && (
        <slot.default isOpen={isOpen} close={() => setIsOpen(false)} /> // Props are passed up to the parent
      )}
    </div>
  );
}

// Create a type-safe template for DialogTrigger by inferring DialogTrigger slots (optional)
export const dialogTriggerTemplate =
  createTemplate<DialogTriggerProps["children"]>();
```

**Creating the Dialog Component**

```tsx
export type DialogProps = {
  children: SlotChildren<
    | Slot // Our header element. Shorthand for Slot<'default', {}>
    | Slot<"description", { style: object }> // Slot for 'description' with style prop
    | Slot<"primaryAction">
    | Slot<"secondaryAction">
  >;
};

export function Dialog({ children }: DialogProps) {
  const { slot, hasSlot } = useSlot(children);

  return (
    <dialog open>
      {/* Render a horizontal line under the header if a header is provided */}
      {hasSlot && <hr />} <slot.default />
      <slot.description style={{ textAlign: "center" }} />
      <div className="actions">
        <slot.secondaryAction />
        <slot.primaryAction />
      </div>
    </dialog>
  );
}

// Create a type-safe template for the Dialog component (optional)
export const dialogTemplate = createTemplate<DialogProps["children"]>();
```

**Using in Your App**

```tsx
function App() {
  return (
    <DialogTrigger>
      {/* Label the span as "trigger" (not type-safe) */}
      <span slot-name="trigger">Delete</span>
      {({ close }) => (
        // Normally this function would be wrapped in a template element that specifies the 'default' label:
        // <template.default>{({close}) => {...}}</template.default>
        // but since it's the default slot we can simplify it.
        // `close` comes from the dialog's <slot.default close={() => setIsOpen(false)} />
        <Dialog>
          Are you sure you want to delete this item?
          {/* Type-safe template (the <p> element will be rendered in place of slot.description)  */}
          <dialogTemplate.description>
            {({ style }) => <p style={style}>This action can't be reversed</p>}
          </dialogTemplate.description>
          {/* Regular template */}
          <template.primary>
            <button onClick={close}>I understand</button>
          </template.primary>
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

unplugin.yourBundler(options);
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

``Unsupported syntax: `useSlot` or an object holding a nested `useSlot` value used inside ... ``

If you encounter this error message after initializing the compile-time plugin for your project, it likely indicates that the plugin is applied after React elements have already been transpiled. To resolve this issue, you should adjust your configuration to ensure that the plugin runs before other syntax transformations.

This error occurs when useSlot or the return value of useSlot is used in a way that could potentially mutate slots before they are used. It's important to note that this is a specific error related to the compile-time plugin.

If you wish to disable the transformation for a specific file where this error occurs, you can add the following comment at the beginning of the file:

```js
// @disable-transform-react-slots
```

After adding this comment, you should only use the function signature of slots in that file.
