import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Plus, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useRef } from "react";
import { playNotificationSound, initAudioContext } from "@/lib/notification";
import { useWebSocket } from "@/hooks/useWebSocket";

interface User {
  id: number;
  fullName: string;
  email: string;
  schatId: string;
  profileImageUrl?: string;
  isOnline: boolean;
  isSuperAI?: boolean;
}

interface Message {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  status: string;
}

interface ChatListItem {
  id: number;
  user1: User;
  user2: User;
  messages: Message[];
  updatedAt: string;
}

interface SuperAIData {
  chat: ChatListItem;
  aiUser: User;
}

export default function ChatListPage() {
  const [location, setLocation] = useLocation();
  const previousChatsRef = useRef<ChatListItem[]>([]);
  const { lastMessage } = useWebSocket();

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user/me"],
    queryFn: async () => {
      const token = localStorage.getItem('schat_token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/user/me", {
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      return (await res.json()) as User;
    },
  });

  const { data: chats = [], isLoading } = useQuery<ChatListItem[]>({
    queryKey: ["/api/chats"],
    queryFn: async () => {
      const token = localStorage.getItem('schat_token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/chats", {
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      return (await res.json()) as ChatListItem[];
    },
  });

  const { data: superAIData } = useQuery<SuperAIData>({
    queryKey: ["/api/super-ai/chat"],
    queryFn: async () => {
      const token = localStorage.getItem('schat_token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/super-ai/chat", {
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      return (await res.json()) as SuperAIData;
    },
    enabled: !!currentUser,
  });
  
  // Initialize audio context on mount (requires user interaction)
  useEffect(() => {
    // Initialize audio context when user interacts with the page
    const initAudio = () => {
      initAudioContext();
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
    
    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
    
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, []);

  // Refetch chats when the component mounts
  useEffect(() => {
    console.log("ChatListPage: Component mounted, invalidating chat queries");
    // Force refetch the chat list when the component mounts
    queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    queryClient.refetchQueries({ queryKey: ["/api/chats"] });
  }, []);

  // Handle WebSocket messages and play notification sound
  useEffect(() => {
    if (!lastMessage || !currentUser) return;

    if (lastMessage.type === "new_message") {
      const message = lastMessage.message;
      
      // Only play sound if:
      // 1. Message is not from current user
      // 2. User is not in the chat page where message was sent
      if (message.senderId !== currentUser.id && !location.startsWith(`/chat/${message.chatId}`)) {
        playNotificationSound();
      }
      
      // Refetch chats to update the list
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    }
  }, [lastMessage, currentUser, location]);

  // Debug logging
  useEffect(() => {
    console.log("ChatListPage: Current user:", currentUser);
    console.log("ChatListPage: Chats data:", chats);
    console.log("ChatListPage: Is loading:", isLoading);
  }, [currentUser, chats, isLoading]);

  const getOtherUser = (chat: ChatListItem) => {
    // After our storage.ts update, user2 is always the other user
    return chat.user2;
  };

  const getLastMessage = (chat: ChatListItem) => {
    return chat.messages?.[chat.messages.length - 1] || null;
  };

  const getUnreadCount = (chat: ChatListItem) => {
    if (!currentUser) return 0;
    
    // Count messages from other user that are not read
    return chat.messages?.filter(msg => 
      msg.senderId !== currentUser.id && msg.status !== 'read'
    ).length || 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Filter out Super AI chat from regular chats if it exists in both places
  const filteredChats = chats.filter(chat => {
    const otherUser = getOtherUser(chat);
    return !otherUser.isSuperAI;
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="whatsapp-bg text-white p-4 flex items-center space-x-3">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-green-600" />
        </div>
        <h1 className="text-xl font-semibold">Schat</h1>
      </div>

      {/* Super AI Search Bar - Always on Top */}
      <div 
        onClick={() => setLocation(`/ai-chat`)}
        className="p-4 hover:bg-gray-50 cursor-pointer"
      >
        <div className="bg-gray-100 rounded-full p-2 px-4 flex items-center">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage src="/logo/superai-logo.png" />
            <AvatarFallback className="bg-gray-200 text-gray-600">
              AI
            </AvatarFallback>
          </Avatar>
          <span className="text-gray-500">Ask Super AI or Search</span>
        </div>
      </div>

      {/* Chat List */}
      <div className="divide-y border-light-custom">
        {/* Super AI Chat Entry */}
        {superAIData && (
          <div
            onClick={() => setLocation(`/ai-chat`)}
            className="p-4 hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src="/logo/superai-logo.png" />
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="online-indicator absolute -bottom-1 -right-1"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-primary-custom truncate">
                  Ask Super AI
                </h3>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-secondary-custom truncate">
                  Ask me anything!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Regular Chats */}
        {filteredChats.length === 0 && !superAIData ? (
          <div className="p-8 text-center text-secondary-custom">
            <div className="mb-4">
              <Plus className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <p className="text-lg font-medium mb-2">No chats yet</p>
            <p className="text-sm mb-4">Start a conversation by searching for users</p>
            <Button
              onClick={() => setLocation("/search")}
              className="whatsapp-bg hover:whatsapp-dark-bg text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Start New Chat
            </Button>
          </div>
        ) : (
          filteredChats.map((chat: ChatListItem) => {
            const otherUser = getOtherUser(chat);
            const lastMessage = getLastMessage(chat);
            const unreadCount = getUnreadCount(chat);
            
            return (
              <div
                key={chat.id}
                onClick={() => setLocation(`/chat/${chat.id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={otherUser.profileImageUrl} />
                    <AvatarFallback className="bg-gray-200 text-gray-600">
                      {otherUser.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {otherUser.isOnline && (
                    <div className="online-indicator absolute -bottom-1 -right-1"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-medium truncate ${unreadCount > 0 ? 'text-primary-custom font-semibold' : 'text-primary-custom'}`}>
                      {otherUser.fullName}
                    </h3>
                    <span className={`text-xs ${unreadCount > 0 ? 'text-whatsapp font-medium' : 'text-secondary-custom'}`}>
                      {lastMessage ? formatDate(lastMessage.createdAt) : formatDate(chat.updatedAt)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${unreadCount > 0 ? 'text-primary-custom font-medium' : 'text-secondary-custom'}`}>
                      {lastMessage ? (
                        <>
                          {lastMessage.senderId === currentUser?.id && "You: "}
                          {lastMessage.content}
                        </>
                      ) : (
                        "Start the conversation..."
                      )}
                    </p>
                    
                    <div className="flex items-center space-x-2 ml-2">
                      {lastMessage && lastMessage.senderId === currentUser?.id && (
                        <div className="flex items-center space-x-1">
                          {lastMessage.status === 'read' ? (
                            <div className="text-blue-500 text-xs">✓✓</div>
                          ) : lastMessage.status === 'delivered' ? (
                            <div className="text-gray-400 text-xs">✓✓</div>
                          ) : (
                            <div className="text-gray-400 text-xs">✓</div>
                          )}
                        </div>
                      )}
                      
                      {unreadCount > 0 && (
                        <div className="whatsapp-bg text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button - Responsive positioning */}
      <div className="fixed right-4 md:right-auto md:left-[58%] bottom-24 z-20">
        <Button
          onClick={() => setLocation("/search")}
          className="whatsapp-bg hover:whatsapp-dark-bg text-white w-14 h-14 rounded-2xl shadow-lg hover:scale-110 transition-transform"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
