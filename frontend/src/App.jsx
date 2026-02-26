import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import InstructorRegistrationPage from "./pages/instructor/InstructorRegistrationPage";
import InstructorListPage from "./pages/instructor/InstructorListPage";
import InstructorDetailPage from "./pages/instructor/InstructorDetailPage";
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

        <Route path="/instructor" element={<InstructorListPage />} />
        <Route path="/instructor/register" element={<InstructorRegistrationPage />} />
        <Route path="/instructor/:id" element={<InstructorDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
