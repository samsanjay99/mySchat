import Bytez from "bytez.js";
import { config } from 'dotenv';

config();

const key = process.env.BYTEZ_API_KEY || "701c30e76be706b098b3cbaa07b2a12e";
const modelName = process.env.SUPER_AI_MODEL || "Qwen/Qwen3-4B-Instruct-2507";

console.log('🔍 Testing Bytez.js API...\n');
console.log('API Key:', key.substring(0, 15) + '...');
console.log('Model:', modelName);
console.log('\n' + '='.repeat(60) + '\n');

async function testBytez() {
  try {
    const sdk = new Bytez(key);
    const model = sdk.model(modelName);
    
    console.log('📤 Sending test message: "Hello, how are you?"');
    const startTime = Date.now();
    
    const { error, output } = await model.run([
      { role: "user", content: "Hello, how are you?" }
    ]);
    
    const endTime = Date.now();
    
    if (error) {
      console.error('❌ Error:', error);
      return false;
    }
    
    console.log(`✅ Success! (${endTime - startTime}ms)`);
    console.log('📥 Response:', output);
    console.log('\n' + '='.repeat(60));
    console.log('✅ Bytez.js is working correctly!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ Bytez.js test failed');
    return false;
  }
}

testBytez();
