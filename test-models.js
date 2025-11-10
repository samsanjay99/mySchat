import { config } from 'dotenv';
import { OpenAI } from 'openai';

// Load environment variables
config();

const models = [
  'provider-5/gemini-2.0-flash-lite-001',
  'provider-1/gemma-3-27b-instruct-bf-16',
  'provider-6/gemma-3-27b-instruct',
  'provider-5/nova-micro-v1',
  'provider-5/deepseek-r1-0528-qwen3-8b',
];

console.log('🔍 Testing A4F Models...\n');
console.log('API Key:', process.env.A4F_API_KEY?.substring(0, 15) + '...');
console.log('Base URL:', process.env.A4F_BASE_URL);
console.log('\n' + '='.repeat(60) + '\n');

const client = new OpenAI({
  apiKey: process.env.A4F_API_KEY,
  baseURL: process.env.A4F_BASE_URL,
});

async function testModel(model) {
  console.log(`Testing: ${model}`);
  
  try {
    const startTime = Date.now();
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello" in one word.' }
      ],
      max_tokens: 20,
    });
    
    const endTime = Date.now();
    const response = completion.choices[0].message.content;
    
    console.log(`✅ SUCCESS (${endTime - startTime}ms)`);
    console.log(`   Response: "${response}"`);
    console.log('');
    return { model, success: true, response, time: endTime - startTime };
  } catch (error) {
    console.log(`❌ FAILED`);
    console.log(`   Error: ${error.message}`);
    if (error.status) console.log(`   Status: ${error.status}`);
    if (error.code) console.log(`   Code: ${error.code}`);
    console.log('');
    return { model, success: false, error: error.message };
  }
}

async function testAllModels() {
  const results = [];
  
  for (const model of models) {
    const result = await testModel(model);
    results.push(result);
  }
  
  console.log('='.repeat(60));
  console.log('📊 SUMMARY:');
  console.log('='.repeat(60));
  
  const working = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (working.length > 0) {
    console.log('\n✅ Working Models:');
    working.forEach(r => {
      console.log(`   - ${r.model} (${r.time}ms)`);
    });
    
    // Find fastest
    const fastest = working.reduce((prev, curr) => 
      prev.time < curr.time ? prev : curr
    );
    console.log(`\n🏆 Recommended: ${fastest.model} (fastest at ${fastest.time}ms)`);
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Models:');
    failed.forEach(r => {
      console.log(`   - ${r.model}: ${r.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (working.length > 0) {
    console.log('\n✅ Update your .env with the recommended model:');
    console.log(`   SUPER_AI_MODEL=${fastest.model}`);
    console.log(`   FALLBACK_MODEL=${working[working.length - 1].model}`);
  } else {
    console.log('\n❌ No models are working. Your API key might be invalid.');
    console.log('   Get a new key from: https://api.a4f.co');
  }
}

testAllModels();
