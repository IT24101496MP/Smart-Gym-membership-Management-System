import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import InstructorRegistrationPage from "./pages/instructor/InstructorRegistrationPage";
import InstructorListPage from "./pages/instructor/InstructorListPage";
import InstructorDetailPage from "./pages/instructor/InstructorDetailPage";
import ClientRegistrationPage from "./pages/client/ClientRegistrationPage";
import LoginPage from "./pages/auth/LoginPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/client/register" element={<ClientRegistrationPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/instructor" element={<InstructorListPage />} />
        <Route path="/instructor/register" element={<InstructorRegistrationPage />} />
        <Route path="/instructor/:id" element={<InstructorDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
