import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ClientRegistrationPage from "./pages/client/ClientRegistrationPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/client/register" element={<ClientRegistrationPage />} />
        <Route path="/" element={<Navigate to="/client/register" replace />} />

        <Route
          path="/login"
          element={
            <div style={{ textAlign: "center", marginTop: "50px" }}>
              <h1>Login Page</h1>
              <p>This is a placeholder login page.</p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;