import React from "react";
import { createRoot } from "react-dom/client";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { App } from "./App";

/* global document, Office */

const renderApp = () => {
  const container = document.getElementById("container");
  if (container) {
    const root = createRoot(container);
    root.render(
      <FluentProvider theme={webLightTheme}>
        <App />
      </FluentProvider>
    );
  }
};

// Works both inside Excel and in regular browser (for testing)
if (typeof Office !== "undefined") {
  Office.onReady(() => renderApp());
} else {
  // Running in plain browser — render immediately for UI testing
  renderApp();
}
