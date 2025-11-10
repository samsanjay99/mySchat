import { Shield, Activity, Users, Database, Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface CollapsibleSidebarProps {
  expanded: boolean;
  visible: boolean;
  onToggle: () => void;
  onNavigate: (tab: string) => void;
  activeTab: string;
  isMobile: boolean;
  adminUser: any;
  onLogout: () => void;
}

const navigationItems = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "users", label: "Users", icon: Users },
  { id: "cleanup", label: "Storage", icon: Database },
  { id: "logs", label: "Logs", icon: Clock },
];

export const CollapsibleSidebar = ({
  expanded,
  visible,
  onToggle,
  onNavigate,
  activeTab,
  isMobile,
  adminUser,
  onLogout,
}: CollapsibleSidebarProps) => {
  const sidebarRef = useFocusTrap(isMobile && visible);

  const handleNavigate = (tabId: string) => {
    onNavigate(tabId);
    // Auto-close on mobile after navigation
    if (isMobile) {
      onToggle();
    }
  };

  return (
    <aside
      ref={sidebarRef as any}
      id="admin-sidebar"
      aria-label="Admin navigation"
      role="navigation"
      className={`
        bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out
        ${isMobile ? 'fixed left-0 top-0 h-screen z-50 shadow-2xl' : 'relative'}
        ${isMobile && !visible ? '-translate-x-full' : 'translate-x-0'}
        ${isMobile ? 'w-72' : expanded ? 'w-64' : 'w-20'}
      `}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {expanded && (
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Admin</h2>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
          )}
          {!expanded && !isMobile && (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              title={!expanded && !isMobile ? item.label : undefined}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isActive
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
                }
                ${!expanded && !isMobile ? 'justify-center' : ''}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(expanded || isMobile) && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        {(expanded || isMobile) ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 px-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {adminUser.fullName?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{adminUser.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{adminUser.role}</p>
              </div>
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full p-2 text-gray-600 hover:text-gray-900"
            size="sm"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        )}
      </div>
    </aside>
  );
};
