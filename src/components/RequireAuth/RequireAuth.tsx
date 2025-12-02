import { useAuth } from "@/context/AuthContext";
import type { JSX } from "react";
import { Navigate } from "react-router-dom";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { loggedIn, loading } = useAuth();
  
  if (loading) return null;

  if (!loggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAuth;
