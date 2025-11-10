import { useLocation } from "wouter";
import { SuperAIChat } from "../../../super-ai/client/SuperAIChat";

export default function AIChatPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-screen">
      <SuperAIChat onClose={() => setLocation("/")} />
    </div>
  );
} 