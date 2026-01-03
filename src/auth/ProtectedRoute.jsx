import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthProvider";
import Loader from "../components/Loader";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <Loader text="Checking session..." />;

  if (!user) return <Navigate to="/" replace />;

  return children;
}
