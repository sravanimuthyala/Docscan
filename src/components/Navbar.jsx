import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Navbar({ user }) {
  const navigate = useNavigate();

  async function logout() {
    await signOut(auth);
    navigate("/");
  }

  return (
    <nav className="navbar navbar-light bg-white shadow-sm px-4">
      {/* Left */}
      <Link className="navbar-brand fw-bold" to="/dashboard">
        DocScan
      </Link>

      {/* Right */}
      <div className="d-flex align-items-center gap-3">
        <span className="text-muted small">{user.email}</span>

        <Link to="/gallery" className="btn btn-outline-secondary btn-sm">
          Gallery
        </Link>

        <button onClick={logout} className="btn btn-outline-danger btn-sm">
          Logout
        </button>
      </div>
    </nav>
  );
}
