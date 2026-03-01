import React from "react";
import { Navigate } from "react-router-dom";

const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const role = localStorage.getItem("role");

  // if not logged in, redirect to login
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  if (!token && !userId) return <Navigate to="/login" replace />;

  if (!role || !allowedRoles.includes(role)) {
    // unauthorized - redirect to login (or could show a forbidden page)
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
