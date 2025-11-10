import { OpenAI } from "openai";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// A4F API configuration with working models
const A4F_API_KEY = process.env.A4F_API_KEY || "ddc-a4f-73b259b67d954d5087f48319b7673747";
const A4F_BASE_URL = process.env.A4F_BASE_URL || "https://api.a4f.co/v1";

// Text generation models with fallback chain (ordered by speed - fastest first!)
const TEXT_MODELS = [      
  "provider-5/gpt-4o-mini",                // 1st Primary: DeepSeek R1 (1034ms ⚡ fastest!)
  "provider-6/gemma-3-27b-instruct",       // Backup 1: Gemma 3 (1302ms)
  "provider-5/deepseek-r1-0528-qwen3-8b",  // 2nd Primary: DeepSeek R1 (1034ms ⚡ fastest!)
  "provider-5/nova-micro-v1",              // Backup 2: Nova Micro (1746ms)
  "provider-5/gemini-2.0-flash-lite-001",  // Backup 3: Gemini Flash Lite (1973ms)
];

// Image generation models with fallback chain
const IMAGE_MODELS = [
  "provider-4/imagen-3",      // Primary: Google Imagen 3 (best quality)
  "provider-4/imagen-4",      // Backup 1: Google Imagen 4
  "provider-5/dall-e-2",      // Backup 2: DALL-E 2
  "provider-4/flux-schnell",     // Backup 3: Stable Diffusion XL Lite
];

// Log configuration for debugging
console.log("[SuperAI] Configuration:");
console.log(`[SuperAI] A4F_API_KEY: ${A4F_API_KEY ? "Set (hidden for security)" : "Not set"}`);
console.log(`[SuperAI] A4F_BASE_URL: ${A4F_BASE_URL}`);
console.log(`[SuperAI] TEXT_MODELS: ${TEXT_MODELS.join(", ")}`);
console.log(`[SuperAI] IMAGE_MODELS: ${IMAGE_MODELS.join(", ")}`);

// Initialize the OpenAI client with A4F configuration
const client = new OpenAI({
  apiKey: A4F_API_KEY,
  baseURL: A4F_BASE_URL,
});

// Chat history type
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Store chat histories for different users
const chatHistories = new Map<number, ChatMessage[]>();

// Rate limiting: Track API calls per user
const userApiCalls = new Map<number, { count: number; resetTime: number }>();
const MAX_CALLS_PER_MINUTE = 10; // Limit to 10 calls per minute per user

// Initialize a chat history for a user if it doesn't exist
function ensureChatHistory(userId: number): void {
  if (!chatHistories.has(userId)) {
    chatHistories.set(userId, [
      {
        role: "system",
        content: "You are Super AI, a helpful assistant in the Schat messaging app. You're designed to be friendly, helpful, and knowledgeable. Respond concisely and conversationally, like in a chat app. Avoid overly long responses. If you don't know something, be honest about it. You can help with information, answer questions, provide suggestions, and engage in casual conversation."
      }
    ]);
  }
}

// Check rate limiting for a user
function checkRateLimit(userId: number): boolean {
  const now = Date.now();
  const userCalls = userApiCalls.get(userId);
  
  if (!userCalls || now > userCalls.resetTime) {
    // Reset or initialize rate limiting
    userApiCalls.set(userId, {
      count: 1,
      resetTime: now + 60000 // 1 minute from now
    });
    return true;
  }
  
  if (userCalls.count >= MAX_CALLS_PER_MINUTE) {
    return false; // Rate limit exceeded
  }
  
  userCalls.count++;
  return true;
}

