import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import InstructorRegistrationPage from "./pages/instructor/InstructorRegistrationPage";
import InstructorListPage from "./pages/instructor/InstructorListPage";
import InstructorDetailPage from "./pages/instructor/InstructorDetailPage";
import ClientRegistrationPage from "./pages/client/ClientRegistrationPage";
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import UnauthorizedPage from "./pages/error/UnauthorizedPage";
import ProfilePage from "./pages/profile/ProfilePage";
import UserListPage from "./pages/user/UserListPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/client/register" element={<ClientRegistrationPage />} />
        <Route path="/instructor/register" element={<InstructorRegistrationPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Only Logged in User */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* ADMIN-only */}
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <UserListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <InstructorListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <InstructorDetailPage />
            </ProtectedRoute>
          }
        />

        {/* ADMIN and INSTRUCTOR*/}
        {/* <Route
          path="/instructor/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "INSTRUCTOR"]}>
              <InstructorDetailPage />
            </ProtectedRoute>
          }
        /> */}

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
