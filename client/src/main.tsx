import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { CityProvider } from "@/lib/city";
import { AssistantProvider } from "@/lib/assistant";
import { UIStateProvider } from "@/lib/uiState";
import { ToastProvider } from "@/components/ui";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <CityProvider>
              <UIStateProvider>
                <AssistantProvider>
                  <App />
                </AssistantProvider>
              </UIStateProvider>
            </CityProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