// Generate an image from text prompt using A4F API
export async function generateImage(userId: number, prompt: string): Promise<string> {
  try {
    console.log(`[SuperAI Image] Generating image for user ${userId} with prompt: "${prompt}"`);
    
    // Validate prompt
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Empty prompt provided");
    }
    
    if (prompt.length > 500) {
      throw new Error("Prompt too long. Please keep it under 500 characters.");
    }
    
    // Check rate limiting
    if (!checkRateLimit(userId)) {
      throw new Error("Rate limit exceeded. Please wait a moment before generating another image.");
    }
    
    // Try each image model in sequence until one succeeds
    const startTime = Date.now();
    let lastError: any = null;
    
    for (let i = 0; i < IMAGE_MODELS.length; i++) {
      const model = IMAGE_MODELS[i];
      
      try {
        console.log(`[SuperAI Image] Attempt ${i + 1}/${IMAGE_MODELS.length}: Using model ${model}`);
        
        const response = await client.images.generate({
          model: model,
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        });
        
        const endTime = Date.now();
        console.log(`[SuperAI Image] ✅ Image generated in ${endTime - startTime}ms with model ${model}`);
        
        if (!response || !response.data || !response.data[0] || !response.data[0].url) {
          console.error(`[SuperAI Image] Invalid response structure from model ${model}:`, response);
          lastError = new Error(`Invalid response from model ${model}`);
          continue; // Try next model
        }
        
        const imageUrl = response.data[0].url;
        console.log(`[SuperAI Image] Image URL: ${imageUrl}`);
        
        // Log successful image generation
        console.log(`[SuperAI Image] Success Metrics:`, {
          userId,
          modelUsed: model,
          attemptNumber: i + 1,
          responseTime: endTime - startTime,
          promptLength: prompt.length,
          timestamp: new Date().toISOString()
        });
        
        return imageUrl;
        
      } catch (error: any) {
        console.error(`[SuperAI Image] ❌ Model ${model} failed:`, error.message);
        console.error(`[SuperAI Image] Error details:`, {
          message: error.message,
          code: error.code,
          status: error.status,
          type: error.type,
        });
        lastError = error;
        
        // If this is not the last model, continue to next one
        if (i < IMAGE_MODELS.length - 1) {
          console.log(`[SuperAI Image] Trying next backup model...`);
          continue;
        }
      }
    }
    
    // If we get here, all models failed
    console.error(`[SuperAI Image] ❌ All ${IMAGE_MODELS.length} models failed`);
    throw new Error("Failed to generate image with all available models");
    
  } catch (error: any) {
    console.error("[SuperAI Image] Error generating image:", error);
    throw error;
  }
}

