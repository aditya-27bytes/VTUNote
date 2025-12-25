import React, { useState } from "react";
import apiClient from "../utils/apiClient";

type RegistrationData = {
  name: string;
  email: string;
  usn: string;
  college: string;
  branch: string;
  semester: number | string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  registrationData: RegistrationData | null;
  onSuccess: (token: string) => void;
};

export default function OTPVerificationModal({ open, onClose, registrationData, onSuccess }: Props) {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!open || !registrationData) return null;

  const handleVerify = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const body = {
        email: registrationData.email,
        otp,
        password,
        name: registrationData.name,
        usn: registrationData.usn,
        college: registrationData.college,
        branch: registrationData.branch,
        semester: registrationData.semester
      };

      const res = await apiClient.post("/auth/verify-otp", body);
      const token = res.data.token;
      if (token) {
        localStorage.setItem("token", token);
        onSuccess(token);
      }
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await apiClient.post("/auth/resend-otp", { email: registrationData.email });
      setMessage("OTP resent to your email");
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
      <div style={{ background: "white", padding: 24, borderRadius: 8, width: 420, maxWidth: "94%" }}>
        <h3>Verify your email</h3>
        <p style={{ marginTop: 0 }}>We've sent an OTP to <strong>{registrationData.email}</strong>. Enter it below along with a password to complete registration.</p>

        <input placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 10 }} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 10 }} />

        {message && <div style={{ color: "#b00020", marginBottom: 10 }}>{message}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={handleResend} disabled={loading} style={{ background: "#f3f3f3", padding: "8px 12px" }}>Resend OTP</button>
          <button onClick={onClose} disabled={loading} style={{ background: "#eee", padding: "8px 12px" }}>Cancel</button>
          <button onClick={handleVerify} disabled={loading} style={{ background: "#4a6cf7", color: "white", padding: "8px 12px" }}>{loading ? "Verifying..." : "Verify & Complete"}</button>
        </div>
      </div>
    </div>
  );
}
