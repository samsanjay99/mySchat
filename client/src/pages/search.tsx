import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { ArrowLeft, Search } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

interface SearchResult {
  id: number;
  fullName: string;
  email: string;
  schatId: string;
  profileImageUrl?: string;
  isOnline: boolean;
  lastSeen: string;
}

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: searchResult, isLoading: isSearching, error } = useQuery({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || !searchQuery.startsWith("SCHAT_") || searchQuery.length < 10) {
        return null;
      }
      const response = await fetch(`/api/users/search/${encodeURIComponent(searchQuery)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("schat_token")}`,
        },
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(await response.text());
      }
      return response.json();
    },
    enabled: searchQuery.length >= 10 && searchQuery.startsWith("SCHAT_"),
  });

  const startChatMutation = useMutation({
    mutationFn: async (otherUserId: number) => {
      console.log(`startChatMutation: Starting chat with user ${otherUserId}`);
      const response = await apiRequest("POST", "/api/chats", { otherUserId });
      const result = await response.json();
      console.log(`startChatMutation: Chat created successfully:`, result);
      return result;
    },
    onSuccess: (chat) => {
      console.log(`startChatMutation: onSuccess called with chat:`, chat);
      
      // Invalidate and refetch the chats query
      console.log(`startChatMutation: Invalidating chat queries`);
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      
      // Navigate back to the chat list instead of directly to the chat
      console.log(`startChatMutation: Navigating to chat list`);
      setLocation("/");
      
      toast({
        title: "Chat started!",
        description: "Your new chat has been added to your chat list",
      });
    },
    onError: (error: Error) => {
      console.error(`startChatMutation: Error occurred:`, error);
      toast({
        title: "Error",
        description: error.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  const handleStartChat = (userId: number) => {
    startChatMutation.mutate(userId);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="whatsapp-bg text-white p-4 flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-gray-200 hover:bg-white/10"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">New Chat</h1>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-light-custom">
        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Schat ID (e.g., SCHAT_8KD21A)"
            className="pl-10 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-custom h-4 w-4" />
        </div>
      </div>

      {/* Search Results */}
      <div className="p-4">
        {!searchQuery.trim() && (
          <div className="text-center text-secondary-custom py-8">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Enter a Schat ID to find users</p>
            <p className="text-sm">Format: SCHAT_XXXXXX</p>
          </div>
        )}

        {searchQuery.trim() && !searchQuery.startsWith("SCHAT_") && (
          <div className="text-center text-secondary-custom py-8">
            <p className="text-red-500">Invalid format</p>
            <p className="text-sm">Schat ID must start with "SCHAT_"</p>
          </div>
        )}

        {searchQuery.length > 0 && searchQuery.length < 10 && searchQuery.startsWith("SCHAT_") && (
          <div className="text-center text-secondary-custom py-8">
            <p className="text-amber-500">Keep typing...</p>
            <p className="text-sm">Schat ID should be at least 10 characters</p>
          </div>
        )}

        {isSearching && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-secondary-custom mt-2">Searching...</p>
          </div>
        )}

        {error && !isSearching && (
          <div className="text-center text-secondary-custom py-8">
            <p className="text-red-500">User not found</p>
            <p className="text-sm">Please check the Schat ID and try again</p>
          </div>
        )}

        {searchResult && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={searchResult.profileImageUrl} />
                  <AvatarFallback className="bg-gray-200 text-gray-600">
                    {searchResult.fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="font-medium text-primary-custom">
                    {searchResult.fullName}
                  </h3>
                  <p className="text-sm text-secondary-custom">
                    {searchResult.email}
                  </p>
                  <p className="text-xs text-secondary-custom font-mono">
                    {searchResult.schatId}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    {searchResult.isOnline && (
                      <div className="online-indicator"></div>
                    )}
                    <span className="text-xs text-secondary-custom">
                      {searchResult.isOnline ? "Online" : "Last seen recently"}
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleStartChat(searchResult.id)}
                  className="whatsapp-bg hover:whatsapp-dark-bg text-white text-sm"
                  disabled={startChatMutation.isPending}
                >
                  {startChatMutation.isPending ? "Starting..." : "Start Chat"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
