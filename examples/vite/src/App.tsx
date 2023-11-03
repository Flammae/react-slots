import "./App.css";
import { DialogTrigger } from "./components/dialog/DialogTrigger";
import Button from "./components/button/Button";
import Dialog from "./components/dialog/Dialog";
import { Accordion } from "./components/accordion/Accordion";
import { AccordionList } from "./components/accordion/AccordionList";

export default function App() {
  return (
    <div className="demos">
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
    </div>
  );
}
