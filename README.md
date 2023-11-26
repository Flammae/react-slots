# beqa/react-slots - Responsible&nbsp;React&nbsp;Parenting

`react-slots` empowers you to prioritize composability in your component APIs.

## Featuring

- Composability with ease
- Type-safety
- Server Components support
- Not implemented with context
- Intuitive API
- Self-documenting with typescript
- Elegant solution to a11y attributes
- Inversion of control

## Docs

You can find the docs on the
[docs website](https://react-slots-docs.vercel.app/)

## Discord

If you need any assistance, feel free to join our
[Discord server](https://discord.gg/HsjKhJJX)

## Implementing

```tsx
import { useSlot, SlotChildren, Slot } from "@beqa/react-slots";

type ListItemProps = {
  children: SlotChildren<
    | Slot<"title"> // Shorthand of Slot<"title", {}>
    | Slot<"thumbnail"> // Shorthand of Slot<"thumbnail", {}>
    | Slot<{ isExpanded: boolean }> // Shorthand of Slot<"default", {isExpanded: boolean}>
  >;
};

function ListItem({ children }: ListItemProps) {
  const { slot } = useSlot(children);
  const [isExpanded, setIsExpanded] = useState();

  return (
    <li
      className={`${isExpanded ? "expanded" : "collapsed"}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Render thumbnail if provided, otherwise nothing*/}
      <slot.thumbnail />
      <div>
        {/* Render a fallback if title is not provided*/}
        <slot.title>Expand for more</slot.title>
        {/* Render the description and pass the prop up to the parent */}
        <slot.default isExpanded={isExpanded} />
      </div>
    </li>
  );
}
```

## Specifying Slot Content From the Parent

With `slot-name` attribute

```jsx
<ListItem>
  <img slot-name="thumbnail" src="..." />
  <div slot-name="title">A title</div>
  this is a description
</ListItem>
```

With Templates

```jsx
import { template } from "beqa/react-slots";

<ListItem>
  <template.thumbnail>
    <img src=".." />
  </template.thumbnail>
  <template.title>A title</template.title>
  <template.description>
    {({ isExpanded }) =>
      isExpanded ? <strong>A description</strong> : "A description"
    }
  </template.description>
  <template.description>doesn't have to be a function</template.description>
</ListItem>;
```

With type-safe templates

```tsx
// Option #1
import { createTemplate } from "@beqa/react-slots";
const template = createTemplate<ListItemProps["children"]>();

// Option #2
import { template, CreateTemplate } from "@beqa/react-slots";
const template = template as CreateTemplate<ListItemProps["children"]>;

// Typo-free and auto-complete for props!
<ListItem>
  <template.thumbnail>
    <img src="..." />
  </template.thumbnail>
  <template.title>A title</template.title>
  <template.description>
    {({ isExpanded }) =>
      isExpanded ? <strong>A description</strong> : "A description"
    }
  </template.description>
  <template.description>doesn't have to be a function</template.description>
</ListItem>;
```

## Advanced Examples

| The code samples below represent actual implementations. No need to define external state or event handlers for these components to function. |
| --------------------------------------------------------------------------------------------------------------------------------------------- |

### Creating highly composable `Accordion` and `AccordionList` components using react-slots

Checkout
[live example](https://stackblitz.com/edit/stackblitz-starters-tq32ef?file=pages%2Findex.tsx)

```jsx
<AccordionList>
  <Accordion key={1}>
    <span slot-name="summary">First Accordion</span>
    This part of Accordion is hidden
  </Accordion>
  <Accordion key={2}>
    <span slot-name="summary">Second Accordion</span>
    AccordionList makes it so that only one Accordion is open at a time
  </Accordion>
  <Accordion key={3}>
    <span slot-name="summary">Third Accordion</span>
    No external state required
  </Accordion>
</AccordionList>
```

### Creating highly composable `Dialog` and `DialogTrigger` components using react-slots

Checkout
[live example](https://stackblitz.com/edit/stackblitz-starters-fa5wbe?file=pages%2Findex.tsx)

```jsx
<DialogTrigger>
  <Button>Trigger Dialog</Button>
  <Dialog slot-name="dialog">
    <span slot-name="title">Look Ma, No External State</span>
    <p slot-name="content">... And no event handlers.</p>
    <p slot-name="content">Closes automatically on button click.</p>
    <p slot-name="content">Can work with external state if desired.</p>
    <Button
      slot-name="secondary"
      onClick={() => alert("But how are the button variants different?")}
    >
      Close??
    </Button>
    <Button slot-name="primary">Close!</Button>
  </Dialog>
</DialogTrigger>
```

If you like this project please show support by starring it on
[Github](https://github.com/Flammae/react-slots)
