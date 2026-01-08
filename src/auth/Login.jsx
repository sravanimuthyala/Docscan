import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthProvider";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user]);

  async function login() {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex align-items-center justify-content-center position-relative">
      {loading && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center bg-dark bg-opacity-50" style={{ zIndex: 10 }}>
          <div className="spinner-border text-light mb-3" role="status"></div>
          <p className="text-light fw-semibold">Logging in...</p>
        </div>
      )}

      <div className={`card shadow-sm border-0 rounded-4 p-4 ${loading ? "opacity-50 pointer-events-none" : ""}`} style={{ width: 360 }}>
        <h4 className="fw-bold text-center mb-3">Login to DocScan</h4>

        <input
          className="form-control mb-2"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={loading}
        />

        <div className="input-group mb-3">
          <input
            type={showPassword ? "text" : "password"}
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            <i className={`${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
          </button>
        </div>

        <button className="btn btn-dark w-100" onClick={login} disabled={loading}>
          Login
        </button>
      </div>
    </div>
  );
}
