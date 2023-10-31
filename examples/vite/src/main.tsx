import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import Modal from "react-modal";

Modal.setAppElement(document.getElementById("root")!);
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
