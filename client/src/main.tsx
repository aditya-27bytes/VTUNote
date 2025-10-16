import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { TeacherAuthProvider } from "./contexts/TeacherAuthContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TeacherAuthProvider>
          <App />
        </TeacherAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
