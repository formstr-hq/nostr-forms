import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import AppProviders from "./i18n/AppProviders";
import { initI18n } from "./i18n";

const renderApp = async () => {
  await initI18n();

  const root = ReactDOM.createRoot(document.getElementById("root"));

  root.render(
    <React.StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </React.StrictMode>
  );
};

void renderApp();
