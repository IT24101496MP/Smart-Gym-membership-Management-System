import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";


import UserLoginRegistration from "./pages/user/UserLoginRegistration";
import InstructorRegistrationPage from "./pages/instructor/InstructorRegistrationPage";
import InstructorListPage from "./pages/instructor/InstructorListPage";
import InstructorDetailPage from "./pages/instructor/InstructorDetailPage";
import ClientRegistrationPage from "./pages/client/ClientRegistrationPage";
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

          {/* Client Registration */}
          <Route path="/client-registration" element={<ClientRegistrationPage />} />
          <Route path="/profile" element={<ClientProfile />} />
          <Route path="/instructor" element={<InstructorListPage />} />
          <Route path="/instructor/register" element={<InstructorRegistrationPage />} />
          <Route path="/instructor/:id" element={<InstructorDetailPage />} />

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

          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Catch all unknown routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
