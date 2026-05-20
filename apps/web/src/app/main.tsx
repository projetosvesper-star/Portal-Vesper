import React from "react";
import ReactDOM from "react-dom/client";

import { AppProviders } from "./providers";
import { AppRouter } from "./router";
import { initializeRuntimeConfig } from "../shared/config/runtimeConfig";
import "../shared/styles/globals.css";

async function bootstrap() {
  await initializeRuntimeConfig();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </React.StrictMode>,
  );
}

bootstrap();
