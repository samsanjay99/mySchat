import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Send, ArrowLeft, Smile, Paperclip, MoreVertical } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface SuperAIChatProps {
  onClose?: () => void;
}

// Toast implementation
const useToast = () => {
  return {
    toast: ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
      console.log(`${title}: ${description}`);
    }
  };
};

// API utility functions
const getQueryFn = (options: { on401: string }) => {
  return async () => {
    const response = await fetch(options.on401, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("schat_token")}`,
      },
    });
    if (!response.ok) throw new Error("API request failed");
    return response.json();
  };
};

const apiRequest = async (method: string, url: string, data?: any) => {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem("schat_token")}`,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`${response.status}: ${await response.text()}`);
  }
  
  return response;
};

interface User {
  id: number;
  email: string;
  fullName: string;
  schatId: string;
  profileImageUrl?: string;
  status?: string;
  isOnline: boolean;
  isSuperAI?: boolean;
}

interface Message {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  messageType?: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: number;
  status: string;
  createdAt: string;
  sender: User;
}

interface Chat {
  id: number;
  user1Id: number;
  user2Id: number;
  createdAt: string;
  updatedAt: string;
  user1: User;
  user2: User;
  messages: Message[];
}

interface SuperAIChatData {
  chat: Chat;
  aiUser: User;
}

// Suggested prompts for Super AI
const suggestedPrompts = [
  "/create a beautiful sunset over mountains",
  "Teach me all about K-pop",
  "Tell me a scary story",
  "5 veg protein sources",
  "How to avoid burnout"
];

