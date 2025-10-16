// test-atlas-connection.js
// Script to test MongoDB Atlas connection

import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { URL } from 'url';

console.log('Testing MongoDB Atlas Connection...');
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Found' : '❌ NOT FOUND');

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not set in .env file');
  console.log('Please follow the instructions in MONGODB_ATLAS_SETUP.md');
  process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI;

// Check for common configuration issues
if (MONGO_URI.includes('<') || MONGO_URI.includes('>')) {
  console.error('❌ Invalid connection string detected!');
  console.error('You are still using placeholder values (<username>, <password>, etc.)');
  console.error('Please replace ALL placeholder values with your actual MongoDB Atlas credentials.');
  console.log('\nRefer to MONGODB_ATLAS_TROUBLESHOOTING.md for detailed instructions.');
  process.exit(1);
}

if (MONGO_URI.startsWith('mongodb+srv://<username>:<password>')) {
  console.error('❌ You are using the example connection string!');
  console.error('Please get your actual connection string from MongoDB Atlas:');
  console.error('1. Log in to MongoDB Atlas');
  console.error('2. Go to your cluster');
  console.error('3. Click "Connect"');
  console.error('4. Select "Connect your application"');
  console.error('5. Copy the connection string and replace the placeholder values');
  process.exit(1);
}

// Check for URL encoding issues
try {
  const parsedUri = new URL(MONGO_URI);
  const username = parsedUri.username;
  const password = parsedUri.password;
  
  if (MONGO_URI.split('@').length > 2) {
    console.warn('⚠️  Warning: Multiple @ symbols detected in connection string');
    console.warn('This often indicates unencoded special characters in username or password');
    console.warn('Special characters like @, :, /, ?, #, [, ] must be URL encoded:');
    console.warn('  @ becomes %40');
    console.warn('  : becomes %3A');
    console.warn('  / becomes %2F');
    console.warn('  ? becomes %3F');
    console.warn('  # becomes %23');
    console.warn('  [ becomes %5B');
    console.warn('  ] becomes %5D');
    console.warn('  % becomes %25');
  }
} catch (urlError) {
  console.error('❌ Invalid URI format detected:', urlError.message);
  console.log('\nThis usually means special characters in your credentials need to be URL encoded.');
  process.exit(1);
}

console.log('Attempting to connect to MongoDB Atlas...');

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
})
  .then(() => {
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('Connection details:');
    console.log('- Host:', mongoose.connection.host);
    console.log('- Name:', mongoose.connection.name);
    
    // Close connection
    mongoose.connection.close();
    console.log('Disconnected from MongoDB Atlas');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB Atlas:', err.message);
    
    // Provide specific troubleshooting based on error type
    if (err.message.includes('querySrv ENOTFOUND') || err.message.includes('querySrv EBADNAME')) {
      console.log('\n🔧 Specific Troubleshooting for this error:');
      console.log('- Your connection string format is likely incorrect');
      console.log('- Special characters in username/password must be URL encoded');
      console.log('- Check that your cluster URL is correct and accessible');
    } else if (err.message.includes('Authentication failed')) {
      console.log('\n🔧 Authentication Error:');
      console.log('- Check your username and password');
      console.log('- Make sure you\'re using database user credentials, not Atlas account credentials');
    } else if (err.message.includes('getaddrinfo ENOTFOUND')) {
      console.log('\n🔧 DNS Resolution Error:');
      console.log('- Your cluster URL might be misspelled');
      console.log('- Check that your cluster is not paused');
    }
    
    console.log('\nRefer to MONGODB_ATLAS_TROUBLESHOOTING.md for detailed troubleshooting steps.');
    console.log('\nCommon fixes:');
    console.log('1. Check your MONGO_URI in .env file');
    console.log('2. Verify all special characters in credentials are URL encoded');
    console.log('3. Ensure your IP address is whitelisted in MongoDB Atlas Network Access');
    console.log('4. Confirm your MongoDB Atlas cluster is deployed and running');
    process.exit(1);
  });