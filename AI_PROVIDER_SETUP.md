# AI Provider Setup Guide

This guide explains how to configure and use different AI providers in the AI Notes Platform.

## Default AI Provider

The platform now uses **Gemini** as the default AI provider for all AI processing tasks, as Perplexity has been experiencing timeout issues.

## Supported AI Providers

1. **Gemini** (Default) - Uses either Direct Google Gemini API or OpenRouter
2. **OpenAI** - Uses OpenAI GPT models
3. **Perplexity** - Uses Perplexity AI models (currently experiencing issues)
4. **Hugging Face** - Uses Hugging Face models

## Configuration

### 1. Gemini Setup

Gemini is the recommended provider and is configured as the default. You have two options:

#### Option A: Direct Google Gemini API
1. Get a Google AI API key from [Google AI Studio](https://aistudio.google.com/)
2. Set the key in your [.env](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.env) file:
   ```
   GEMINI_API_KEY=AIzaYourActualKeyHere
   ```

#### Option B: OpenRouter (Recommended)
1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. Set the key in your [.env](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.env) file:
   ```
   GEMINI_API_KEY=sk-or-v1-YourActualKeyHere
   ```

### 2. OpenAI Setup (Optional)
1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/)
2. Set the key in your [.env](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.env) file:
   ```
   OPENAI_API_KEY=sk-YourActualKeyHere
   ```

### 3. Perplexity Setup (Not Recommended - Currently Unstable)
1. Get a Perplexity API key from [Perplexity AI](https://www.perplexity.ai/)
2. Set the key in your [.env](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.env) file:
   ```
   PERPLEXITY_API_KEY=pplx-YourActualKeyHere
   ```

### 4. Hugging Face Setup (Optional)
1. Get a Hugging Face API key from [Hugging Face](https://huggingface.co/)
2. Set the key in your [.env](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.env) file:
   ```
   HF_API_KEY=hf_YourActualKeyHere
   ```

## Testing AI Providers

The platform includes several test scripts to verify your AI provider configuration:

### Test Gemini Connection
```bash
npm run test-gemini
```

### Test AI Service
```bash
npm run test-ai
```

## Provider Fallback Mechanism

For OpenRouter-based configurations, the system automatically tries multiple models if one fails:
1. `openai/gpt-3.5-turbo` (Primary fallback)
2. `meta-llama/llama-3-8b-instruct`
3. `google/gemini-flash-1.5-8b`
4. `google/gemini-pro-1.5`

## Troubleshooting

### Common Issues

1. **Timeout Errors with Perplexity**: Switch to Gemini as the default provider
2. **Model Not Found Errors**: The system will automatically try alternative models
3. **Invalid API Key**: Verify your API key format and validity

### Checking API Key Validity

Run the appropriate test script for your provider:
```bash
npm run test-gemini  # For Gemini/OpenRouter
```

### Changing Default Provider

To change the default provider, modify the `provider` field in the context object in:
- [teacherNoteController.js](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/src/controllers/teacherNoteController.js) (line ~75)
- [aiService.js](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/src/services/aiService.js) (line ~3)

## Best Practices

1. **Use OpenRouter**: It provides access to multiple models and better reliability
2. **Monitor Usage**: Keep track of your API usage to avoid unexpected charges
3. **Test Regularly**: Run the test scripts periodically to ensure your configuration is working
4. **Fallback Strategy**: The system automatically falls back to working models when possible

## Security

Never commit your [.env](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.env) file to version control. It's already included in [.gitignore](file:///d:/College%20Major%20Project/Final_Working_Repo/Final%20-%20Copy%20(2)/Final%20-%20Copy/ai-notes-platform/server/.gitignore).