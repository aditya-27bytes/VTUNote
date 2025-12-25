import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  usn: { type: String, required: true, unique: true }, // VTU University Seat Number
  college: { type: String, required: true }, // College name
  branch: { type: String, required: true }, // Engineering branch
  semester: { type: Number, required: true, min: 1, max: 8 }, // Current semester
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  unreadNotifications: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

// Add password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model("User", userSchema);
