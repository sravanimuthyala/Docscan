import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthProvider";
import Loader from "../components/Loader";

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
    <div className="bg-body-tertiary min-vh-100 d-flex align-items-center justify-content-center">
      {loading && <Loader text="Logging in..." />}

      <div className="card shadow-sm border-0 rounded-4 p-4" style={{ width: 360 }}>
        <h4 className="fw-bold text-center mb-3">Login to DocScan</h4>

        <input
          className="form-control mb-2"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />

        {/* Password with eye icon */}
        <div className="input-group mb-3">
          <input
            type={showPassword ? "text" : "password"}
            className="form-control"
            placeholder="Password"
            onChange={e => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowPassword(!showPassword)}
          >
            <i className={`${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
          </button>
        </div>


        <button className="btn btn-dark w-100" onClick={login}>
          Login
        </button>
      </div>
    </div>
  );
}
