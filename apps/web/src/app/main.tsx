import React from "react";
import ReactDOM from "react-dom/client";

import { AppProviders } from "./providers";
import { AppRouter } from "./router";
import "../shared/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>,
);
