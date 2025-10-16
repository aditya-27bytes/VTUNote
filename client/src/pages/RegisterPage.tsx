import { useState } from "react";
import apiClient from "../utils/apiClient";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    usn: "",
    college: "",
    branch: "",
    semester: "" 
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const vtuBranches = [
    "Computer Science and Engineering",
    "Information Science and Engineering",
    "Electronics and Communication Engineering",
    "Electrical and Electronics Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
    "Biotechnology",
    "Aerospace Engineering",
    "Industrial Engineering and Management"
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post("/auth/register", form);
      alert("Registration successful! Please login.");
      navigate("/");
    } catch (e: any) {
      alert(e.response?.data?.error || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center">
      <form className="card" onSubmit={onSubmit}>
        <h2>Create VTU Student Account</h2>
        
        {/* Personal Information */}
        <input 
          placeholder="Full Name" 
          required 
          value={form.name} 
          onChange={(e) => setForm({ ...form, name: e.target.value })} 
        />
        <input 
          placeholder="Email Address" 
          type="email" 
          required 
          value={form.email} 
          onChange={(e) => setForm({ ...form, email: e.target.value })} 
        />
        <input 
          placeholder="Password (min 6 characters)" 
          type="password" 
          minLength={6} 
          required 
          value={form.password} 
          onChange={(e) => setForm({ ...form, password: e.target.value })} 
        />
        
        {/* VTU Specific Information */}
        <input 
          placeholder="USN (e.g., 1AB21CS001)" 
          required 
          value={form.usn} 
          onChange={(e) => setForm({ ...form, usn: e.target.value.toUpperCase() })} 
          title="Enter your VTU University Seat Number"
        />
        <input 
          placeholder="College Name" 
          required 
          value={form.college} 
          onChange={(e) => setForm({ ...form, college: e.target.value })} 
        />
        <select 
          required 
          value={form.branch} 
          onChange={(e) => setForm({ ...form, branch: e.target.value })}
          style={{ padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '8px' }}
        >
          <option value="">Select Engineering Branch</option>
          {vtuBranches.map((branch) => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
        </select>
        <select 
          required 
          value={form.semester} 
          onChange={(e) => setForm({ ...form, semester: e.target.value })}
          style={{ padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '8px' }}
        >
          <option value="">Select Current Semester</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <option key={sem} value={sem}>Semester {sem}</option>
          ))}
        </select>
        
        <button disabled={loading} type="submit">
          {loading ? "Creating Account..." : "Register"}
        </button>
        <p style={{ marginTop: 8 }}>
          Already have an account? <Link to="/">Login</Link>
        </p>
        <p style={{ marginTop: 8, textAlign: "center" }}>
          <Link to="/teacher/register" style={{ color: "#4a6cf7", fontWeight: "bold" }}>
            Register as Teacher →
          </Link>
        </p>
      </form>
    </div>
  );
}
