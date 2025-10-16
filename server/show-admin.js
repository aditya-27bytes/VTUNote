import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import User model
import User from "./src/models/User.js";

const showAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ai-notes");
    console.log("✅ Connected to MongoDB");

    // Find admin user
    const adminUser = await User.findOne({ role: "admin" });
    
    if (adminUser) {
      console.log("🎯 Admin User Found:");
      console.log("=====================");
      console.log(`Name: ${adminUser.name}`);
      console.log(`Email: ${adminUser.email}`);
      console.log(`Password: admin123 (default)`);
      console.log(`Role: ${adminUser.role}`);
      console.log(`USN: ${adminUser.usn}`);
      console.log(`College: ${adminUser.college}`);
      console.log(`Branch: ${adminUser.branch}`);
      console.log(`Semester: ${adminUser.semester}`);
      console.log("=====================");
      console.log("\n🔑 Login Credentials:");
      console.log(`Email: ${adminUser.email}`);
      console.log(`Password: admin123`);
      console.log("\n⚠️  Remember to change the password after first login!");
    } else {
      console.log("❌ No admin user found!");
      console.log("Run 'npm run create-admin' to create one.");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
};

// Run the script
showAdminUser();
