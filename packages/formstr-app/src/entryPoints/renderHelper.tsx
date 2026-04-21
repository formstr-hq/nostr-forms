import ReactDOM from "react-dom/client";
import React from "react";
import { HashRouter } from "react-router-dom";
import { ProfileProvider } from "../provider/ProfileProvider";
import AppProviders from "../providers/AppProviders";
import { initI18n } from "../i18n";

let numTries = 0;

/**
 * this is because the webpack plugin inserts the scripts in head tag. It adds the defer tag but the script
 * is anyways run before html is rendered. So the root element is not found. Waiting 1 cycle for request idle callback
 * makes the browser render the html and then execute the script when its free
 */
const tryAndRender = ({ Component }: { Component: React.FC }) => {
  numTries += 1;
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    return false;
  }
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <AppProviders>
        <HashRouter>
          <ProfileProvider>
            <Component />
          </ProfileProvider>
        </HashRouter>
      </AppProviders>
    </React.StrictMode>,
  );
  return true;
};

export const renderReactComponent = ({
  Component,
}: {
  Component: React.FC;
}) => {
  document.addEventListener("DOMContentLoaded", () => {
    void initI18n().then(() => {
      tryAndRender({ Component });
    });
  });
};
