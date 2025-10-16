// Test script for AI summarization functionality
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './server/.env' });

const API_BASE_URL = 'http://localhost:5000/api';

async function testAISummarization() {
  console.log('🧪 Testing AI Summarization Fix...\n');
  
  // Check if API keys are available
  console.log('🔑 Checking API Keys:');
  console.log('- PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? '✅ Available' : '❌ Missing');
  console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Available' : '❌ Missing');
  console.log('- GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Available' : '❌ Missing');
  console.log('');

  try {
    // Step 1: Register a teacher
    console.log('1️⃣ Registering a test teacher...');
    const teacherData = {
      name: 'Prof. AI Tester',
      email: `aiteacher${Date.now()}@test.com`,
      password: 'testpass123',
      employeeId: `AI${Date.now()}`,
      department: 'Computer Science',
      designation: 'Professor',
      qualification: 'PhD',
      experience: 8,
      phone: '9876543210',
      college: 'Test University',
      subjects: ['Data Structures', 'AI & ML'],
      bio: 'AI testing professor'
    };
    
    const registerResponse = await axios.post(`${API_BASE_URL}/teachers/register`, teacherData);
    console.log('✅ Teacher registered successfully');
    
    const token = registerResponse.data.token;
    
    // Step 2: Test AI-enhanced note creation
    console.log('\n2️⃣ Creating note with AI summarization...');
    
    const noteWithAI = {
      title: 'Data Structures Fundamentals',
      content: `
      Data structures are fundamental concepts in computer science that define how data is organized, stored, and manipulated in memory. Understanding data structures is crucial for writing efficient algorithms and building scalable software systems.

      Arrays are the simplest data structure, storing elements in contiguous memory locations with constant-time access to elements by index. However, insertion and deletion operations can be expensive as they may require shifting elements.

      Linked Lists provide dynamic memory allocation where elements (nodes) are connected through pointers. While insertion and deletion are efficient, random access is not possible as we must traverse from the head.

      Stacks follow the Last-In-First-Out (LIFO) principle and support two main operations: push (to add) and pop (to remove). They are essential in function calls, expression evaluation, and backtracking algorithms.

      Queues implement the First-In-First-Out (FIFO) principle with enqueue and dequeue operations. They are used in breadth-first search, scheduling, and handling requests in systems.

      Trees are hierarchical data structures with nodes connected by edges. Binary trees, AVL trees, and B-trees are common variants used in databases, file systems, and search algorithms.

      Hash Tables provide average O(1) time complexity for insertion, deletion, and lookup operations through hash functions. They are widely used in databases, caching, and implementing associative arrays.
      `,
      subject: 'Data Structures',
      module: 'Module 1',
      semester: 3,
      branch: 'Computer Science',
      isPublic: false,
      useAI: true,
      aiPrompt: 'Summarize the key concepts and create study materials for VTU students'
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/teacher-notes`, noteWithAI, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Note with AI processing created successfully!');
    console.log('📝 Note ID:', createResponse.data._id);
    
    // Step 3: Fetch the note to see AI results
    console.log('\n3️⃣ Fetching note to verify AI processing...');
    
    const fetchResponse = await axios.get(`${API_BASE_URL}/teacher-notes/${createResponse.data._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const note = fetchResponse.data;
    
    console.log('📊 AI Processing Results:');
    console.log('- Provider:', note.provider || 'Not set');
    console.log('- Summary Length:', note.summary?.length || 0, 'characters');
    console.log('- Key Points Count:', note.keyPoints?.length || 0);
    console.log('- Concepts Count:', note.concepts?.length || 0);
    console.log('- Flashcards Count:', note.flashcards?.length || 0);
    
    console.log('\n📝 Summary Preview:');
    console.log(note.summary?.substring(0, 200) + '...' || 'No summary');
    
    console.log('\n🔑 Key Points:');
    note.keyPoints?.slice(0, 3).forEach((point, index) => {
      console.log(`${index + 1}. ${point}`);
    });
    
    if (note.concepts && note.concepts.length > 0) {
      console.log('\n🧠 Concepts:');
      note.concepts.slice(0, 2).forEach(concept => {
        console.log(`- ${concept.term}: ${concept.definition}`);
      });
    }
    
    if (note.flashcards && note.flashcards.length > 0) {
      console.log('\n🎯 Sample Flashcard:');
      const card = note.flashcards[0];
      console.log(`Q: ${card.question}`);
      console.log(`A: ${card.answer}`);
    }
    
    // Determine if AI processing worked correctly
    const isWorking = note.summary && 
                     note.summary.length > 50 && 
                     !note.summary.includes('AI-generated summary: Summarize') &&
                     note.keyPoints && 
                     note.keyPoints.length > 1 &&
                     !note.keyPoints.includes('Summarize');
    
    console.log('\n🎉 Test Results:');
    console.log('AI Processing Status:', isWorking ? '✅ WORKING' : '❌ STILL BROKEN');
    
    if (isWorking) {
      console.log('The AI summarization issue has been fixed! 🎊');
    } else {
      console.log('AI summarization still needs work. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAISummarization().catch(console.error);
