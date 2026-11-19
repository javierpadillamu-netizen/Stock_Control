import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { UpdateBanner } from "./components/UpdateBanner";
import { updateOnStart } from "./update";
import "./styles.css";

// Al abrir la app, si hay una version nueva publicada se recarga sola
updateOnStart();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UpdateBanner />
    <App />
  </StrictMode>,
);
