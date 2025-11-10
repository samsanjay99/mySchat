import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  MessageSquare,
  Image as ImageIcon,
  Database,
  Trash2,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useResponsive } from "@/hooks/useResponsive";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CollapsibleSidebar } from "@/components/admin/CollapsibleSidebar";
import { MobileOverlay } from "@/components/admin/MobileOverlay";
import { HamburgerButton } from "@/components/admin/HamburgerButton";
import { Breadcrumb, BreadcrumbItem } from "@/components/admin/Breadcrumb";
import { SearchBar } from "@/components/admin/SearchBar";
import { StatsCarousel } from "@/components/admin/StatsCarousel";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [daysOld, setDaysOld] = useState("30");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Responsive and sidebar state
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { expanded, toggleSidebar, setExpanded } = useSidebarState();
  
  // Update sidebar state based on device type
  useEffect(() => {
    if (isMobile) {
      setSidebarVisible(false);
    } else if (isTablet) {
      setExpanded(false);
    } else if (isDesktop) {
      setSidebarVisible(true);
    }
  }, [isMobile, isTablet, isDesktop, setExpanded]);
  
  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleSidebar: () => {
      if (isMobile) {
        setSidebarVisible(prev => !prev);
      } else {
        toggleSidebar();
      }
    },
    onCloseMobileSidebar: () => {
      if (isMobile && sidebarVisible) {
        setSidebarVisible(false);
      }
    },
    onFocusSearch: () => {
      searchInputRef.current?.focus();
    },
  });

  // Check if admin is logged in
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setLocation("/admin");
    }
  }, []);

  const adminToken = localStorage.getItem("admin_token");
  const adminUser = JSON.parse(localStorage.getItem("admin_user") || "{}");

  // Fetch system stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users?limit=100", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: activeTab === "users",
  });

  // Fetch admin logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/admin/logs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/logs?limit=50", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
    enabled: activeTab === "logs",
  });

  // Fetch top users
  const { data: topUsers } = useQuery({
    queryKey: ["/api/admin/analytics/top-users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/analytics/top-users", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch top users");
      return response.json();
    },
    enabled: activeTab === "overview",
  });

  // Delete old messages mutation
  const deleteOldMessagesMutation = useMutation({
    mutationFn: async (days: number) => {
      const response = await fetch("/api/admin/cleanup/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ daysOld: days }),
      });
      if (!response.ok) throw new Error("Failed to delete messages");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      refetchStats();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear expired OTPs mutation
  const clearOTPsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/cleanup/otps", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to clear OTPs");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete user");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      refetchStats();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setLocation("/admin");
  };
  
  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarVisible(prev => !prev);
    } else {
      toggleSidebar();
    }
  };
  
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Admin", path: "overview" }
    ];
    
    if (activeTab === "overview") {
      breadcrumbs.push({ label: "Overview", path: "overview" });
    } else if (activeTab === "users") {
      breadcrumbs.push({ label: "Users", path: "users" });
    } else if (activeTab === "cleanup") {
      breadcrumbs.push({ label: "Storage Cleanup", path: "cleanup" });
    } else if (activeTab === "logs") {
      breadcrumbs.push({ label: "Activity Logs", path: "logs" });
    }
    
    return breadcrumbs;
  };
  
  // Filter users based on search query
  const filteredUsers = usersData?.users?.filter((user: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.schatId?.toLowerCase().includes(query)
    );
  });

  const handleDeleteOldMessages = () => {
    const days = parseInt(daysOld);
    if (days < 1) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid number of days",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete all messages older than ${days} days? This action cannot be undone.`)) {
      deleteOldMessagesMutation.mutate(days);
    }
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    if (confirm(`Are you sure you want to delete user "${userName}"? This will delete all their messages and chats. This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      <MobileOverlay 
        visible={isMobile && sidebarVisible} 
        onClick={() => setSidebarVisible(false)} 
      />
      
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar
        expanded={expanded}
        visible={isMobile ? sidebarVisible : true}
        onToggle={handleToggleSidebar}
        onNavigate={setActiveTab}
        activeTab={activeTab}
        isMobile={isMobile}
        adminUser={adminUser}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <HamburgerButton
                onClick={handleToggleSidebar}
                isOpen={isMobile ? sidebarVisible : expanded}
                isMobile={isMobile}
              />
              <Breadcrumb items={getBreadcrumbs()} onNavigate={setActiveTab} />
            </div>
            <Button
              onClick={() => refetchStats()}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {activeTab === "overview" && "Overview"}
                {activeTab === "users" && "User Management"}
                {activeTab === "cleanup" && "Storage Cleanup"}
                {activeTab === "logs" && "Activity Logs"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === "overview" && "System statistics and analytics"}
                {activeTab === "users" && "Manage all registered users"}
                {activeTab === "cleanup" && "Free up database storage"}
                {activeTab === "logs" && "Admin activity audit trail"}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-6 lg:p-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Carousel */}
            <StatsCarousel
              autoScroll={false}
              cards={[
                {
                  id: 'users',
                  icon: <Users className="w-5 h-5 text-blue-600" />,
                  label: 'Total Users',
                  value: stats?.totalUsers || 0,
                  subtitle: `${stats?.activeUsers || 0} active today`,
                  color: 'bg-blue-100'
                },
                {
                  id: 'messages',
                  icon: <MessageSquare className="w-5 h-5 text-green-600" />,
                  label: 'Total Messages',
                  value: stats?.totalMessages || 0,
                  subtitle: 'All time',
                  color: 'bg-green-100'
                },
                {
                  id: 'images',
                  icon: <ImageIcon className="w-5 h-5 text-purple-600" />,
                  label: 'Images Generated',
                  value: stats?.totalImages || 0,
                  subtitle: 'AI generated',
                  color: 'bg-purple-100'
                },
                {
                  id: 'storage',
                  icon: <Database className="w-5 h-5 text-orange-600" />,
                  label: 'Storage Used',
                  value: `${stats?.storageUsedMB || 0} MB`,
                  subtitle: 'Estimated',
                  color: 'bg-orange-100'
                }
              ]}
            />

            {/* Top Users */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Top Users by Activity
                </h2>
                <p className="text-sm text-gray-600 mt-1">Most active users in your system</p>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {topUsers?.map((user: any, index: number) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-blue-400 to-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-xs text-gray-500">{user.schat_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{user.message_count} <span className="text-xs font-normal text-gray-500">messages</span></p>
                        <p className="text-xs text-gray-500">{user.image_count} images</p>
                      </div>
                    </div>
                  ))}
                  {(!topUsers || topUsers.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No user activity yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {searchQuery 
                      ? `Showing ${filteredUsers?.length || 0} of ${usersData?.total || 0} users`
                      : `Total: ${usersData?.total || 0} registered users`
                    }
                  </p>
                </div>
                <div className="w-full md:w-80">
                  <SearchBar
                    placeholder="Search by name, email, or Schat ID..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onClear={() => setSearchQuery("")}
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Schat ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers?.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.fullName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {user.schatId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                          user.isOnline
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          {user.isOnline ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {!user.isSuperAI && (
                          <Button
                            onClick={() => handleDeleteUser(user.id, user.fullName)}
                            variant="ghost"
                            size="sm"
                            disabled={deleteUserMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!filteredUsers || filteredUsers.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{searchQuery ? "No users match your search" : "No users found"}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cleanup Tab */}
        {activeTab === "cleanup" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-5 flex items-start space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-900">Important Warning</p>
                <p className="text-sm text-yellow-700 mt-1">
                  All cleanup operations are permanent and cannot be undone. Please double-check before proceeding.
                </p>
              </div>
            </div>

            {/* Delete Old Messages */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Old Messages</h3>
                    <p className="text-sm text-gray-600">Free up storage by removing old messages</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-6">
                  Remove all messages older than the specified number of days. This will permanently delete the messages and cannot be recovered.
                </p>
                <div className="flex items-end space-x-4">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delete messages older than (days)
                    </label>
                    <Input
                      type="number"
                      value={daysOld}
                      onChange={(e) => setDaysOld(e.target.value)}
                      placeholder="30"
                      min="1"
                      className="text-lg"
                    />
                  </div>
                  <Button
                    onClick={handleDeleteOldMessages}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={deleteOldMessagesMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteOldMessagesMutation.isPending ? "Deleting..." : "Delete Messages"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Clear Expired OTPs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Clear Expired OTPs</h3>
                    <p className="text-sm text-gray-600">Remove expired verification codes</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-6">
                  Clean up expired one-time passwords from the database. This is safe and helps maintain database performance.
                </p>
                <Button
                  onClick={() => clearOTPsMutation.mutate()}
                  disabled={clearOTPsMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {clearOTPsMutation.isPending ? "Clearing..." : "Clear Expired OTPs"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Activity Logs</h2>
              <p className="text-sm text-gray-600 mt-1">Complete audit trail of admin actions</p>
            </div>
            <div className="divide-y divide-gray-100">
              {logsData?.logs?.map((log: any) => (
                <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {log.adminFullName?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{log.adminFullName}</span>
                          <span className="text-gray-400 mx-2">•</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      {log.details && (
                        <div className="mt-3 ml-11">
                          <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-x-auto border border-gray-200 font-mono">
                            {JSON.stringify(JSON.parse(log.details), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 ml-4">
                      <div>{new Date(log.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}</div>
                      <div className="mt-1">{new Date(log.createdAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</div>
                    </div>
                  </div>
                </div>
              ))}
              {(!logsData?.logs || logsData.logs.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No activity logs yet</p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
