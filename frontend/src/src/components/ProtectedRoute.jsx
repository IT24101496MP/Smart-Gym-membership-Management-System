import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, getRole } from "../utils/auth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [authState, setAuthState] = useState("checking");

  useEffect(() => {
    isAuthenticated().then((valid) => {
      setAuthState(valid ? "valid" : "invalid");
    });
  }, []);

  if (authState === "checking") return null;
  if (authState === "invalid") return <Navigate to="/login" replace />;

  // Role check – only runs once we know the user is authenticated
  if (allowedRoles && allowedRoles.length > 0) {
    const role = getRole();
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
