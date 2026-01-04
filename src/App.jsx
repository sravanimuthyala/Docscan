import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import Dashboard from "./pages/Dashboard";
import Gallery from "./pages/Gallery";
import Navbar from "./components/Navbar";
import { AuthProvider, AuthContext } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import { useContext } from "react";

function AppRoutes() {
  const { user, loading } = useContext(AuthContext);

  // Optional: wait for auth check
  if (loading) return null;

  // 🔓 Not logged in → only Login page
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // 🔐 Logged in → show Navbar + protected pages
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
   
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
   
  );
}
