import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import InstructorRegistrationPage from "./pages/instructor/InstructorRegistrationPage";
import InstructorListPage from "./pages/instructor/InstructorListPage";
import InstructorDetailPage from "./pages/instructor/InstructorDetailPage";
import ClientRegistrationPage from "./pages/client/ClientRegistrationPage";
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import UnauthorizedPage from "./pages/error/UnauthorizedPage";
import ProfilePage from "./pages/profile/ProfilePage";
import ManagePage from "./pages/manage/ManagePage";
import AttendancePage from "./pages/attendance/AttendancePage";
import MembershipPlansOverviewPage from "./pages/membership/MembershipPlansOverviewPage";
import PaymentPage from "./pages/payment/PaymentPage";

function App() {
  return (
      <BrowserRouter>
        <Routes>

          {/* Login/Signup Page */}
          <Route path="/login" element={<LoginPage />} />

          {/* public pages */}
          <Route path="/client/register" element={<ClientRegistrationPage />} />
          <Route path="/instructor/register" element={<InstructorRegistrationPage />} />
            
          {/* ADMIN-only */}
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


          {/* Protected Profile Page */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
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

          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "INSTRUCTOR"]}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/membership-plans"
            element={<MembershipPlansOverviewPage />}
          />

          <Route
            path="/payment/:planId"
            element={
              <ProtectedRoute allowedRoles={["CLIENT"]}>
                <PaymentPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Catch all unknown routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
  );
}

export default App;
