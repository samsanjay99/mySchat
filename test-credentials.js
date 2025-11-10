import { config } from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

// Load environment variables
config();

console.log('🔍 Testing Credentials...\n');

// Test 1: Database Connection
async function testDatabase() {
  console.log('1️⃣ Testing Database Connection...');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('   ✅ Database connected successfully!');
    
    // Test query
    const result = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`   ✅ Found ${result.rows[0].count} users in database`);
    
    const messagesResult = await client.query('SELECT COUNT(*) as count FROM messages');
    console.log(`   ✅ Found ${messagesResult.rows[0].count} messages in database`);
    
    await client.end();
    return true;
  } catch (error) {
    console.error('   ❌ Database connection failed:', error.message);
    return false;
  }
}

// Test 2: A4F API Key
async function testA4FAPI() {
  console.log('\n2️⃣ Testing A4F API Key...');
  console.log('   A4F_API_KEY:', process.env.A4F_API_KEY?.substring(0, 15) + '...');
  console.log('   A4F_BASE_URL:', process.env.A4F_BASE_URL);
  console.log('   SUPER_AI_MODEL:', process.env.SUPER_AI_MODEL);
  
  try {
    const { default: OpenAI } = await import('openai');
    
    const client = new OpenAI({
      apiKey: process.env.A4F_API_KEY,
      baseURL: process.env.A4F_BASE_URL,
    });
    
    console.log('   🔄 Sending test request to A4F API...');
    
    const completion = await client.chat.completions.create({
      model: process.env.SUPER_AI_MODEL || 'provider-5/gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello! I am working correctly." in exactly those words.' }
      ],
      max_tokens: 50,
    });
    
    const response = completion.choices[0].message.content;
    console.log('   ✅ A4F API responded:', response);
    return true;
  } catch (error) {
    console.error('   ❌ A4F API failed:', error.message);
    if (error.status) {
      console.error('   Status:', error.status);
    }
    if (error.code) {
      console.error('   Code:', error.code);
    }
    return false;
  }
}

// Run tests
async function runTests() {
  const dbOk = await testDatabase();
  const apiOk = await testA4FAPI();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results:');
  console.log('   Database:', dbOk ? '✅ PASS' : '❌ FAIL');
  console.log('   A4F API:', apiOk ? '✅ PASS' : '❌ FAIL');
  console.log('='.repeat(50));
  
  if (dbOk && apiOk) {
    console.log('\n🎉 All credentials are working! Safe to deploy to Render.');
  } else {
    console.log('\n⚠️  Some credentials failed. Fix them before deploying.');
  }
  
  process.exit(dbOk && apiOk ? 0 : 1);
}

runTests();
