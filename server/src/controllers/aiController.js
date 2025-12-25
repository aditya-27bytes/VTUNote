import axios from "axios";

// Helper function to chunk large text into smaller pieces
function chunkText(text, maxChunkSize = 50000) {
  const chunks = [];
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    let endIndex = Math.min(currentIndex + maxChunkSize, text.length);
    
    // Try to break at a sentence or paragraph boundary
    if (endIndex < text.length) {
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > currentIndex + maxChunkSize * 0.7) {
        endIndex = breakPoint + 1;
      }
    }
    
    chunks.push(text.substring(currentIndex, endIndex).trim());
    currentIndex = endIndex;
  }
  
  return chunks;
}

// Map provider ids to generic model labels for responses/UI
function mapProviderToModelLabel(provider) {
  switch (provider) {
    case 'perplexity': return 'Model 1';
    case 'openai': return 'Model 2';
    case 'gemini': return 'Model 3';
    case 'huggingface': return 'Model 4';
    default: return 'Model';
  }
}

// Helper function to combine analysis results from multiple chunks
function combineAnalysisResults(results) {
  const combined = {
    summary: '',
    keyPoints: [],
    concepts: [],
    flashcards: []
  };
  
  // Combine summaries
  combined.summary = results.map((r, i) => `**Section ${i + 1}:**\n${r.summary}`).join('\n\n');
  
  // Combine and deduplicate key points
  const allKeyPoints = results.flatMap(r => r.keyPoints || []);
  combined.keyPoints = [...new Set(allKeyPoints)].slice(0, 20); // Limit to top 20
  
  // Combine and deduplicate concepts
  const conceptMap = new Map();
  results.forEach(r => {
    (r.concepts || []).forEach(concept => {
      if (!conceptMap.has(concept.term)) {
        conceptMap.set(concept.term, concept);
      }
    });
  });
  combined.concepts = Array.from(conceptMap.values()).slice(0, 15); // Limit to top 15
  
  // Combine flashcards and ensure variety
  const allFlashcards = results.flatMap(r => r.flashcards || []);
  const difficulties = ['easy', 'medium', 'hard'];
  const flashcardsByDifficulty = {};
  
  difficulties.forEach(diff => {
    flashcardsByDifficulty[diff] = allFlashcards.filter(f => f.difficulty === diff);
  });
  
  // Select balanced mix of flashcards
  combined.flashcards = [];
  for (let i = 0; i < 15; i++) {
    const difficulty = difficulties[i % 3];
    if (flashcardsByDifficulty[difficulty].length > Math.floor(i / 3)) {
      combined.flashcards.push(flashcardsByDifficulty[difficulty][Math.floor(i / 3)]);
    }
  }
  
  return combined;
}

