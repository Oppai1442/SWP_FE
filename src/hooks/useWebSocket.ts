import { useEffect, useRef, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useAuth } from '../context/AuthContext';

interface WebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  debug?: boolean;
}

export function useWebSocket(options: WebSocketOptions = {}) {
  const { onConnect, onDisconnect, debug = false } = options;
  const [connected, setConnected] = useState(false);
  const stompClient = useRef<Client | null>(null);
  const { token } = useAuth(); // Get authentication token

  // Connect to WebSocket
  const connect = useCallback(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/api/ws'),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: debug ? (str) => console.log(str) : () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnected(true);
        if (onConnect) onConnect();
      },
      onDisconnect: () => {
        setConnected(false);
        if (onDisconnect) onDisconnect();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        setConnected(false);
      }
    });

    stompClient.current = client;
    client.activate();

    return () => {
      if (client && client.active) {
        client.deactivate();
      }
    };
  }, [token, onConnect, onDisconnect, debug]);

  // Subscribe to a topic
  const subscribe = useCallback(
    (destination: string, callback: (message: any) => void) => {
      if (!stompClient.current || !connected) {
        console.warn('Cannot subscribe: WebSocket not connected');
        return null;
      }

      return stompClient.current.subscribe(destination, (message) => {
        try {
          const parsedBody = JSON.parse(message.body);
          callback(parsedBody);
        } catch (error) {
          console.error('Failed to parse message:', error);
          callback(message.body);
        }
      });
    },
    [connected]
  );

  // Send a message
  const send = useCallback(
    (destination: string, body: any) => {
      if (!stompClient.current || !connected) {
        console.warn('Cannot send: WebSocket not connected');
        return false;
      }

      stompClient.current.publish({
        destination,
        body: typeof body === 'string' ? body : JSON.stringify(body)
      });
      return true;
    },
    [connected]
  );

  // Disconnect
  const disconnect = useCallback(() => {
    if (stompClient.current && stompClient.current.active) {
      stompClient.current.deactivate();
    }
  }, []);

  // Connect automatically when the hook is used
  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  // Thêm cleanup logic vào useWebSocket hook
  useEffect(() => {
    return () => {
      // Disconnect khi component unmount
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.disconnect();
      }
    };
  }, []);

  return { connected, subscribe, send, disconnect, reconnect: connect };
}