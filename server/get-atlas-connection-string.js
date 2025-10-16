// get-atlas-connection-string.js
// Helper script to guide users on how to get their MongoDB Atlas connection string

console.log('=== MongoDB Atlas Connection String Helper ===\n');

console.log('Follow these steps to get your MongoDB Atlas connection string:\n');

console.log('1. Log in to MongoDB Atlas:');
console.log('   Visit https://cloud.mongodb.com/ and log in to your account\n');

console.log('2. Navigate to your cluster:');
console.log('   - If you have a cluster, select it from the Clusters view');
console.log('   - If you don\'t have a cluster, create one by clicking "Build a Cluster"\n');

console.log('3. Connect to your cluster:');
console.log('   - Click the "Connect" button on your cluster\n');

console.log('4. Choose connection method:');
console.log('   - Select "Connect your application"\n');

console.log('5. Select your driver:');
console.log('   - Make sure "Node.js" is selected as the driver');
console.log('   - Make sure version "4.0 or later" is selected\n');

console.log('6. Copy your connection string:');
console.log('   - Copy the connection string provided');
console.log('   - It should look like: mongodb+srv://<username>:<password>@cluster-url.mongodb.net/database-name?retryWrites=true&w=majority\n');

console.log('7. Replace placeholder values:');
console.log('   - Replace <username> with your database username');
console.log('   - Replace <password> with your database password');
console.log('   - Replace <cluster-url> with your actual cluster URL');
console.log('   - Replace <database-name> with your desired database name (e.g., ai_notes)\n');

console.log('8. Update your .env file:');
console.log('   - Open server/.env');
console.log('   - Replace the MONGO_URI value with your complete connection string\n');

console.log('9. Test your connection:');
console.log('   - Run: npm run test-atlas\n');

console.log('Need more help? Check the documentation:');
console.log('- MONGODB_ATLAS_SETUP.md for setup instructions');
console.log('- MONGODB_ATLAS_TROUBLESHOOTING.md for troubleshooting\n');