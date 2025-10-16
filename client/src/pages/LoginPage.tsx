import { useState } from "react";
import apiClient from "../utils/apiClient";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await apiClient.post("/auth/login", form);
      const { token, user } = res.data;
      login(token, user);
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center">
      <form className="card" onSubmit={onSubmit}>
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <input 
          placeholder="Email" 
          type="email" 
          required 
          value={form.email} 
          onChange={(e) => setForm({ ...form, email: e.target.value })} 
        />
        <input 
          placeholder="Password" 
          type="password" 
          required 
          value={form.password} 
          onChange={(e) => setForm({ ...form, password: e.target.value })} 
        />
        <button disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign In"}
        </button>
        
        <p className="text-center">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        <p className="text-center">
          <Link to="/teacher/login">Login as Teacher →</Link>
        </p>
      </form>
    </div>
  );
}