export function SuperAIChat({ onClose }: SuperAIChatProps) {
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPageAnimation, setShowPageAnimation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  
  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user/me"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Get Super AI chat
  const { data: aiChatData, isLoading: aiChatLoading } = useQuery({
    queryKey: ["/api/super-ai/chat"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Local cache key for messages
  const getCacheKey = () => {
    if (!aiChatData?.chat?.id || !currentUser?.id) return null;
    return `superai_chat_messages_${currentUser.id}_${aiChatData.chat.id}`;
  };

  // Function to save messages to localStorage
  const saveMessagesToCache = (messages: Message[]) => {
    const cacheKey = getCacheKey();
    if (cacheKey && messages.length > 0) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(messages));
        console.log(`Saved ${messages.length} messages to local cache`);
      } catch (error) {
        console.error("Failed to save messages to localStorage:", error);
      }
    }
  };

  // Function to load messages from localStorage
  const loadMessagesFromCache = (): Message[] => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return [];
    
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const parsedMessages = JSON.parse(cachedData) as Message[];
        console.log(`Loaded ${parsedMessages.length} messages from local cache`);
        return parsedMessages;
      }
    } catch (error) {
      console.error("Failed to load messages from localStorage:", error);
    }
    
    return [];
  };

  // Get chat messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/chats", aiChatData?.chat?.id, "messages"],
    queryFn: async () => {
      if (!aiChatData?.chat?.id) return [];
      
      const response = await fetch(`/api/chats/${aiChatData.chat.id}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("schat_token")}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to fetch messages");
      const fetchedMessages = await response.json();
      
      // If we have no messages from the server but have cached messages, use those
      if (fetchedMessages.length === 0) {
        const cachedMessages = loadMessagesFromCache();
        if (cachedMessages.length > 0) {
          return cachedMessages;
        }
      } else {
        // Save fetched messages to cache
        saveMessagesToCache(fetchedMessages);
      }
      
      return fetchedMessages;
    },
    enabled: !!aiChatData?.chat?.id,
  });

  useEffect(() => {
    setShowPageAnimation(true);
  }, []);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!aiChatData?.chat?.id) {
        throw new Error("Super AI chat not initialized");
      }
      
      console.log("Sending message to Super AI:", content.substring(0, 30) + "...");
      
      // If using WebSockets
      if (isConnected) {
        console.log("Using WebSocket connection to send message");
        sendMessage({
          type: "send_message",
          chatId: aiChatData.chat.id,
          content,
        });
        return { success: true };
      } 
      // Fallback to REST API
      else {
        console.log("Using REST API to send message");
        try {
          const response = await apiRequest("POST", "/api/super-ai/chat", { message: content });
          const responseData = await response.json();
          console.log("Received response from Super AI API:", responseData);
          return responseData;
        } catch (error) {
          console.error("Error sending message to Super AI:", error);
          throw error;
        }
      }
    },
    onMutate: (content) => {
      // Optimistically add the user message to the UI
      if (aiChatData?.chat?.id && currentUser) {
        const optimisticUserMessage: Message = {
          id: Date.now(), // Temporary ID
          chatId: aiChatData.chat.id,
          senderId: currentUser.id,
          content: content,
          status: 'sending',
          createdAt: new Date().toISOString(),
          sender: currentUser,
        };
        
        // Update the cache with the optimistic message
        const currentMessages = queryClient.getQueryData<Message[]>([
          "/api/chats", aiChatData.chat.id, "messages"
        ]) || [];
        
        queryClient.setQueryData(
          ["/api/chats", aiChatData.chat.id, "messages"],
          [...currentMessages, optimisticUserMessage]
        );
        
        // Show typing indicator immediately for Super AI
        console.log("Message sent to Super AI, showing typing indicator");
        setIsTyping(true);
        
        return { previousMessages: currentMessages };
      }
      return { previousMessages: [] };
    },
    onSuccess: (data) => {
      setMessageInput("");
      setIsTyping(false);
      
      // Force refetch messages
      if (aiChatData?.chat?.id) {
        console.log("Message sent successfully, invalidating queries");
        queryClient.invalidateQueries({ queryKey: ["/api/chats", aiChatData.chat.id, "messages"] });
        queryClient.refetchQueries({ queryKey: ["/api/chats", aiChatData.chat.id, "messages"] });
      }
    },
    onError: (error: Error, variables, context) => {
      setIsTyping(false);
      
      // Revert to previous messages on error
      if (context?.previousMessages && aiChatData?.chat?.id) {
        queryClient.setQueryData(
          ["/api/chats", aiChatData.chat.id, "messages"],
          context.previousMessages
        );
      }
      
      toast({
        title: "Failed to send message",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always ensure typing indicator is off when settled
      setIsTyping(false);
    }
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage || !aiChatData?.chat?.id) return;

    if (lastMessage.type === "new_message" && lastMessage.message.chatId === aiChatData.chat.id) {
      console.log("Received new message via WebSocket:", lastMessage.message);
      
      // If this is an AI message, stop the typing indicator
      if (lastMessage.message.sender.isSuperAI) {
        console.log("AI response received, stopping typing indicator");
        setIsTyping(false);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/chats", aiChatData.chat.id, "messages"] });
    } else if (lastMessage.type === "message_sent") {
      console.log("Message sent confirmation received:", lastMessage.message);
      
      // Start typing indicator when user message is sent (if it's to Super AI)
      if (aiChatData?.aiUser?.isSuperAI) {
        console.log("User message sent to Super AI, starting typing indicator");
        setIsTyping(true);
      }
      
      // Update the message status to sent
      const currentMessages = queryClient.getQueryData<Message[]>([
        "/api/chats", aiChatData.chat.id, "messages"
      ]) || [];
      
      const updatedMessages = currentMessages.map(msg => 
        msg.id === lastMessage.message.id 
          ? { ...msg, status: 'sent' }
          : msg
      );
      
      queryClient.setQueryData(
        ["/api/chats", aiChatData.chat.id, "messages"],
        updatedMessages
      );
    } else if (lastMessage.type === "message_delivered") {
      console.log("Message delivered confirmation received:", lastMessage.messageId);
      
      // Update the message status to delivered
      const currentMessages = queryClient.getQueryData<Message[]>([
        "/api/chats", aiChatData.chat.id, "messages"
      ]) || [];
      
      const updatedMessages = currentMessages.map(msg => 
        msg.id === lastMessage.messageId 
          ? { ...msg, status: 'delivered' }
          : msg
      );
      
      queryClient.setQueryData(
        ["/api/chats", aiChatData.chat.id, "messages"],
        updatedMessages
      );
    }
  }, [lastMessage, aiChatData]);

  // Save messages to cache whenever they change
  useEffect(() => {
    if (messages && messages.length > 0) {
      saveMessagesToCache(messages);
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle message send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;
    
    sendMessageMutation.mutate(messageInput);
  };

  // Handle suggested prompt click
  const handleSuggestedPrompt = (prompt: string) => {
    sendMessageMutation.mutate(prompt);
  };

  // Show loading state
  if (aiChatLoading || messagesLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#25D366]" />
        <p className="mt-2 text-sm text-gray-600">Loading Super AI chat...</p>
      </div>
    );
  }

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`chat-main ${showPageAnimation ? 'page-transition-enter-active' : 'page-transition-enter'}`}>
      {/* Chat header */}
      <div className="chat-header">
        {onClose && (
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-2"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
        )}
        <img 
          src="/logo/superai-logo.png"
          alt="Super AI" 
          className="h-10 w-10 rounded-full mr-3 border-2 border-white"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Super AI</h3>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              💬 + 🎨
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {aiChatData?.aiUser?.status || "Chat & Image Generation • Try /create"}
          </p>
        </div>
        <div className="flex space-x-1">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <MoreVertical size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-container">
            <img 
              src="/logo/superai-logo.png"
              alt="Super AI" 
              className="h-24 w-24 mb-6 rounded-full shadow-lg"
            />
            <h3 className="welcome-title">Welcome to Super AI</h3>
            <p className="welcome-subtitle">
              Ask me anything! I'm your personal AI assistant, here to help with any questions you might have.
            </p>
            
            {/* Image Generation Feature Highlight */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6 max-w-md mx-auto shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-purple-900 mb-1">✨ I can generate images!</h4>
                  <p className="text-xs text-purple-700 mb-2">
                    Use the <code className="bg-purple-100 px-1.5 py-0.5 rounded text-purple-800 font-mono">/create</code> command to generate AI images
                  </p>
                  <p className="text-xs text-purple-600 italic">
                    Example: <span className="font-medium">"/create a cute cat wearing sunglasses"</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="prompts-container">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="prompt-button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message: Message, index: number) => {
              const isFromAI = message.sender.isSuperAI;
              
              return (
                <div
                  key={message.id}
                  className={`message ${isFromAI ? 'message-received' : 'message-sent'}`}
                >
                  {message.messageType === 'image' && message.imageUrl ? (
                    <div className="space-y-2">
                      <img 
                        src={message.imageUrl} 
                        alt="Generated image" 
                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                        onClick={() => window.open(message.imageUrl, '_blank')}
                        onError={(e) => {
                          console.error("Failed to load image:", message.imageUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="message-content text-sm">{message.content}</div>
                    </div>
                  ) : (
                    <div className="message-content">{message.content}</div>
                  )}
                  <div className="message-time">
                    {formatTime(message.createdAt)}
                    {message.status === 'sent' && (
                      <span className="ml-1 text-xs text-gray-400">✓</span>
                    )}
                    {message.status === 'delivered' && (
                      <span className="ml-1 text-xs text-gray-400">✓✓</span>
                    )}
                    {message.status === 'read' && (
                      <span className="ml-1 text-xs text-blue-500">✓✓</span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Enhanced Typing indicator */}
            {isTyping && (
              <div className="message message-received typing-indicator-container">
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                  <div className="typing-text">Super AI is typing...</div>
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="chat-input">
        <button type="button" className="text-gray-500 hover:text-gray-700 p-2 rounded-full">
          <Smile className="h-5 w-5" />
        </button>
        <button type="button" className="text-gray-500 hover:text-gray-700 p-2 rounded-full">
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder={
            messageInput.toLowerCase().startsWith('/create') 
              ? "Describe the image you want to create..." 
              : "Type a message or /create for images"
          }
          disabled={sendMessageMutation.isPending}
          className="flex-1 p-2 rounded-full border-none outline-none bg-white"
        />
        <button 
          type="submit"
          disabled={!messageInput.trim() || sendMessageMutation.isPending}
          className="bg-[#25D366] hover:bg-[#128C7E] text-white p-3 rounded-full ml-2 transition-colors disabled:opacity-50 w-12 h-12 flex items-center justify-center shadow-md"
        >
          {sendMessageMutation.isPending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Send className="h-6 w-6" />
          )}
        </button>
      </form>
    </div>
  );
}