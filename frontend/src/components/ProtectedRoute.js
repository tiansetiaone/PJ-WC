// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role = "admin" }) {
  const user = JSON.parse(localStorage.getItem("user"));

  // kalau belum login atau rolenya bukan admin, lempar ke login/home
  if (!user || user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
