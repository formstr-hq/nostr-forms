import ReactDOM from "react-dom/client";
import React from "react";
import { ConfigProvider } from "antd";
import { HashRouter } from "react-router-dom";
import { ProfileProvider } from "../provider/ProfileProvider";

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
      <ConfigProvider
        theme={{
          token: {
            fontFamily: "Anek Devanagari, ui-serif, Inter, ui-sans-serif",
            colorPrimary: "#FF5733",
            colorLink: "#FF5733",
          },
        }}
      >
        <HashRouter>
          <ProfileProvider>
            <Component />
          </ProfileProvider>
        </HashRouter>
      </ConfigProvider>
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
    tryAndRender({ Component });
  });
};
