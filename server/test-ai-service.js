// test-ai-service.js
// Script to test the AI service with Gemini

import dotenv from 'dotenv';
dotenv.config();
import { processWithAI } from './src/services/aiService.js';

async function main() {
  console.log('Testing AI Service with Gemini...');
  
  const testText = `
  Artificial Intelligence (AI) is a branch of computer science that aims to create software or machines that exhibit human-like intelligence. This can include learning from experience, understanding natural language, solving problems, and recognizing patterns. AI can be categorized into two main types: narrow or weak AI, which is designed for specific tasks like voice recognition or image processing, and general or strong AI, which would have the ability to understand, learn, and apply knowledge across a wide range of tasks at a human level.
  
  Machine learning is a subset of AI that focuses on algorithms and statistical models that enable computers to improve their performance on a task through experience. Deep learning, a further subset, uses neural networks with multiple layers to analyze various factors of data.
  
  Applications of AI are widespread and include virtual assistants like Siri and Alexa, recommendation systems on platforms like Netflix and Amazon, autonomous vehicles, and medical diagnosis tools. As AI technology continues to evolve, it holds the potential to revolutionize industries and improve efficiency in various sectors.
  `;
  
  const testContext = {
    module: "Introduction to AI",
    subject: "Computer Science",
    branch: "Computer Science Engineering",
    semester: "6",
    provider: "gemini"
  };
  
  const testInstruction = "Create a comprehensive study material for this AI introduction with summaries, key points, and flashcards";
  
  try {
    console.log('Processing with AI service...');
    const result = await processWithAI(testText, testContext, testInstruction);
    
    console.log('✅ AI processing completed successfully!');
    console.log('Provider:', result.provider);
    console.log('Summary length:', result.summary.length);
    console.log('Key points count:', result.keyPoints.length);
    console.log('Concepts count:', result.concepts.length);
    console.log('Flashcards count:', result.flashcards.length);
    
    console.log('\n--- SUMMARY ---');
    console.log(result.summary.substring(0, 300) + '...');
    
    console.log('\n--- KEY POINTS ---');
    result.keyPoints.forEach((point, i) => {
      console.log(`${i + 1}. ${point}`);
    });
    
  } catch (error) {
    console.error('❌ AI processing failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

main();