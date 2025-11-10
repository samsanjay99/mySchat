import { SuperAIChat } from "@/components/SuperAIChat";
import { useLocation } from "wouter";

export default function AIChatPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <SuperAIChat onClose={() => setLocation("/")} />
      </div>
    </div>
  );
} 