import axios from 'axios';

// Helper function to process text with AI for teacher notes
export async function processWithAI(text, context = {}, aiInstruction = '') {
  const { module, subject, branch, semester, provider = 'perplexity' } = context;
  
  console.log(`🤖 Starting AI processing with ${provider}...`);
  
  // Enhanced prompt that incorporates the teacher's instruction
  const prompt = `
As a VTU (Visvesvaraya Technological University) educational specialist, analyze the following text for ${subject} ${module ? `- ${module}` : ''} 
${branch ? `(${branch}` : ''}${semester ? ` - Semester ${semester}` : ''}${branch ? ')' : ''}.

Teacher's specific instruction: "${aiInstruction}"

Text to analyze:
"""${text}"""

Following the teacher's instruction, provide a comprehensive analysis in the following JSON format:
{
  "summary": "A detailed summary that addresses the teacher's specific instruction: '${aiInstruction}'. Include key concepts, theories, and applications relevant to VTU curriculum.",
  "keyPoints": [
    "Key point 1 - addressing the teacher's instruction",
    "Key point 2 - relevant to VTU exam preparation", 
    "Key point 3 - practical applications and examples",
    "Key point 4 - important formulas or definitions",
    "Key point 5 - learning outcomes and objectives"
  ],
  "concepts": [
    {
      "term": "Important Term 1",
      "definition": "Clear, concise definition",
      "explanation": "Detailed explanation with examples and VTU context"
    }
  ],
  "flashcards": [
    {
      "question": "VTU-style question covering important concept",
      "answer": "Comprehensive answer with key points",
      "explanation": "Additional context and examples for better understanding",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Ensure all content:
- Directly addresses the teacher's instruction: "${aiInstruction}"
- Is aligned with VTU curriculum standards
- Suitable for ${semester ? `semester ${semester}` : 'undergraduate'} level
- Includes practical applications and real-world relevance
- Contains at least 5-8 flashcards covering different difficulty levels
- Covers all major concepts from the provided text
`;

  try {
    let response;
    
    switch (provider) {
      case 'perplexity':
        response = await axios.post(
          "https://api.perplexity.ai/chat/completions",
          {
            model: process.env.PERPLEXITY_MODEL || "sonar",
            messages: [
              { 
                role: "system", 
                content: "You are a VTU (Visvesvaraya Technological University) educational specialist. Create comprehensive study materials following VTU curriculum standards and teacher instructions." 
              },
              { role: "user", content: prompt }
            ],
            temperature: 0.3
          },
          { 
            headers: { 
              Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        );
        break;
        
      case 'openai':
        response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
              { 
                role: "system", 
                content: "You are a VTU-specialized educational assistant. Create comprehensive study materials with structured summaries, flashcards, and key concepts based on teacher instructions." 
              },
              { role: "user", content: prompt }
            ],
            temperature: 0.3
          },
          { 
            headers: { 
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        break;
        
      case 'gemini':
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey.startsWith('sk-or-v1')) {
          // Use OpenRouter for Gemini
          response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              model: 'google/gemini-flash-1.5',
              messages: [
                { 
                  role: 'system', 
                  content: 'You are a VTU-specialized educational assistant. Create comprehensive study materials based on teacher instructions.' 
                },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3
            },
            { 
              headers: { 
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } else {
          // Use direct Google Gemini API
          response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            { contents: [{ parts: [{ text: prompt }] }] }
          );
        }
        break;
        
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
    
    console.log(`✅ AI response received from ${provider}`);
    
    // Extract content based on provider
    let content;
    if (provider === 'gemini' && !process.env.GEMINI_API_KEY?.startsWith('sk-or-v1')) {
      content = response.data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "";
    } else {
      content = response.data.choices?.[0]?.message?.content || "";
    }
    
    if (!content) {
      throw new Error("No content received from AI service");
    }
    
    // Parse the JSON response
    const result = parseAIResponse(content);
    
    console.log(`🔍 Parsed AI result:`, {
      summaryLength: result.summary.length,
      keyPointsCount: result.keyPoints.length,
      conceptsCount: result.concepts.length,
      flashcardsCount: result.flashcards.length
    });
    
    return {
      ...result,
      provider
    };
    
  } catch (error) {
    console.error(`❌ AI processing error with ${provider}:`, error.message);
    
    // Return fallback result
    return {
      summary: `AI analysis requested: ${aiInstruction}. Content processed for ${subject} ${module || ''}. Note: AI processing encountered an error - ${error.message}`,
      keyPoints: [
        aiInstruction,
        `Subject: ${subject}`,
        module ? `Module: ${module}` : '',
        `Branch: ${branch || 'General'}`,
        `Semester: ${semester || 'N/A'}`
      ].filter(Boolean),
      concepts: [],
      flashcards: [],
      provider: `${provider}_failed`
    };
  }
}

function parseAIResponse(rawResponse) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || "No summary available",
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        concepts: Array.isArray(parsed.concepts) ? parsed.concepts : [],
        flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : []
      };
    }
  } catch (error) {
    console.warn("Failed to parse structured JSON, using fallback parsing");
  }

  // Fallback: Create basic structure from raw text
  const lines = rawResponse.split('\n').filter(line => line.trim());
  const keyPoints = lines
    .filter(line => line.includes('•') || line.includes('-') || line.includes('*'))
    .slice(0, 5)
    .map(line => line.replace(/^[•\-*]\s*/, '').trim());

  return {
    summary: rawResponse.substring(0, 500) + (rawResponse.length > 500 ? '...' : ''),
    keyPoints: keyPoints.length > 0 ? keyPoints : [rawResponse.substring(0, 100)],
    concepts: [],
    flashcards: []
  };
}
