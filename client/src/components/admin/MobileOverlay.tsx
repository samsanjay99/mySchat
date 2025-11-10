interface MobileOverlayProps {
  visible: boolean;
  onClick: () => void;
}

export const MobileOverlay = ({ visible, onClick }: MobileOverlayProps) => {
  if (!visible) return null;
  
  return (
    <div
      role="presentation"
      aria-hidden={!visible}
      onClick={onClick}
      className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    />
  );
};
