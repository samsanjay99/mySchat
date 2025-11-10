import { Menu, X } from 'lucide-react';

interface HamburgerButtonProps {
  onClick: () => void;
  isOpen: boolean;
  isMobile?: boolean;
  ariaLabel?: string;
}

export const HamburgerButton = ({ 
  onClick, 
  isOpen, 
  isMobile = false,
  ariaLabel 
}: HamburgerButtonProps) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel || (isOpen ? "Collapse sidebar" : "Expand sidebar")}
      aria-expanded={isOpen}
      aria-controls="admin-sidebar"
      className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {isMobile && isOpen ? (
        <X className="w-5 h-5 text-gray-700 transition-transform duration-200" />
      ) : (
        <Menu className="w-5 h-5 text-gray-700 transition-transform duration-200" />
      )}
    </button>
  );
};
