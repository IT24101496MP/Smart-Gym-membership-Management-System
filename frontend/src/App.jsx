import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";


import UserLoginRegistration from "./pages/user/UserLoginRegistration";
import InstructorRegistrationPage from "./pages/instructor/InstructorRegistrationPage";
import InstructorListPage from "./pages/instructor/InstructorListPage";
import InstructorDetailPage from "./pages/instructor/InstructorDetailPage";
import ClientRegistrationPage from "./pages/client/ClientRegistrationPage";
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import UnauthorizedPage from "./pages/error/UnauthorizedPage";
import ProfilePage from "./pages/profile/ProfilePage";
import ManagePage from "./pages/manage/ManagePage";
import UserListPage from "./pages/user/UserListPage";
import ClientProfile from "./pages/client/ClientProfile";
import ActiveMembers from "./pages/admin/ActiveMembers";
import RoleProtectedRoute from "./routes/RoleProtectedRoute";

import ProtectedRoute from "./routes/ProtectedRoute";

function App() {

  const handleFacebookLogin = (response) => {
    console.log("Facebook login response:", response);
  };

  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <BrowserRouter>
        <Routes>

          {/* Login/Signup Page */}
          <Route
            path="/login"
            element={
              <UserLoginRegistration
                onFacebookLogin={handleFacebookLogin}
              />
            }
          />

          {/* public pages */}
          <Route path="/client-registration" element={<ClientRegistrationPage />} />
          <Route path="/instructor/register" element={<InstructorRegistrationPage />} />
            
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

          <Route
            path="/active-members"
            element={
              <RoleProtectedRoute allowedRoles={["ADMIN", "INSTRUCTOR"]}>
                <ActiveMembers />
              </RoleProtectedRoute>
            }
          />

          {/* Protected Profile Page */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ClientProfile />
              </ProtectedRoute>
            }
          />
          
          {/* All authenticated roles – role-aware manage page */}
          <Route
            path="/manage"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "INSTRUCTOR", "CLIENT"]}>
                <ManagePage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Catch all unknown routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