// Helper function to process a single chunk
async function processSingleChunk(text, context) {
  const prompt = createVTUPrompt(text, context);
  
  console.log(`🔑 Making Perplexity API call for chunk...`);
  console.log(`📋 Prompt length: ${prompt.length} characters`);
  
  try {
    const r = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: process.env.PERPLEXITY_MODEL || "sonar",
        messages: [
          { role: "system", content: "You are a VTU (Visvesvaraya Technological University) educational specialist. Create comprehensive study materials following VTU curriculum standards." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      },
      { 
        headers: { 
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // Increased to 60 seconds
      }
    );
    
    console.log(`✅ Perplexity API response status: ${r.status}`);
    
    const content = r.data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("❌ No content in Perplexity response:", r.data);
      throw new Error("No content received from Perplexity API");
    }
    
    return content;
    
  } catch (error) {
    console.error("❌ Perplexity API error:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
}

// Q&A specific providers - returns formatted text, not JSON
const qaProviders = {
  openai: async (text, question, context = {}) => {
  // Use a concise Q&A prompt for Gemini
  const prompt = `Answer the following question using the uploaded document below as your main source. If the document does not contain enough information, you may use external knowledge to provide a complete and helpful answer.\n\nDocument:\n${text}\n\nQuestion: ${question}\n\nIf the answer requires detail, provide a detailed explanation. Otherwise, keep it concise. Always indicate if the answer is based on the document or external knowledge.`;
    const r = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a VTU-specialized educational assistant. Provide clear, structured answers to student questions based on document content." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );
    return r.data.choices?.[0]?.message?.content || "";
  },

  gemini: async (text, question, context = {}) => {
  // Use a concise Q&A prompt for Perplexity
  const prompt = `Answer the following question using the uploaded document below as your main source. If the document does not contain enough information, you may use external knowledge to provide a complete and helpful answer.\n\nDocument:\n${text}\n\nQuestion: ${question}\n\nIf the answer requires detail, provide a detailed explanation. Otherwise, keep it concise. Always indicate if the answer is based on the document or external knowledge.`;
    
    // Check if using OpenRouter API key (starts with sk-or-v1)
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.startsWith('sk-or-v1')) {
      // Use OpenRouter for Gemini models
      console.log('🔄 Using OpenRouter for Gemini Q&A...');
      
      const geminiModels = [
        'google/gemini-flash-1.5',
        'google/gemini-pro-1.5', 
        'google/gemini-1.5-flash',
        'google/gemini-1.5-pro',
        'openai/gpt-4o-mini'
      ];
      
      let lastError;
      for (const model of geminiModels) {
        try {
          console.log(`🧪 Trying OpenRouter model for Q&A: ${model}`);
          const r = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              model: model,
              messages: [
                { role: 'system', content: 'You are a VTU-specialized educational assistant. Provide clear, structured answers to student questions based on document content.' },
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
          console.log(`✅ Successfully used model for Q&A: ${model}`);
          return r.data.choices?.[0]?.message?.content || "";
        } catch (error) {
          console.log(`⚠️ Q&A Model ${model} failed: ${error.message}`);
          lastError = error;
          continue;
        }
      }
      
      throw lastError || new Error('All Gemini models failed on OpenRouter for Q&A');
    } else {
      // Use direct Google Gemini API
      const r = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        { contents: [{ parts: [{ text: prompt }] }] }
      );
      return r.data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "";
    }
  },

  perplexity: async (text, question, context = {}) => {
    // Use a detailed Q&A prompt for Perplexity (allow full answer)
    const prompt = `Answer the following question using the uploaded document below as your main source. If the document does not contain enough information, you may use external knowledge to provide a complete and helpful answer.\n\nDocument:\n${text}\n\nQuestion: ${question}\n\nIf the answer requires detail, provide a detailed explanation. Otherwise, keep it concise. Always indicate if the answer is based on the document or external knowledge.`;
    
    console.log(`🔑 Making Perplexity Q&A API call...`);
    console.log(`📋 Q&A Prompt length: ${prompt.length} characters`);
    
    try {
      const r = await axios.post(
        "https://api.perplexity.ai/chat/completions",
        {
          model: process.env.PERPLEXITY_MODEL || "sonar",
          messages: [
            { role: "system", content: "You are a VTU (Visvesvaraya Technological University) educational specialist. Provide clear, structured answers to student questions based on document content." },
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
      
      console.log(`✅ Perplexity Q&A API response status: ${r.status}`);
      
      const content = r.data.choices?.[0]?.message?.content;
      if (!content) {
        console.error("❌ No content in Perplexity Q&A response:", r.data);
        throw new Error("No content received from Perplexity API");
      }
      
      return content;
      
    } catch (error) {
      console.error("❌ Perplexity Q&A API error:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  },

  huggingface: async (text, question, context = {}) => {
    const prompt = createQAPrompt(text, question, context);
    const r = await axios.post(
      `https://api-inference.huggingface.co/models/${process.env.HF_MODEL || "facebook/bart-large-cnn"}`,
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
    );
    const out = Array.isArray(r.data) ? r.data[0]?.summary_text : r.data?.summary_text;
    return out || "Unable to generate answer with Hugging Face model.";
  }
};

// Helper function to create Q&A-specific prompts
function createQAPrompt(text, question, context) {
  const { module, subject, branch, semester, university = "VTU" } = context;
  
  return `
You are an expert educational assistant specializing in ${university} curriculum.
Based on the following document content, provide a comprehensive and accurate answer to the student's question.

Document Content:
"""${text}"""

Student Question: ${question}

Provide your answer in the following structured format:

**${question.split(' ').slice(0, 3).join(' ')}**

[Brief introductory sentence directly answering the question]

## Key Concepts:

**What it does:**
- [Key point 1 directly related to the question]
- [Key point 2 with specific information from document]
- [Key point 3 with VTU-relevant details]

**Core Components/Features:**
- [Important aspect 1 from the document]
- [Important aspect 2 with specific details]
- [Important aspect 3 with examples if available]

## Applications:

- **[Application 1]** - [Brief description from document]
- **[Application 2]** - [Brief description with VTU context]
- **[Application 3]** - [Brief description with practical relevance]
- **[Application 4]** - [Brief description if applicable]
- **[Application 5]** - [Brief description if applicable]

## Technical Details:

**[Technical Aspect 1]:**
[Detailed explanation from document]

**[Technical Aspect 2] (if applicable):**
[Detailed explanation with formulas/definitions if present]

## Why It's Important:

[Concluding paragraph explaining the significance and relevance to VTU studies, practical applications, and why students should understand this topic]

Ensure all content:
- Directly addresses the student's question
- Uses only information from the provided document
- Is structured for VTU examination preparation
- Includes specific examples and details from the text
- Maintains academic accuracy and clarity`;
}

// Original providers for comprehensive analysis (keep existing functionality)
const providers = {
  openai: async (text, context = {}) => {
    const prompt = createVTUPrompt(text, context);
    const r = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a VTU-specialized educational assistant. Create comprehensive study materials with structured summaries, flashcards, and key concepts." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );
    return r.data.choices?.[0]?.message?.content || "";
  },

  gemini: async (text, context = {}) => {
    const prompt = createVTUPrompt(text, context);
    
    // Check if using OpenRouter API key (starts with sk-or-v1)
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.startsWith('sk-or-v1')) {
      // Use OpenRouter for Gemini models
      console.log('🔄 Using OpenRouter for Gemini model...');
      
      // Try multiple Gemini model variants available on OpenRouter
      const geminiModels = [
        'google/gemini-flash-1.5',
        'google/gemini-pro-1.5', 
        'google/gemini-1.5-flash',
        'google/gemini-1.5-pro',
        'openai/gpt-4o-mini' // Fallback to a reliable model
      ];
      
      let lastError;
      for (const model of geminiModels) {
        try {
          console.log(`🧪 Trying OpenRouter model: ${model}`);
          const r = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              model: model,
              messages: [
                { role: 'system', content: 'You are a VTU-specialized educational assistant. Create comprehensive study materials with structured summaries, flashcards, and key concepts.' },
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
          console.log(`✅ Successfully used model: ${model}`);
          return r.data.choices?.[0]?.message?.content || "";
        } catch (error) {
          console.log(`⚠️ Model ${model} failed: ${error.message}`);
          lastError = error;
          continue;
        }
      }
      
      // If all Gemini models fail, throw the last error
      throw lastError || new Error('All Gemini models failed on OpenRouter');
    } else {
      // Use direct Google Gemini API
      const r = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        { contents: [{ parts: [{ text: prompt }] }] }
      );
      return r.data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "";
    }
  },

  perplexity: async (text, context = {}) => {
    // Check if text is too large and needs chunking
    const maxTextSize = 100000; // 100k characters
    
    if (text.length <= maxTextSize) {
      // Process normally for smaller texts
      return await processSingleChunk(text, context);
    } else {
      // Process in chunks for large texts
      console.log(`📊 Large text detected (${text.length} chars), processing in chunks...`);
      const chunks = chunkText(text, maxTextSize);
      console.log(`📦 Split into ${chunks.length} chunks`);
      
      const chunkResults = [];
      
      for (let i = 0; i < chunks.length; i++) {
        console.log(`🔄 Processing chunk ${i + 1}/${chunks.length}...`);
        try {
          const chunkResult = await processSingleChunk(chunks[i], {
            ...context,
            chunkInfo: `Part ${i + 1} of ${chunks.length}`
          });
          chunkResults.push(parseAIResponse(chunkResult));
          
          // Add delay between chunks to avoid rate limiting
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          console.warn(`⚠️ Chunk ${i + 1} failed, continuing with others:`, error.message);
        }
      }
      
      if (chunkResults.length === 0) {
        throw new Error('All chunks failed to process');
      }
      
      console.log(`✅ Successfully processed ${chunkResults.length}/${chunks.length} chunks`);
      const combinedResult = combineAnalysisResults(chunkResults);
      
      // Return as formatted JSON string
      return JSON.stringify(combinedResult, null, 2);
    }
  },

  huggingface: async (text, context = {}) => {
    const prompt = createVTUPrompt(text, context);
    const r = await axios.post(
      `https://api-inference.huggingface.co/models/${process.env.HF_MODEL || "facebook/bart-large-cnn"}`,
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
    );
    const out = Array.isArray(r.data) ? r.data[0]?.summary_text : r.data?.summary_text;
    return out || JSON.stringify(r.data);
  }
};

function createVTUPrompt(text, context) {
  const { module, subject, branch, semester, university = "VTU", chunkInfo } = context;
  
  const chunkPrefix = chunkInfo ? `[${chunkInfo}] ` : '';
  
  return `
${chunkPrefix}As a ${university} educational specialist, analyze the following text for ${subject} ${module ? `- ${module}` : ''} 
${branch ? `(${branch}` : ''}${semester ? ` - Semester ${semester}` : ''}${branch ? ')' : ''}.

Text to analyze:
"""${text}"""

Provide a comprehensive analysis in the following JSON format:
{
  "summary": "A detailed VTU-aligned summary with bullet points, covering all important concepts, theories, and applications. Include module-specific learning outcomes.",
  "keyPoints": [
    "Key point 1 - focus on VTU exam relevance",
    "Key point 2 - include formulas/definitions if applicable",
    "Key point 3 - mention practical applications"
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

Ensure all content is:
- Aligned with VTU curriculum standards
- Suitable for ${semester ? `semester ${semester}` : 'undergraduate'} level
- Includes practical applications and real-world relevance
- Contains at least 5-10 flashcards covering different difficulty levels
- Covers all major concepts from the provided text
`;
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
  return {
    summary: rawResponse,
    keyPoints: [],
    concepts: [],
    flashcards: []
  };
}

export const summarize = async (req, res) => {
  try {
    const { text, provider = "perplexity" } = req.body || {};
    if (!text) return res.status(400).json({ error: "text is required" });
    if (!providers[provider]) return res.status(400).json({ error: "Unsupported provider" });

    const result = await providers[provider](text);
    res.json({ provider: mapProviderToModelLabel(provider), result });
  } catch (e) {
    console.error("Summarize error:", e);
    res.status(500).json({ error: e.response?.data || e.message });
  }
};

export const comprehensiveAnalysis = async (req, res) => {
  try {
    const { text, provider = "perplexity", context = {} } = req.body || {};
    
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }
    
    if (!providers[provider]) {
      return res.status(400).json({ error: "Unsupported provider" });
    }

    console.log(`🤖 Starting comprehensive analysis with ${provider}...`);
    console.log(`📋 Context:`, context);
    console.log(`📄 Text length: ${text.length} characters`);
    
    // Verify API key for the selected provider
    const apiKeyMap = {
      perplexity: process.env.PERPLEXITY_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      huggingface: process.env.HF_API_KEY
    };
    
    const apiKey = apiKeyMap[provider];
    if (!apiKey) {
      console.error(`❌ Missing API key for provider: ${provider}`);
      return res.status(500).json({ 
        error: `API key not configured for provider: ${provider}`,
        details: "Please check environment variables"
      });
    }
    
    console.log(`🔑 API key found for ${provider}: ${apiKey.substring(0, 15)}...`);
    
    // Validate API key format
    const keyValidation = {
      perplexity: apiKey => apiKey.startsWith('pplx-'),
      openai: apiKey => apiKey.startsWith('sk-'),
      gemini: apiKey => apiKey.startsWith('AIza') || apiKey.startsWith('sk-or-v1'),
      huggingface: apiKey => apiKey.startsWith('hf_')
    };
    
    if (keyValidation[provider] && !keyValidation[provider](apiKey)) {
      console.error(`❌ Invalid API key format for ${provider}. Expected format check failed.`);
      return res.status(500).json({ 
        error: `Invalid API key format for ${provider}`,
        details: `Please check your ${provider.toUpperCase()}_API_KEY environment variable`
      });
    }
    
    const rawResult = await providers[provider](text, context);
    console.log(`✅ Raw AI response received (${rawResult.length} characters)`);
    console.log(`📝 First 200 chars of response:`, rawResult.substring(0, 200));
    
    const parsedResult = parseAIResponse(rawResult);
    console.log(`🔍 Parsed result:`, {
      summaryLength: parsedResult.summary.length,
      keyPointsCount: parsedResult.keyPoints.length,
      conceptsCount: parsedResult.concepts.length,
      flashcardsCount: parsedResult.flashcards.length
    });
    
    res.json({
      provider: mapProviderToModelLabel(provider),
      ...parsedResult
    });
    
  } catch (e) {
    console.error(`❌ Comprehensive analysis error:`, {
      message: e.message,
      status: e.response?.status,
      statusText: e.response?.statusText,
      data: e.response?.data,
      provider: req.body?.provider || "unknown",
      stack: e.stack?.substring(0, 500)
    });
    
    // Provide more specific error messages
    let errorMessage = "Processing failed";
    let errorDetails = "Unknown error occurred";
    
    if (e.response?.status === 400) {
      if (e.response.data?.error?.message?.includes('API key')) {
        errorMessage = "Invalid API key";
        errorDetails = "The API key provided is not valid or has expired. Please check your environment variables.";
      } else {
        errorMessage = "Bad request";
        errorDetails = e.response.data?.error?.message || "Invalid request parameters";
      }
    } else if (e.response?.status === 401) {
      errorMessage = "Authentication failed";
      errorDetails = "API key authentication failed. Please verify your API key.";
    } else if (e.response?.status === 429) {
      errorMessage = "Rate limit exceeded";
      errorDetails = "Too many requests. Please try again later.";
    } else if (e.response?.status >= 500) {
      errorMessage = "Service unavailable";
      errorDetails = "The AI service is temporarily unavailable. Please try again later.";
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      provider: req.body?.provider || "unknown",
      statusCode: e.response?.status
    });
  }
};

// Q&A endpoint for asking questions about documents
export const questionAnswer = async (req, res) => {
  try {
    console.log(`🔍 Q&A Request received:`);
    console.log(`📋 Request body:`, JSON.stringify(req.body, null, 2));
    
    const { question, context, provider = "perplexity" } = req.body || {};
    
    console.log(`❓ Question: "${question}"`);
    console.log(`📄 Context keys:`, context ? Object.keys(context) : 'No context');
    console.log(`📊 Context fullText length:`, context?.fullText?.length || 'N/A');
    
    if (!question) {
      console.log(`❌ Missing question`);
      return res.status(400).json({ error: "question is required" });
    }
    
    if (!context || !context.fullText) {
      console.log(`❌ Missing context or fullText. Context:`, !!context, 'FullText:', !!context?.fullText);
      return res.status(400).json({ error: "document context is required" });
    }
    
    console.log(`💬 Processing Q&A with provider (anonymized)`);
    console.log(`❓ Question: ${question}`);
    console.log(`📄 Context length: ${context.fullText.length} characters`);
    
    if (!qaProviders[provider]) {
      console.log(`❌ Unsupported Q&A provider: ${provider}`);
      return res.status(400).json({ error: "Unsupported provider" });
    }
    
    console.log(`📋 Sending Q&A request to provider (anonymized)...`);
    const answer = await qaProviders[provider](context.fullText, question, context);
    
    console.log(`✅ Q&A response received (${answer.length} characters)`);
    console.log(`📝 Answer preview:`, answer.substring(0, 200) + '...');
    
    res.json({
      question,
      answer,
      provider: mapProviderToModelLabel(provider),
      contextLength: context.fullText.length
    });
    
  } catch (error) {
    console.error(`❌ Q&A error:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack?.substring(0, 500)
    });
    
    res.status(500).json({ 
      error: error.response?.data || error.message,
      details: error.response?.status ? `HTTP ${error.response.status}: ${error.response.statusText}` : "Network/Processing error",
      provider: req.body?.provider || "unknown"
    });
  }
};