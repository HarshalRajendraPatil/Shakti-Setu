import { useState, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Mail, Lock, User, Scale } from "lucide-react";
import { loginUser, clearError as clearAuthError } from "../../store/slices/authSlice";
import { loginLawyer, clearError as clearLawyerError } from "../../store/slices/lawyerSlice";
import { AppContext } from "../../context/AppContext";
import GlassCard from "../common/GlassCard";
import InputField from "../common/InputField";

const Login = () => {
  const dispatch = useDispatch();
  const { t, setPage, setUser } = useContext(AppContext);
  const { loading: authLoading, error: authError } = useSelector((state) => state.auth);
  const { loading: lawyerLoading, error: lawyerError } = useSelector((state) => state.lawyer);

  const [mode, setMode] = useState("user"); // "user" | "lawyer"
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const loading = mode === "user" ? authLoading : lawyerLoading;
  const error = mode === "user" ? authError : lawyerError;

  const clearErrors = () => {
    dispatch(clearAuthError());
    dispatch(clearLawyerError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    if (mode === "user") {
      const result = await dispatch(loginUser(formData));
      if (loginUser.fulfilled.match(result)) {
        setUser(result.payload.user);
        setPage("home");
      }
    } else {
      const result = await dispatch(loginLawyer(formData));
      if (loginLawyer.fulfilled.match(result)) {
        const { status } = result.payload.lawyer;
        if (status === "pending") {
          alert("Your registration is pending admin approval.");
        } else if (status === "rejected") {
          alert("Your registration has been rejected. Please contact admin.");
        }
        setPage("home");
      }
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    clearErrors();
  };

  return (
    <div className="page-container center-content">
      <GlassCard className="register-card">
        <div className="register-header">
          <h2>Login</h2>
          <p>Welcome back! Sign in to continue.</p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "1.5rem",
            background: "rgba(0,0,0,0.2)",
            padding: "6px",
            borderRadius: "10px",
            border: "1px solid var(--border-color)",
          }}
        >
          <button
            type="button"
            onClick={() => switchMode("user")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              background: mode === "user" ? "rgba(168, 85, 247, 0.25)" : "transparent",
              border: "none",
              borderRadius: "8px",
              color: mode === "user" ? "#e879f9" : "var(--text-muted)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.95rem",
            }}
          >
            <User size={18} />
            Login as User
          </button>
          <button
            type="button"
            onClick={() => switchMode("lawyer")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              background: mode === "lawyer" ? "rgba(168, 85, 247, 0.25)" : "transparent",
              border: "none",
              borderRadius: "8px",
              color: mode === "lawyer" ? "#e879f9" : "var(--text-muted)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.95rem",
            }}
          >
            <Scale size={18} />
            Login as Lawyer
          </button>
        </div>

        {error && (
          <div
            className="error-message"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid #ef4444",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "1rem",
              color: "#ef4444",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <InputField
            icon={Mail}
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="your.email@example.com"
          />
          <InputField
            icon={Lock}
            label="Password"
            type="password"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="Enter your password"
          />
          <button
            type="submit"
            className="btn-primary full-width"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <p
            style={{
              textAlign: "center",
              marginTop: "1rem",
              color: "var(--text-muted)",
            }}
          >
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => setPage("register")}
              style={{
                background: "none",
                border: "none",
                color: "#a855f7",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Register here
            </button>
          </p>
        </form>
      </GlassCard>
    </div>
  );
};

export default Login;
