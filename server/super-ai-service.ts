import { OpenAI } from "openai";

// A4F API configuration
// Using the API key that works with the test-gpt4o.py script
const A4F_API_KEY = "ddc-a4f-73b259b67d954d5087f48319b7673747";
const A4F_BASE_URL = "https://api.a4f.co/v1";
const SUPER_AI_MODEL = "provider-5/gpt-4o-2024-08-06"; // Using the model we determined was best

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

// Get a response from the AI
export async function getSuperAIResponse(userId: number, message: string): Promise<string> {
  try {
    console.log(`[SuperAI] Getting response for user ${userId} with message: "${message.substring(0, 30)}..."`);
    
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
    console.log(`[SuperAI] Using model: ${SUPER_AI_MODEL}`);
    
    try {
      // Get response from A4F API
      const startTime = Date.now();
      console.log(`[SuperAI] Starting API call at ${new Date().toISOString()}`);
      
      const completion = await client.chat.completions.create({
        model: SUPER_AI_MODEL,
        messages: recentHistory,
        max_tokens: 500, // Limit response length for chat
        temperature: 0.7, // Add some creativity but keep responses consistent
      });
      
      const endTime = Date.now();
      console.log(`[SuperAI] API call completed in ${endTime - startTime}ms`);
      
      if (!completion || !completion.choices || !completion.choices[0] || !completion.choices[0].message) {
        console.error("[SuperAI] Invalid response structure from API:", completion);
        throw new Error("Invalid response structure from API");
      }
      
      const aiResponse = completion.choices[0].message.content || "Sorry, I couldn't generate a response.";
      
      // Validate AI response
      let finalResponse = aiResponse;
      if (finalResponse.length > 2000) {
        console.warn(`[SuperAI] AI response too long: ${finalResponse.length} characters, truncating`);
        finalResponse = finalResponse.substring(0, 2000) + "...";
      }
      
      // Add AI response to history
      history.push({ role: "assistant", content: finalResponse });
      
      console.log(`[SuperAI] Received response from A4F API for user ${userId}: "${finalResponse.substring(0, 30)}..."`);
      console.log(`[SuperAI] Updated history length: ${history.length}`);
      
      // Log successful API call for monitoring
      console.log(`[SuperAI] Success Metrics:`, {
        userId,
        responseTime: endTime - startTime,
        messageLength: message.length,
        responseLength: finalResponse.length,
        timestamp: new Date().toISOString()
      });
      
      return finalResponse;
    } catch (apiError: any) {
      console.error("[SuperAI] A4F API Error:", apiError.message);
      console.error("[SuperAI] A4F API Error details:", JSON.stringify(apiError, null, 2));
      
      // Log error for monitoring
      console.error(`[SuperAI] API Error Metrics:`, {
        userId,
        error: apiError.message,
        errorCode: apiError.code,
        timestamp: new Date().toISOString()
      });
      
      if (apiError.message?.includes("API key")) {
        console.error("[SuperAI] API KEY ERROR: The A4F API key appears to be invalid or expired.");
        return "I'm having trouble connecting to my brain right now. This might be due to an authentication issue. Please contact the administrator to update my API key.";
      }
      
      if (apiError.message?.includes("timeout") || apiError.message?.includes("ECONNREFUSED")) {
        console.error("[SuperAI] API CONNECTION ERROR: Could not connect to the A4F API.");
        return "I'm having trouble connecting to my brain right now. There seems to be a connection issue. Please try again later.";
      }
      
      if (apiError.message?.includes("rate limit") || apiError.message?.includes("429")) {
        console.error("[SuperAI] RATE LIMIT ERROR: A4F API rate limit exceeded.");
        return "I'm receiving too many requests right now. Please wait a moment before trying again.";
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error("[SuperAI] Error getting AI response:", error);
    
    // Log error for monitoring
    console.error(`[SuperAI] General Error Metrics:`, {
      userId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    
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