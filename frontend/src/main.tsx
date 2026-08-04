import { StrictMode } from "react";
import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";

import QueryProvider from "@/state/tanstackQuery/QueryProvider";
import LocaleProvider from "@/components/LocaleProvider";
import App from "@/App";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocaleProvider>
      <QueryProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryProvider>
    </LocaleProvider>
  </StrictMode>,
);
