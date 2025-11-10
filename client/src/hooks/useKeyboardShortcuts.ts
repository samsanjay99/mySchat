import { useEffect } from 'react';

interface KeyboardHandlers {
  onToggleSidebar?: () => void;
  onCloseMobileSidebar?: () => void;
  onFocusSearch?: () => void;
}

export const useKeyboardShortcuts = (handlers: KeyboardHandlers) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B or Cmd+B: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        handlers.onToggleSidebar?.();
      }
      
      // Escape: Close mobile sidebar
      if (e.key === 'Escape') {
        handlers.onCloseMobileSidebar?.();
      }
      
      // Ctrl+K or Cmd+K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handlers.onFocusSearch?.();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};
