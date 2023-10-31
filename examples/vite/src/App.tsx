import "./App.css";
import { DialogTrigger } from "./components/dialog/DialogTrigger";
import Button from "./components/button/Button";
import Dialog from "./components/dialog/Dialog";

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
          Close??
        </Button>
        <Button slot-name="primary">Close!</Button>
      </Dialog>
    </DialogTrigger>
  );
}
