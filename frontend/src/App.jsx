import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import InstructorRegistrationPage from "./pages/instructor/InstructorRegistrationPage";
import InstructorListPage from "./pages/instructor/InstructorListPage";
import InstructorDetailPage from "./pages/instructor/InstructorDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/instructor" replace />} />
        <Route path="/instructor" element={<InstructorListPage />} />
        <Route path="/instructor/register" element={<InstructorRegistrationPage />} />
        <Route path="/instructor/:id" element={<InstructorDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
