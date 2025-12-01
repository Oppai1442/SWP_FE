import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import type { IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { IMessage } from '@stomp/stompjs';

type STOMPContextType = {
    sendMessage: (destination: string, message: string) => void;
    subscribe: (destination: string, callback: (message: IMessage) => void) => (() => void) | null;
    isConnected: boolean;
};

const STOMPContext = createContext<STOMPContextType | undefined>(undefined);

export const STOMPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);
    const subscriptionsRef = useRef<Map<string, { callback: (message: IMessage) => void; unsubscribe: () => void }>>(new Map());
    const retryCountRef = useRef<number>(0);
    const MAX_RETRIES = 10;

    useEffect(() => {
        const client = new Client({
            brokerURL: 'ws://localhost:8080/api/ws',
            webSocketFactory: () => new SockJS('http://localhost:8080/api/ws'),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: (str) => {
                console.log('[STOMP Debug]', str);
            },
            onConnect: (frame) => {
                console.log(`[STOMP] Connected successfully`, frame);
                setIsConnected(true);
                retryCountRef.current = 0;
                
                // Re-subscribe to all topics
                subscriptionsRef.current.forEach(({ callback }, destination) => {
                    try {
                        console.log(`[STOMP] Re-subscribing to ${destination}`);
                        const sub = client.subscribe(destination, callback);
                        subscriptionsRef.current.set(destination, {
                            callback,
                            unsubscribe: () => sub.unsubscribe()
                        });
                    } catch (error) {
                        console.error(`[STOMP] Failed to re-subscribe to ${destination}:`, error);
                    }
                });
            },
            onDisconnect: (frame) => {
                console.warn('[STOMP] Disconnected', frame);
                setIsConnected(false);
                retryCountRef.current += 1;
                
                if (retryCountRef.current > MAX_RETRIES) {
                    console.error(`[STOMP] Exceeded max retries (${MAX_RETRIES}). Stopping reconnect.`);
                    client.deactivate();
                }
            },
            onStompError: (frame: IFrame) => {
                console.error(`[STOMP] Error: ${frame.headers['message']}`, frame.body);
                setIsConnected(false);
            },
            onWebSocketError: (error) => {
                console.error('[STOMP] WebSocket error:', error);
                setIsConnected(false);
            }
        });

        client.activate();
        clientRef.current = client;

        return () => {
            // Clean up all subscriptions
            subscriptionsRef.current.forEach(({ unsubscribe }) => {
                try {
                    unsubscribe();
                } catch (error) {
                    console.error('[STOMP] Error unsubscribing:', error);
                }
            });
            subscriptionsRef.current.clear();
            
            // Deactivate client
            if (client.active) {
                client.deactivate();
            }
        };
    }, []);

    const sendMessage = (destination: string, message: string) => {
        if (clientRef.current && isConnected) {
            try {
                console.log(`[STOMP] Sending message to ${destination}:`, message);
                clientRef.current.publish({ destination, body: message });
            } catch (error) {
                console.error('[STOMP] Failed to send message:', error);
            }
        } else {
            console.warn('[STOMP] Cannot send message. Not connected.');
        }
    };

    // Thêm debug logs để kiểm tra subscription
    const subscribe = (destination: string, callback: (message: IMessage) => void): (() => void) | null => {
        console.log('🔌 STOMP subscribe called:', { destination, isConnected });
        
        if (!clientRef.current) {
            console.warn('❌ STOMP client not initialized');
            return null;
        }

        // Store subscription info for reconnection
        subscriptionsRef.current.set(destination, {
            callback,
            unsubscribe: () => {} // Will be updated when actually subscribed
        });

        if (isConnected) {
            try {
                console.log(`✅ STOMP subscribing to ${destination}`);
                const sub = clientRef.current.subscribe(destination, (message) => {
                    console.log(`📨 Message received on ${destination}:`, message);
                    callback(message);
                });
                
                const unsubscribe = () => {
                    try {
                        sub.unsubscribe();
                        subscriptionsRef.current.delete(destination);
                        console.log(`🔄 STOMP unsubscribed from ${destination}`);
                    } catch (error) {
                        console.error(`❌ Error unsubscribing from ${destination}:`, error);
                    }
                };
                
                // Update the unsubscribe function
                subscriptionsRef.current.set(destination, { callback, unsubscribe });
                
                return unsubscribe;
            } catch (error) {
                console.error(`❌ Failed to subscribe to ${destination}:`, error);
                return null;
            }
        } else {
            console.warn(`⚠️ Cannot subscribe to ${destination}. Not connected. Will retry on reconnect.`);
            return () => {
                subscriptionsRef.current.delete(destination);
            };
        }
    };

    const value: STOMPContextType = { sendMessage, subscribe, isConnected };

    return React.createElement(STOMPContext.Provider, { value }, children);
};

export const useSTOMP = (): STOMPContextType => {
    const context = useContext(STOMPContext);
    if (!context) throw new Error('useSTOMP must be used within a STOMPProvider');
    return context;
};