// Get a response from the AI
export async function getSuperAIResponse(userId: number, message: string): Promise<string> {
  try {
    console.log(`[SuperAI] Getting response for user ${userId} with message: "${message.substring(0, 30)}..."`);
    
    // Check if API key is configured
    if (!A4F_API_KEY) {
      console.error("[SuperAI] A4F API key is not configured");
      console.error("[SuperAI] Please set A4F_API_KEY environment variable");
      return "I'm unable to respond right now. The AI service is not properly configured. Please contact the administrator.";
    }
    
    // Log API configuration for debugging (without exposing full key)
    console.log(`[SuperAI] API Key present: ${A4F_API_KEY ? 'Yes' : 'No'}`);
    console.log(`[SuperAI] API Key length: ${A4F_API_KEY?.length || 0}`);
    console.log(`[SuperAI] Base URL: ${A4F_BASE_URL}`);
    
    // Check for /create command for image generation
    if (message.trim().toLowerCase().startsWith('/create')) {
      const prompt = message.substring(7).trim();
      
      if (!prompt) {
        return "Please provide a description of the image you want me to create. For example: `/create a beautiful sunset over mountains`";
      }
      
      console.log(`[SuperAI] Image generation requested with prompt: "${prompt}"`);
      return `IMAGE_GENERATION:${prompt}`;
    }
    
    // Check rate limiting
    if (!checkRateLimit(userId)) {
      console.warn(`[SuperAI] Rate limit exceeded for user ${userId}`);
      return "I'm receiving too many requests right now. Please wait a moment before sending another message.";
    }
    
    // Validate input
    if (!message || message.trim().length === 0) {
      console.warn(`[SuperAI] Empty message received from user ${userId}`);
      return "I didn't receive any message. Please try sending your message again.";
    }
    
    // Check message length
    if (message.length > 1000) {
      console.warn(`[SuperAI] Message too long from user ${userId}: ${message.length} characters`);
      return "Your message is too long. Please keep it under 1000 characters.";
    }
    
    ensureChatHistory(userId);
    const history = chatHistories.get(userId)!;
    
    // Add user message to history
    history.push({ role: "user", content: message });
    console.log(`[SuperAI] Added user message to history. History length: ${history.length}`);
    
    // Keep history at a reasonable size (last 20 messages)
    const recentHistory = history.length <= 20 
      ? history 
      : [history[0], ...history.slice(history.length - 19)];
    
    console.log(`[SuperAI] Sending request to A4F API for user ${userId}`);
    console.log(`[SuperAI] Attempting with ${TEXT_MODELS.length} models (fastest first)`);
    
    // Try each text model in sequence until one succeeds
    const startTime = Date.now();
    let lastError: any = null;
    
    for (let i = 0; i < TEXT_MODELS.length; i++) {
      const model = TEXT_MODELS[i];
      
      try {
        console.log(`[SuperAI Text] Attempt ${i + 1}/${TEXT_MODELS.length}: Using model ${model}`);
        console.log(`[SuperAI Text] Starting API call at ${new Date().toISOString()}`);
        
        const completion = await client.chat.completions.create({
          model: model,
          messages: recentHistory,
          max_tokens: 500,
          temperature: 0.7,
        });
        
        const endTime = Date.now();
        console.log(`[SuperAI Text] ✅ Response received in ${endTime - startTime}ms with model ${model}`);
        
        if (!completion || !completion.choices || !completion.choices[0] || !completion.choices[0].message) {
          console.error(`[SuperAI Text] Invalid response structure from model ${model}:`, completion);
          lastError = new Error(`Invalid response from model ${model}`);
          continue; // Try next model
        }
        
        const aiResponse = completion.choices[0].message.content || "Sorry, I couldn't generate a response.";
        
        // Validate AI response
        let finalResponse = aiResponse;
        if (finalResponse.length > 2000) {
          console.warn(`[SuperAI Text] Response too long: ${finalResponse.length} characters, truncating`);
          finalResponse = finalResponse.substring(0, 2000) + "...";
        }
        
        // Add AI response to history
        history.push({ role: "assistant", content: finalResponse });
        
        console.log(`[SuperAI Text] Response preview: "${finalResponse.substring(0, 50)}..."`);
        console.log(`[SuperAI Text] Updated history length: ${history.length}`);
        
        // Log successful API call for monitoring
        console.log(`[SuperAI Text] Success Metrics:`, {
          userId,
          modelUsed: model,
          attemptNumber: i + 1,
          responseTime: endTime - startTime,
          messageLength: message.length,
          responseLength: finalResponse.length,
          timestamp: new Date().toISOString()
        });
        
        return finalResponse;
        
      } catch (error: any) {
        console.error(`[SuperAI Text] ❌ Model ${model} failed:`, error.message);
        console.error(`[SuperAI Text] Error details:`, {
          message: error.message,
          code: error.code,
          status: error.status,
          type: error.type,
        });
        lastError = error;
        
        // If this is not the last model, continue to next one
        if (i < TEXT_MODELS.length - 1) {
          console.log(`[SuperAI Text] Trying next backup model...`);
          continue;
        }
      }
    }
    
    // If we get here, all models failed
    console.error(`[SuperAI Text] ❌ All ${TEXT_MODELS.length} models failed`);
    
    // Return more specific error message based on error type
    if (lastError?.code === 'insufficient_quota' || lastError?.message?.includes('quota')) {
      return "I've reached my usage limit. Please try again later or contact support.";
    } else if (lastError?.code === 'invalid_api_key' || lastError?.status === 401) {
      return "There's an authentication issue with my AI service. Please contact the administrator.";
    } else if (lastError?.status === 429) {
      return "I'm receiving too many requests. Please wait a moment and try again.";
    } else {
      return "I'm having trouble processing your request right now. Please try again later.";
    }
  } catch (error) {
    console.error("[SuperAI] Error getting AI response:", error);
    return "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
}

// Clear chat history for a user
export function clearChatHistory(userId: number): void {
  const systemMessage = chatHistories.get(userId)?.[0];
  if (systemMessage) {
    chatHistories.set(userId, [systemMessage]);
  } else {
    chatHistories.delete(userId);
  }
  
  // Also clear rate limiting for this user
  userApiCalls.delete(userId);
  
  console.log(`[SuperAI] Cleared chat history and rate limiting for user ${userId}`);
}

// Get rate limiting stats for monitoring
export function getRateLimitStats(): { [userId: number]: { count: number; resetTime: number } } {
  const stats: { [userId: number]: { count: number; resetTime: number } } = {};
  Array.from(userApiCalls.entries()).forEach(([userId, data]) => {
    stats[userId] = { ...data };
  });
  return stats;
} 