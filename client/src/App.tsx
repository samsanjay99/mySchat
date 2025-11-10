import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { isTokenValid, resetInactivityTimer, checkInactivityLogout } from "@/lib/utils";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { InactivityAlert } from "@/components/InactivityAlert";
import AuthPage from "@/pages/auth";
import ChatListPage from "@/pages/chat-list";
import SearchPage from "@/pages/search";
import ChatPage from "@/pages/chat";
import AIChatPage from "@/pages/ai-chat";
import LandingPage from "@/pages/landing";
import AdminLoginPage from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showInactivityAlert, setShowInactivityAlert] = useState(false);
  const [location] = useLocation();
  const isLandingRoute = location === '/' && !isAuthenticated;

  useEffect(() => {
    const checkAuth = () => {
      const valid = isTokenValid();
      setIsAuthenticated(valid);
      setIsLoading(false);
    };

    checkAuth();
    
    // Check auth status on focus/storage changes
    window.addEventListener('focus', checkAuth);
    window.addEventListener('storage', checkAuth);
    
    // Check if user was logged out due to inactivity
    if (checkInactivityLogout()) {
      setShowInactivityAlert(true);
    }
    
    return () => {
      window.removeEventListener('focus', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Set up event listeners for user activity
  useEffect(() => {
    if (isAuthenticated) {
      // List of events to track for user activity
      const activityEvents = [
        'mousedown', 'mousemove', 'keydown',
        'scroll', 'touchstart', 'click', 'keypress'
      ];
      
      // Function to handle user activity
      const handleUserActivity = () => {
        resetInactivityTimer();
      };
      
      // Add event listeners
      activityEvents.forEach(event => {
        window.addEventListener(event, handleUserActivity);
      });
      
      // Initialize the timer
      resetInactivityTimer();
      
      // Cleanup
      return () => {
        activityEvents.forEach(event => {
          window.removeEventListener(event, handleUserActivity);
        });
      };
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Admin routes (always accessible)
  if (location.startsWith('/admin')) {
    return (
      <Switch>
        <Route path="/admin" component={AdminLoginPage} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route>
          <AdminLoginPage />
        </Route>
      </Switch>
    );
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Switch>
          <Route path="/">
            <LandingPage />
          </Route>
          <Route path="/auth">
            <div className="min-h-screen w-full md:max-w-md md:mx-auto bg-white md:shadow-xl relative">
              <AuthPage />
            </div>
          </Route>
          <Route>
            <LandingPage />
          </Route>
        </Switch>
        {showInactivityAlert && (
          <InactivityAlert onClose={() => setShowInactivityAlert(false)} />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Switch>
        <Route path="/" component={ChatListPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/chat/:chatId" component={ChatPage} />
        <Route path="/ai-chat" component={AIChatPage} />
        <Route>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center text-secondary-custom">
              <p>Page not found</p>
            </div>
          </div>
        </Route>
      </Switch>
      
      <BottomNavigation onProfileClick={() => setIsProfileOpen(true)} />
      <ProfileDrawer open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  );
}

function App() {
  const [location] = useLocation();
  const isLandingRoute = location === '/' && !isTokenValid();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isLandingRoute ? (
          <div className="landing-container w-full h-full">
            <Toaster />
            <Router />
          </div>
        ) : (
          <div className="min-h-screen w-full md:max-w-md md:mx-auto bg-white md:shadow-xl relative">
            <Toaster />
            <Router />
          </div>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
