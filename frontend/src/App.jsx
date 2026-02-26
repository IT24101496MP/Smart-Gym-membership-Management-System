import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import InstructorRegistrationPage from "./pages/instructor/InstructorRegistrationPage"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/instructor/register" element={<InstructorRegistrationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
