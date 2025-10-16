// test-gemini-connection.js
// Script to test Gemini API connection

import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

console.log('Testing Gemini API Connection...');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Found' : '❌ NOT FOUND');

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in .env file');
  process.exit(1);
}

const API_KEY = process.env.GEMINI_API_KEY;
const TEST_PROMPT = "Explain what artificial intelligence is in simple terms.";

async function testDirectGeminiAPI() {
  console.log('\nTesting Direct Google Gemini API...');
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        contents: [{
          parts: [{
            text: TEST_PROMPT
          }]
        }]
      },
      {
        timeout: 30000
      }
    );
    
    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (content) {
      console.log('✅ Direct Google Gemini API test successful!');
      console.log('Response preview:', content.substring(0, 100) + '...');
      return true;
    } else {
      console.error('❌ No content in response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Direct Google Gemini API test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function testOpenRouterGeminiAPI() {
  console.log('\nTesting OpenRouter Gemini API...');
  
  // Try multiple models that are commonly available
  const models = [
    'google/gemini-flash-1.5-8b',
    'google/gemini-flash-1.5',
    'google/gemini-pro-1.5',
    'openai/gpt-3.5-turbo',
    'meta-llama/llama-3-8b-instruct'
  ];
  
  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [
            { 
              role: 'system', 
              content: 'You are a helpful educational assistant.' 
            },
            { 
              role: 'user', 
              content: TEST_PROMPT 
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        },
        { 
          headers: { 
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      const content = response.data.choices?.[0]?.message?.content;
      if (content) {
        console.log(`✅ OpenRouter Gemini API test successful with model: ${model}!`);
        console.log('Response preview:', content.substring(0, 100) + '...');
        return true;
      }
    } catch (error) {
      console.log(`Model ${model} failed:`, error.message);
      if (error.response && error.response.status === 404) {
        console.log(`Model ${model} not found, trying next model...`);
        continue;
      } else {
        console.error(`❌ OpenRouter Gemini API test failed with model ${model}:`, error.message);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        // Try next model
        continue;
      }
    }
  }
  
  console.error('❌ All models failed on OpenRouter');
  return false;
}

async function main() {
  console.log('🔑 GEMINI_API_KEY format:', API_KEY.substring(0, 15) + '...');
  
  // Determine which API to test based on key format
  if (API_KEY.startsWith('sk-or-v1')) {
    console.log('🔑 Detected OpenRouter API key');
    await testOpenRouterGeminiAPI();
  } else if (API_KEY.startsWith('AIza')) {
    console.log('🔑 Detected Direct Google Gemini API key');
    await testDirectGeminiAPI();
  } else {
    console.error('❌ Invalid GEMINI_API_KEY format');
    console.log('Expected formats:');
    console.log('- Direct Google Gemini: AIza...');
    console.log('- OpenRouter: sk-or-v1-...');
    process.exit(1);
  }
}

main();