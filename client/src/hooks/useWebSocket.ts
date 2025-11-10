import { useEffect, useRef, useState, useCallback } from 'react';
import { getToken } from '@/lib/utils';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// Global WebSocket instance and state
let globalWs: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let messageListeners: Set<(message: WebSocketMessage) => void> = new Set();
let connectionListeners: Set<(connected: boolean) => void> = new Set();
let isConnected = false;

function notifyConnectionListeners(connected: boolean) {
  isConnected = connected;
  connectionListeners.forEach(listener => listener(connected));
}

function notifyMessageListeners(message: WebSocketMessage) {
  messageListeners.forEach(listener => listener(message));
}

function connect() {
  const token = getToken();
  if (!token) {
    console.log('[WebSocket] No token found, skipping connection');
    return;
  }

  // Don't create a new connection if one already exists and is open
  if (globalWs && (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING)) {
    console.log('[WebSocket] Connection already exists, reusing');
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  console.log('[WebSocket] Connecting to:', wsUrl);
  globalWs = new WebSocket(wsUrl);

  globalWs.onopen = () => {
    console.log('[WebSocket] Connected successfully');
    notifyConnectionListeners(true);
    // Authenticate WebSocket connection
    globalWs?.send(JSON.stringify({ type: 'auth', token }));
    
    // Clear any pending reconnect
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  globalWs.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('[WebSocket] Received message:', message.type, message);
    // Notify all listeners with timestamp to ensure React detects the change
    notifyMessageListeners({ ...message, _timestamp: Date.now() });
  };

  globalWs.onclose = () => {
    console.log('[WebSocket] Connection closed, will reconnect in 3s');
    notifyConnectionListeners(false);
    globalWs = null;
    
    // Attempt to reconnect after 3 seconds
    reconnectTimeout = setTimeout(() => {
      console.log('[WebSocket] Attempting to reconnect...');
      connect();
    }, 3000);
  };

  globalWs.onerror = (error) => {
    console.error('[WebSocket] Error:', error);
    notifyConnectionListeners(false);
  };
}

export function useWebSocket() {
  const [connected, setConnected] = useState(isConnected);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    // Add listeners
    const connectionListener = (connected: boolean) => {
      console.log('[WebSocket Hook] Connection status changed:', connected);
      setConnected(connected);
    };
    
    const messageListener = (message: WebSocketMessage) => {
      console.log('[WebSocket Hook] Message received:', message.type);
      setLastMessage(message);
    };

    connectionListeners.add(connectionListener);
    messageListeners.add(messageListener);

    // Connect if not already connected
    if (!globalWs || globalWs.readyState === WebSocket.CLOSED) {
      connect();
    } else {
      // Update state with current connection status
      setConnected(isConnected);
    }

    // Cleanup: remove listeners but DON'T close the connection
    return () => {
      connectionListeners.delete(connectionListener);
      messageListeners.delete(messageListener);
    };
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (globalWs?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Sending message:', message.type);
      globalWs.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message, not connected. ReadyState:', globalWs?.readyState);
    }
  }, []);

  return {
    isConnected: connected,
    lastMessage,
    sendMessage,
  };
}
