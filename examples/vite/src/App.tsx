import "./App.css";
import { DialogTrigger } from "./DialogTrigger";
import Button from "./Button";
import Dialog from "./Dialog";

export default function App() {
  return (
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
          close??
        </Button>
        <Button slot-name="primary">Close!</Button>
      </Dialog>
    </DialogTrigger>
  );
}
