import { useState, useEffect } from 'react';
import { DeviceType, getDeviceType } from './useResponsive';

interface SidebarPreference {
  expanded: boolean;
  lastUpdated: number;
  deviceType: DeviceType;
}

const SIDEBAR_PREFERENCE_KEY = 'admin_sidebar_preference';

const saveSidebarPreference = (expanded: boolean) => {
  try {
    const preference: SidebarPreference = {
      expanded,
      lastUpdated: Date.now(),
      deviceType: getDeviceType(),
    };
    localStorage.setItem(SIDEBAR_PREFERENCE_KEY, JSON.stringify(preference));
  } catch (error) {
    console.warn('Failed to save sidebar preference:', error);
  }
};

const loadSidebarPreference = (): boolean | null => {
  try {
    const stored = localStorage.getItem(SIDEBAR_PREFERENCE_KEY);
    if (!stored) return null;
    
    const preference: SidebarPreference = JSON.parse(stored);
    
    // Only use preference if device type matches
    if (preference.deviceType === getDeviceType()) {
      return preference.expanded;
    }
    
    return null;
  } catch {
    return null;
  }
};

export const useSidebarState = () => {
  const [expanded, setExpanded] = useState(() => {
    // Try to load from localStorage
    const saved = loadSidebarPreference();
    if (saved !== null) return saved;
    
    // Default based on device type
    const deviceType = getDeviceType();
    return deviceType === 'desktop';
  });

  const [isAnimating, setIsAnimating] = useState(false);

  const toggleSidebar = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setExpanded(prev => {
      const newState = !prev;
      saveSidebarPreference(newState);
      return newState;
    });
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return { expanded, toggleSidebar, isAnimating, setExpanded };
};
