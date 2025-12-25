import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  userType: { type: String, enum: ['student', 'teacher'], required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // OTP expires in 5 minutes
  isVerified: { type: Boolean, default: false },
  attempts: { type: Number, default: 0, max: 5 } // Max 5 attempts to verify
});

export default mongoose.model("OTP", otpSchema);
