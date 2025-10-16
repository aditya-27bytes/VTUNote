import dotenv from 'dotenv';

console.log('🔍 Testing environment variables:');
console.log('Before dotenv.config():');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Found' : '❌ NOT FOUND');
console.log('- MONGO_URI:', process.env.MONGO_URI ? '✅ Found' : '❌ NOT FOUND');

dotenv.config();

console.log('\nAfter dotenv.config():');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Found' : '❌ NOT FOUND');
console.log('- MONGO_URI:', process.env.MONGO_URI ? '✅ Found' : '❌ NOT FOUND');
console.log('- JWT_SECRET value:', process.env.JWT_SECRET);
console.log('- MONGO_URI value:', process.env.MONGO_URI);
