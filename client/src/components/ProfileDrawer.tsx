import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Copy, LogOut, Edit3, Check, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { removeToken } from "@/lib/utils";
import { useLocation } from "wouter";

interface ProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Define the user type based on the API response
interface UserData {
  id: number;
  fullName: string;
  email: string;
  schatId: string;
  profileImageUrl?: string;
  status?: string;
  isOnline?: boolean;
}

export function ProfileDrawer({ open, onOpenChange }: ProfileDrawerProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Type assertion for user data
  const user = data as UserData | undefined;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSettled: () => {
      removeToken();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out",
      });
      onOpenChange(false);
      // Force a reload of the page to ensure proper re-render after logout
      window.location.href = "/";
    },
  });

  const copySchatId = async () => {
    if (user?.schatId) {
      try {
        await navigator.clipboard.writeText(user.schatId);
        toast({
          title: "Copied!",
          description: "Schat ID copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Failed to copy",
          description: "Please copy manually: " + user.schatId,
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-sm p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="whatsapp-bg text-white p-6 pb-20">
            <SheetTitle className="text-white text-left">Profile</SheetTitle>
          </SheetHeader>

          {/* Profile Picture */}
          <div className="relative -mt-16 mx-6 mb-6">
            <div className="relative inline-block">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-2xl">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-0 right-0 bg-whatsapp hover:bg-whatsapp-dark text-white rounded-full w-8 h-8 shadow-lg"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Profile Content - Add overflow-y-auto to enable scrolling */}
          <div className="flex-1 px-6 space-y-6 overflow-y-auto">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-sm text-secondary-custom">Name</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-primary-custom font-medium">{user?.fullName || "Loading..."}</span>
                <div className="mt-1 text-xs text-secondary-custom italic">
                  Name cannot be changed after registration
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-sm text-secondary-custom">About</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-primary-custom">
                  {user?.status || "Hey there! I am using Schat."}
                </span>
              </div>
            </div>

            {/* Schat ID */}
            <div className="space-y-2">
              <Label className="text-sm text-secondary-custom">Schat ID</Label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-primary-custom font-mono text-sm">{user?.schatId || "Loading..."}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copySchatId}
                  className="text-green-600 hover:text-green-700"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-secondary-custom">
                Share this ID with friends to start chatting
              </p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-sm text-secondary-custom">Email</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-primary-custom">{user?.email || "Loading..."}</span>
              </div>
            </div>

            {/* Online Status */}
            <div className="space-y-2">
              <Label className="text-sm text-secondary-custom">Status</Label>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <div className="online-indicator"></div>
                <span className="text-primary-custom">
                  {user?.isOnline ? "Online" : "Last seen recently"}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="p-6 border-t">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}