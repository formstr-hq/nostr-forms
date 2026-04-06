import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ConfigProvider } from "antd";
import { antThemeConfig, applyThemeCssVariables } from "./theme/themeConfig";

const root = ReactDOM.createRoot(document.getElementById("root"));
applyThemeCssVariables();

root.render(
  <React.StrictMode>
    <ConfigProvider theme={antThemeConfig}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
