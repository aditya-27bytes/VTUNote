import mongoose from "mongoose";
import bcrypt from "bcrypt";

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true }, // Teacher Employee ID
  department: { type: String, required: true }, // Department/Subject area
  designation: { type: String, required: true }, // Professor, Assistant Professor, etc.
  qualification: { type: String, required: true }, // PhD, M.Tech, etc.
  experience: { type: Number, required: true, min: 0 }, // Years of experience
  phone: { type: String, required: true },
  college: { type: String, required: true }, // College/University name
  subjects: [{ type: String }], // Subjects they teach
  isVerified: { type: Boolean, default: false }, // Admin verification status
  isActive: { type: Boolean, default: true }, // Account status
  profileImage: { type: String }, // Profile image URL
  bio: { type: String, maxLength: 500 }, // Teacher bio
  role: { type: String, enum: ['teacher'], default: 'teacher' },
  unreadNotifications: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

// Add password comparison method
teacherSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Hash password before saving
teacherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  // Check if password is already hashed (bcrypt hashes start with $2b$)
  if (this.password.startsWith('$2b$')) {
    return next();
  }
  
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model("Teacher", teacherSchema);
