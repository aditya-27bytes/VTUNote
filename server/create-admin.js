import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import User model
import User from "./src/models/User.js";

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ai-notes");
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("ℹ️ Admin user already exists:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }

    // Create admin user
    const adminData = {
      name: "Admin User",
      email: "admin@vtu.edu",
      password: "admin123", // This will be hashed automatically
      usn: "1AD21AD001", // Admin USN
      college: "VTU Admin",
      branch: "Administration",
      semester: 1,
      role: "admin"
    };

    const adminUser = new User(adminData);
    await adminUser.save();

    console.log("🎉 Admin user created successfully!");
    console.log("📋 Admin Credentials:");
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   Role: ${adminData.role}`);
    console.log("\n🔑 You can now login with these credentials!");
    console.log("⚠️  Remember to change the password after first login!");

  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
};

// Run the script
createAdminUser();
