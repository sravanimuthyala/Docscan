import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";

import Login from "./auth/Login";
import Register from "./auth/Register";
import Dashboard from "./pages/Dashboard";
import Gallery from "./pages/Gallery";
import Navbar from "./components/Navbar";
import { AuthProvider, AuthContext } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";

function AppRoutes() {
  const { user, loading } = useContext(AuthContext);

  // Wait until Firebase checks auth
  if (loading) return null;

  // 🔓 Not logged in
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // 🔐 Logged in
  return (
    <>
      <Navbar user={user} />

      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gallery"
          element={
            <ProtectedRoute>
              <Gallery />
            </ProtectedRoute>
          }
        />

        {/* Default after login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
