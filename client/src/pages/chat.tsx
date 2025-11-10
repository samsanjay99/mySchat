import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Phone, Video, Smile, Paperclip, Send, MoreVertical, HardDrive } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import { formatTime } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { FileUpload, FilePreview } from "@/components/chat/FileUpload";
import { StorageManager } from "@/components/chat/StorageManager";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageWithSender {
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
  sender: {
    id: number;
    fullName: string;
    email: string;
    schatId: string;
    profileImageUrl?: string;
  };
}

interface ChatData {
  id: number;
  user1: {
    id: number;
    fullName: string;
    email: string;
    schatId: string;
    profileImageUrl?: string;
    isOnline: boolean;
  };
  user2: {
    id: number;
    fullName: string;
    email: string;
    schatId: string;
    profileImageUrl?: string;
    isOnline: boolean;
  };
  messages: MessageWithSender[];
}

interface User {
  id: number;
  fullName: string;
  email: string;
  schatId: string;
  profileImageUrl?: string;
  isOnline: boolean;
}

export default function ChatPage() {
  const [, params] = useRoute("/chat/:chatId");
  const [, setLocation] = useLocation();
  const [messageInput, setMessageInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [storageDialogOpen, setStorageDialogOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  
  const chatId = parseInt(params?.chatId || "0");
  const { isConnected, lastMessage, sendMessage } = useWebSocket();

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

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/chats", chatId, "messages"],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("schat_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      return (await response.json()) as MessageWithSender[];
    },
    enabled: !!chatId,
    // Removed refetchInterval - using WebSocket for real-time updates instead
  });

  const { data: chat, isLoading: chatLoading } = useQuery({
    queryKey: ["/api/chats", chatId],
    queryFn: async () => {
      const response = await fetch(`/api/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("schat_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch chat");
      return (await response.json()) as ChatData;
    },
    enabled: !!chatId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; imageUrl?: string; fileName?: string; fileSize?: number; messageType?: string }) => {
      const response = await apiRequest("POST", "/api/messages", {
        chatId,
        ...messageData,
      });
      return response.json();
    },
    onMutate: async (messageData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/chats", chatId, "messages"] });
      
      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(["/api/chats", chatId, "messages"]);
      
      // Optimistically update to the new value
      if (currentUser) {
        const optimisticMessage: MessageWithSender = {
          id: Date.now(), // Temporary ID
          chatId,
          senderId: currentUser.id,
          content: messageData.content,
          messageType: messageData.messageType || 'text',
          imageUrl: messageData.imageUrl,
          fileName: messageData.fileName,
          fileSize: messageData.fileSize,
          status: 'sending',
          createdAt: new Date().toISOString(),
          sender: currentUser,
        };
        
        queryClient.setQueryData(
          ["/api/chats", chatId, "messages"],
          (old: MessageWithSender[] = []) => [...old, optimisticMessage]
        );
      }
      
      return { previousMessages };
    },
    onSuccess: () => {
      setMessageInput("");
      setSelectedFile(null);
      setIsUploading(false);
      // Force refetch messages immediately to get real message with correct ID
      queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId, "messages"] });
      queryClient.refetchQueries({ queryKey: ["/api/chats", chatId, "messages"] });
    },
    onError: (error: Error, variables, context) => {
      // Rollback to previous messages on error
      if (context?.previousMessages) {
        queryClient.setQueryData(["/api/chats", chatId, "messages"], context.previousMessages);
      }
      setIsUploading(false);
      toast({
        title: "Failed to send message",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });
  
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      console.log('Starting file upload:', file.name, file.type, file.size);
      setIsUploading(true);
      
      // Check storage before upload
      const token = localStorage.getItem('schat_token');
      console.log('Checking storage for file size:', file.size);
      
      const checkRes = await fetch(`/api/storage/check?fileSize=${file.size}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const checkData = await checkRes.json();
      console.log('Storage check result:', checkData);
      
      if (!checkData.hasSpace) {
        toast({
          title: 'Storage Full',
          description: 'You have reached your 5MB storage limit. Please clear some files first.',
          variant: 'destructive',
        });
        setIsUploading(false);
        setStorageDialogOpen(true);
        return;
      }
      
      // Upload file
      console.log('Uploading file to server...');
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        console.error('Upload failed:', error);
        throw new Error(error.message || 'Upload failed');
      }
      
      const uploadData = await uploadRes.json();
      console.log('File uploaded successfully:', uploadData);
      
      // Send message with file
      const messageType = file.type.startsWith('image/') ? 'image' : 'file';
      const content = messageType === 'image' ? '[Image]' : `[File: ${uploadData.fileName}]`;
      
      console.log('Sending message with file data:', {
        content,
        imageUrl: uploadData.filePath,
        fileName: uploadData.fileName,
        fileSize: uploadData.fileSize,
        messageType,
      });
      
      await sendMessageMutation.mutateAsync({
        content,
        imageUrl: uploadData.filePath,
        fileName: uploadData.fileName,
        fileSize: uploadData.fileSize,
        messageType,
      });
      
      console.log('Message sent successfully!');
      toast({
        title: 'File Sent',
        description: 'Your file has been uploaded and sent successfully.',
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  // Mark messages as read when chat is opened or new messages arrive
  useEffect(() => {
    if (isConnected && chatId && messages.length > 0) {
      // Send read_messages event to mark all messages as read
      sendMessage({
        type: "read_messages",
        chatId: chatId,
      });
      
      // Also invalidate chat list to update unread counts
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    }
  }, [isConnected, chatId, messages.length, sendMessage]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) {
      console.log('[Chat] No lastMessage, skipping');
      return;
    }

    console.log('[Chat] Received WebSocket message:', lastMessage.type, 'Message chatId:', lastMessage.message?.chatId, 'Current chatId:', chatId, 'Types:', typeof lastMessage.message?.chatId, typeof chatId);

    switch (lastMessage.type) {
      case "new_message":
        console.log('[Chat] Processing new_message event');
        // Convert both to numbers for comparison
        if (lastMessage.message && Number(lastMessage.message.chatId) === Number(chatId)) {
          console.log('[Chat] New message for current chat, updating UI. Message:', lastMessage.message);
          
          // Optimistically add the message to the cache
          queryClient.setQueryData(
            ["/api/chats", chatId, "messages"],
            (oldData: any) => {
              console.log('[Chat] Current messages count:', oldData?.length || 0);
              if (!oldData) return [lastMessage.message];
              // Check if message already exists
              const exists = oldData.some((msg: any) => msg.id === lastMessage.message.id);
              if (exists) {
                console.log('[Chat] Message already exists, skipping');
                return oldData;
              }
              console.log('[Chat] Adding new message to cache');
              return [...oldData, lastMessage.message];
            }
          );
          
          // Also invalidate to ensure consistency
          queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId, "messages"] });
        } else {
          console.log('[Chat] Message not for current chat or missing message data');
        }
        break;
      case "message_sent":
        // Sender's own message confirmation
        console.log('[Chat] Processing message_sent event');
        if (lastMessage.message && Number(lastMessage.message.chatId) === Number(chatId)) {
          console.log('[Chat] Message sent confirmation for current chat');
          queryClient.setQueryData(
            ["/api/chats", chatId, "messages"],
            (oldData: any) => {
              if (!oldData) return [lastMessage.message];
              const exists = oldData.some((msg: any) => msg.id === lastMessage.message.id);
              if (exists) {
                console.log('[Chat] Message already exists in sent confirmation');
                return oldData;
              }
              console.log('[Chat] Adding sent message to cache');
              return [...oldData, lastMessage.message];
            }
          );
        }
        break;
      case "message_delivered":
        // Update message status to delivered
        queryClient.setQueryData(
          ["/api/chats", chatId, "messages"],
          (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((msg: any) =>
              msg.id === lastMessage.messageId
                ? { ...msg, status: 'delivered' }
                : msg
            );
          }
        );
        break;
      case "message_read":
        // Update message status to read
        queryClient.setQueryData(
          ["/api/chats", chatId, "messages"],
          (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((msg: any) =>
              msg.id === lastMessage.messageId
                ? { ...msg, status: 'read' }
                : msg
            );
          }
        );
        break;
      case "typing_status":
        if (lastMessage.chatId === chatId) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (lastMessage.isTyping) {
              newSet.add(lastMessage.userId);
            } else {
              newSet.delete(lastMessage.userId);
            }
            return newSet;
          });
        }
        break;
    }
  }, [lastMessage, chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = (value: string) => {
    setMessageInput(value);
    
    if (isConnected && !isTyping) {
      setIsTyping(true);
      sendMessage({
        type: "typing",
        chatId,
        isTyping: true,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isConnected && isTyping) {
        setIsTyping(false);
        sendMessage({
          type: "typing",
          chatId,
          isTyping: false,
        });
      }
    }, 1000);
  };

  const handleSendMessage = () => {
    // If file is selected, upload it
    if (selectedFile) {
      handleFileUpload(selectedFile);
      return;
    }
    
    const content = messageInput.trim();
    if (!content) return;

    sendMessageMutation.mutate({ content });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (chatLoading || messagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Chat not found</p>
          <Button onClick={() => setLocation("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const otherUser = chat.user1.id === currentUser?.id ? chat.user2 : chat.user1;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Chat Header - Fixed */}
      <div className="whatsapp-bg text-white p-4 flex items-center space-x-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-gray-200 hover:bg-white/10"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser.profileImageUrl} />
            <AvatarFallback className="bg-white/20 text-white">
              {otherUser.fullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-medium">{otherUser.fullName}</h3>
            <p className="text-xs opacity-90">
              {typingUsers.size > 0 ? "typing..." : otherUser.isOnline ? "Online" : "Last seen recently"}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-gray-200 hover:bg-white/10"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-gray-200 hover:bg-white/10"
          >
            <Video className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:text-gray-200 hover:bg-white/10"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStorageDialogOpen(true)}>
                <HardDrive className="w-4 h-4 mr-2" />
                Storage Manager
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 chat-bg bg-opacity-30 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-secondary-custom py-8">
            <p>Start the conversation by sending a message!</p>
          </div>
        ) : (
          messages.map((message: MessageWithSender) => {
            const isOwn = message.senderId === currentUser?.id;
            
            return (
              <div
                key={message.id}
                className={`flex items-end space-x-2 ${isOwn ? "justify-end" : ""}`}
              >
                <div
                  className={`message-bubble p-3 rounded-lg shadow-sm ${
                    isOwn ? "sent-msg-bg" : "received-msg-bg"
                  }`}
                >
                  {message.messageType === 'image' && message.imageUrl ? (
                    <div className="space-y-2">
                      <img 
                        src={message.imageUrl} 
                        alt="Shared image" 
                        className="max-w-xs max-h-96 rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover"
                        onClick={() => window.open(message.imageUrl, '_blank')}
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.textContent = '[Image unavailable]';
                        }}
                      />
                      {message.fileName && (
                        <p className="text-xs text-gray-500">{message.fileName}</p>
                      )}
                    </div>
                  ) : message.messageType === 'file' && message.imageUrl ? (
                    <div className="space-y-2">
                      <a
                        href={message.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Paperclip className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary-custom truncate">
                            {message.fileName || 'File'}
                          </p>
                          {message.fileSize && (
                            <p className="text-xs text-secondary-custom">
                              {(message.fileSize / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-secondary-custom">
                          Download
                        </div>
                      </a>
                    </div>
                  ) : (
                    <p className="text-primary-custom whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                  <div className={`flex items-center mt-1 space-x-2 ${isOwn ? "justify-end" : "justify-between"}`}>
                    <span className="text-xs text-secondary-custom">
                      {formatTime(message.createdAt)}
                    </span>
                    {isOwn && (
                      <div className="text-xs">
                        {message.status === "read" ? (
                          <span className="text-blue-500">✓✓</span>
                        ) : message.status === "delivered" ? (
                          <span className="text-gray-400">✓✓</span>
                        ) : (
                          <span className="text-gray-400">✓</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex items-end space-x-2">
            <div className="received-msg-bg p-3 rounded-lg shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-animation"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-animation" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-animation" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Fixed */}
      <div className="bg-white border-t border-light-custom p-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary-custom hover:text-primary-custom"
          >
            <Smile className="h-5 w-5" />
          </Button>
          
          <FileUpload
            onFileSelect={setSelectedFile}
            disabled={isUploading}
          />
          
          <div className="flex-1">
            {isUploading ? (
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            ) : selectedFile ? (
              <FilePreview
                file={selectedFile}
                onRemove={() => setSelectedFile(null)}
              />
            ) : (
              <Input
                value={messageInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isUploading}
              />
            )}
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={(!messageInput.trim() && !selectedFile) || sendMessageMutation.isPending || isUploading}
            className="whatsapp-bg hover:whatsapp-dark-bg text-white w-10 h-10 rounded-full p-0"
            size="icon"
            title={isUploading ? "Uploading..." : selectedFile ? "Send file" : "Send message"}
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Storage Manager Dialog */}
      <StorageManager
        open={storageDialogOpen}
        onOpenChange={setStorageDialogOpen}
      />
    </div>
  );
}
