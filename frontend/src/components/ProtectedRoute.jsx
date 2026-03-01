import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

const ProtectedRoute = ({ children }) => {
  // "checking" while the async token validation / silent refresh is in progress
  const [authState, setAuthState] = useState("checking");

  useEffect(() => {
    isAuthenticated().then((valid) => {
      setAuthState(valid ? "valid" : "invalid");
    });
  }, []);

  if (authState === "checking") return null; // renders nothing while checking (add a spinner here if desired)
  if (authState === "invalid") return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
