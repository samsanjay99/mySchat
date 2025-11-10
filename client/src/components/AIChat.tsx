import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface AIChatProps {
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
}

interface Message {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  status: string;
  createdAt: string;
  sender: User;
}

interface Chat {
  id: number;
  user1Id: number;
  user2Id: number;
  isAIChat: boolean;
  createdAt: string;
  updatedAt: string;
  user1: User;
  user2: User;
  messages: Message[];
}

interface AIChatData {
  chat: Chat;
  aiUser: User;
}

export function AIChat({ onClose }: AIChatProps) {
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  
  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user/me"],
    queryFn: getQueryFn({ on401: "/api/user/me" }),
  });

  // Get AI chat
  const { data: aiChatData, isLoading: aiChatLoading } = useQuery<AIChatData>({
    queryKey: ["/api/ai/chat"],
    queryFn: getQueryFn({ on401: "/api/ai/chat" }),
  });

  // Get chat messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/chats", aiChatData?.chat?.id, "messages"],
    queryFn: async () => {
      if (!aiChatData?.chat?.id) return [];
      
      const response = await fetch(`/api/chats/${aiChatData.chat.id}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("schat_token")}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!aiChatData?.chat?.id,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!aiChatData?.chat?.id) {
        throw new Error("AI chat not initialized");
      }
      
      // If using WebSockets
      if (isConnected) {
        sendMessage({
          type: "send_message",
          chatId: aiChatData.chat.id,
          content,
        });
        return { success: true };
      } 
      // Fallback to REST API
      else {
        const response = await apiRequest("POST", "/api/ai/chat", { message: content });
        return response.json();
      }
    },
    onSuccess: () => {
      setMessageInput("");
      // Force refetch messages
      if (aiChatData?.chat?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/chats", aiChatData.chat.id, "messages"] });
        queryClient.refetchQueries({ queryKey: ["/api/chats", aiChatData.chat.id, "messages"] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage || !aiChatData?.chat?.id) return;

    if (lastMessage.type === "new_message" && lastMessage.message.chatId === aiChatData.chat.id) {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", aiChatData.chat.id, "messages"] });
    }
  }, [lastMessage, aiChatData]);

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

  // Show loading state
  if (aiChatLoading || messagesLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading AI chat...</p>
      </div>
    );
  }

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar className="h-10 w-10">
          <img 
            src={aiChatData?.aiUser?.profileImageUrl || "/ai-assistant-avatar.png"} 
            alt="AI Assistant" 
            className="h-full w-full object-cover"
          />
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{aiChatData?.aiUser?.fullName || "AI Assistant"}</h3>
          <p className="text-xs text-muted-foreground">
            {aiChatData?.aiUser?.status || "I'm your AI assistant, ready to help!"}
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <img 
              src="/ai-assistant-avatar.png" 
              alt="AI Assistant" 
              className="h-16 w-16 mb-4 rounded-full"
            />
            <h3 className="font-semibold text-lg">Welcome to AI Chat!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              I'm your personal AI assistant. Ask me anything!
            </p>
          </div>
        ) : (
          messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender.id === currentUser?.id ? "justify-end" : "justify-start"
              }`}
            >
              <Card
                className={`max-w-[80%] p-3 ${
                  message.sender.id === currentUser?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="space-y-1">
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 text-right">
                    {formatTime(message.createdAt)}
                    {message.sender.id === currentUser?.id && (
                      <span className="ml-1">
                        {message.status === "sent" ? "✓" : message.status === "delivered" ? "✓✓" : "✓✓"}
                      </span>
                    )}
                  </p>
                </div>
              </Card>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
        <Input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
          disabled={sendMessageMutation.isPending}
        />
        <Button 
          type="submit" 
          disabled={!messageInput.trim() || sendMessageMutation.isPending}
        >
          {sendMessageMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Send"
          )}
        </Button>
      </form>
    </div>
  );
} 