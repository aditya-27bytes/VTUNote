import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('\n📋 ENVIRONMENT VARIABLES CHECK');
console.log('════════════════════════════════════════════════════════');

// Check all email-related vars
console.log('\n🔍 Gmail Configuration:');
console.log(`   GMAIL_USER: ${process.env.GMAIL_USER}`);
console.log(`   GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER}`);
console.log(`   EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD}`);
console.log(`   EMAIL_SERVICE: ${process.env.EMAIL_SERVICE}`);

console.log('\n🔍 Other Critical Variables:');
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   PORT: ${process.env.PORT}`);

console.log('\n════════════════════════════════════════════════════════\n');
