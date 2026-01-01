import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
  id: number;
  user_id: number;
  user_name: string;
  avatar_url?: string;
  message: string;
  created_at: string;
  is_deleted: boolean;
}

interface TypingUser {
  userId: number;
  userName: string;
}

const ChatBox: React.FC = () => {
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hoveredAvatar, setHoveredAvatar] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNewMessageAlert, setShowNewMessageAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const newMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug: Log typing users changes
  useEffect(() => {
    console.log('👥 Typing users updated:', typingUsers);
  }, [typingUsers]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Clear unread count when chat is opened
  useEffect(() => {
    if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const newSocket = io(API_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from chat');
      setIsConnected(false);
    });

    newSocket.on('chat:history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    newSocket.on('chat:message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
      
      // If message is from another user
      if (message.user_id !== user?.id) {
        if (isMinimized) {
          // Increment unread count when minimized
          setUnreadCount(prev => prev + 1);
        } else {
          // Show brief alert when chat is open
          setShowNewMessageAlert(true);
          if (newMessageTimeoutRef.current) {
            clearTimeout(newMessageTimeoutRef.current);
          }
          newMessageTimeoutRef.current = setTimeout(() => {
            setShowNewMessageAlert(false);
          }, 3000);
        }
        
        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New message from ' + message.user_name, {
            body: message.message,
            icon: message.avatar_url || '/favicon.ico',
            tag: 'chat-message'
          });
        }
      }
    });

    newSocket.on('chat:typing', (data: { userId: number; userName: string; isTyping: boolean }) => {
      console.log('📝 Typing event received:', data);
      
      if (data.userId === user?.id) {
        console.log('⚠️ Ignoring own typing event');
        return; // Don't show own typing
      }
      
      console.log('✅ Processing typing event from:', data.userName);
      
      setTypingUsers(prev => {
        if (data.isTyping) {
          // Add user if not already in list
          if (!prev.find(u => u.userId === data.userId)) {
            console.log('➕ Adding user to typing list:', data.userName);
            return [...prev, { userId: data.userId, userName: data.userName }];
          }
          return prev;
        } else {
          // Remove user from typing list
          console.log('➖ Removing user from typing list:', data.userName);
          return prev.filter(u => u.userId !== data.userId);
        }
      });
    });

    newSocket.on('chat:error', (error: { message: string }) => {
      console.error('Chat error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      if (newMessageTimeoutRef.current) {
        clearTimeout(newMessageTimeoutRef.current);
      }
    };
  }, [token, user?.id, isMinimized]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!socket || !inputMessage.trim()) return;

    socket.emit('chat:message', inputMessage.trim());
    setInputMessage('');
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('chat:typing', false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputMessage(newValue);

    if (!socket || !isConnected) {
      console.log('⚠️ Cannot emit typing: socket not connected');
      return;
    }

    // If user starts typing (has content) and wasn't typing before
    if (newValue.length > 0) {
      // Emit typing indicator immediately
      console.log('📤 Emitting typing: true');
      socket.emit('chat:typing', true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Timeout: Emitting typing: false');
        socket.emit('chat:typing', false);
      }, 1000);
    } else {
      // If input is empty, stop typing immediately
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      console.log('📤 Input empty: Emitting typing: false');
      socket.emit('chat:typing', false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (isMinimized) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 1000
      }}>
        <button
          onClick={() => setIsMinimized(false)}
          style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            fontSize: '22px',
            cursor: 'pointer',
            boxShadow: typingUsers.length > 0 
              ? `0 0 0 0 ${theme.primary}80, 0 4px 12px ${theme.shadow}`
              : `0 4px 12px ${theme.shadow}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'transform 0.2s',
            animation: typingUsers.length > 0 ? 'pulse-ring 2s infinite' : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          💬
          {/* Connection indicator */}
          {isConnected && (
            <div style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '10px',
              height: '10px',
              background: '#10b981',
              borderRadius: '50%',
              border: '2px solid white'
            }} />
          )}
          {/* Unread badge */}
          {unreadCount > 0 && (
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '22px',
              height: '22px',
              background: '#ef4444',
              borderRadius: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: '700',
              color: 'white',
              border: '2px solid white',
              padding: '0 5px',
              animation: 'pulse 2s infinite'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
          {/* Typing indicator badge */}
          {typingUsers.length > 0 && unreadCount === 0 && (
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '22px',
              height: '22px',
              background: theme.primary,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '700',
              color: 'white',
              border: '2px solid white',
              animation: 'pulse 1.5s infinite'
            }}>
              ✍️
            </div>
          )}
        </button>
        
        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }
          
          @keyframes pulse-ring {
            0% {
              box-shadow: 0 0 0 0 ${theme.primary}80, 0 4px 12px ${theme.shadow};
            }
            50% {
              box-shadow: 0 0 0 10px ${theme.primary}00, 0 4px 12px ${theme.shadow};
            }
            100% {
              box-shadow: 0 0 0 0 ${theme.primary}00, 0 4px 12px ${theme.shadow};
            }
          }
          
          @media (max-width: 768px) {
            button {
              width: 52px !important;
              height: 52px !important;
              font-size: 20px !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      width: 'min(380px, calc(100vw - 32px))',
      height: 'min(550px, calc(100vh - 100px))',
      maxHeight: '550px',
      background: theme.surface,
      borderRadius: '16px',
      boxShadow: `0 8px 32px ${theme.shadow}`,
      border: `1px solid ${theme.border}`,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden'
    }}
    className="chat-box-responsive"
    >
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
        color: 'white',
        padding: 'clamp(12px, 3vw, 16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '16px 16px 0 0',
        position: 'relative',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 10px)' }}>
          <span style={{ fontSize: 'clamp(18px, 4vw, 20px)' }}>💬</span>
          <div>
            <div style={{ fontWeight: '600', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>
              Chat
              {/* Typing indicator in header */}
              {typingUsers.length > 0 && !isMinimized && (
                <span style={{
                  marginLeft: '8px',
                  fontSize: 'clamp(10px, 2.5vw, 11px)',
                  fontWeight: '400',
                  opacity: 0.9,
                  animation: 'pulse 1.5s infinite'
                }}>
                  • {typingUsers[0].userName} is typing...
                </span>
              )}
            </div>
            <div style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', opacity: 0.9 }}>
              {isConnected ? (
                <span>🟢 Connected</span>
              ) : (
                <span>🔴 Disconnected</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          }}
        >
          −
        </button>
        
        {/* New message alert */}
        {showNewMessageAlert && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '16px',
            right: '16px',
            marginTop: '8px',
            background: '#10b981',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: `0 4px 12px rgba(16, 185, 129, 0.3)`,
            zIndex: 10,
            animation: 'slideDown 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✨</span>
            <span>New message received!</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 'clamp(12px, 3vw, 16px)',
        background: theme.background,
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(10px, 2.5vw, 12px)',
        WebkitOverflowScrolling: 'touch'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: theme.textSecondary,
            padding: '40px 20px',
            fontSize: '14px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🦫</div>
            <div>No messages yet.</div>
            <div>Start the conversation!</div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.user_id === user?.id;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: '8px',
                  marginBottom: '4px'
                }}
              >
                {/* Avatar */}
                {!isOwnMessage && (
                  <div 
                    style={{
                      position: 'relative',
                      flexShrink: 0,
                      width: 'clamp(28px, 7vw, 32px)',
                      height: 'clamp(28px, 7vw, 32px)'
                    }}
                    onMouseEnter={() => setHoveredAvatar(msg.user_id)}
                    onMouseLeave={() => setHoveredAvatar(null)}
                  >
                    {msg.avatar_url ? (
                      <img
                        src={msg.avatar_url}
                        alt={msg.user_name}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: `2px solid ${theme.border}`,
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          transform: hoveredAvatar === msg.user_id ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: hoveredAvatar === msg.user_id ? `0 4px 8px ${theme.shadow}` : 'none'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: 'clamp(12px, 3vw, 14px)',
                          border: `2px solid ${theme.border}`,
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          transform: hoveredAvatar === msg.user_id ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: hoveredAvatar === msg.user_id ? `0 4px 8px ${theme.shadow}` : 'none'
                        }}
                      >
                        {msg.user_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    
                    {/* Tooltip */}
                    {hoveredAvatar === msg.user_id && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        background: theme.text,
                        color: theme.surface,
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: 'clamp(10px, 2.5vw, 12px)',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        boxShadow: `0 4px 12px ${theme.shadow}`,
                        zIndex: 1000,
                        pointerEvents: 'none'
                      }}>
                        {msg.user_name}
                        {/* Tooltip arrow */}
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: `6px solid ${theme.text}`
                        }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Message Content */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                  maxWidth: 'calc(100% - 40px)',
                  minWidth: 0
                }}>
                  {!isOwnMessage && (
                    <div style={{
                      fontSize: 'clamp(10px, 2.5vw, 11px)',
                      color: theme.textSecondary,
                      marginBottom: '2px',
                      paddingLeft: '8px',
                      fontWeight: '600'
                    }}>
                      {msg.user_name}
                    </div>
                  )}
                  <div style={{
                    background: isOwnMessage 
                      ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
                      : theme.surface,
                    color: isOwnMessage ? 'white' : theme.text,
                    padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 14px)',
                    borderRadius: isOwnMessage 
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    boxShadow: `0 2px 4px ${theme.shadow}`,
                    border: isOwnMessage ? 'none' : `1px solid ${theme.border}`,
                    maxWidth: '100%'
                  }}>
                    <div style={{ fontSize: 'clamp(13px, 3.2vw, 14px)', lineHeight: '1.4' }}>
                      {msg.message}
                    </div>
                    <div style={{
                      fontSize: 'clamp(9px, 2.2vw, 11px)',
                      marginTop: '4px',
                      opacity: 0.7,
                      textAlign: 'right'
                    }}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>

                {/* Own message avatar (optional) */}
                {isOwnMessage && user?.avatar_url && (
                  <div 
                    style={{
                      position: 'relative',
                      flexShrink: 0
                    }}
                    onMouseEnter={() => setHoveredAvatar(user.id)}
                    onMouseLeave={() => setHoveredAvatar(null)}
                  >
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `2px solid ${theme.primary}`,
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        transform: hoveredAvatar === user.id ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: hoveredAvatar === user.id ? `0 4px 8px ${theme.shadow}` : 'none'
                      }}
                    />
                    
                    {/* Tooltip */}
                    {hoveredAvatar === user.id && (
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        right: '0',
                        marginBottom: '8px',
                        background: theme.text,
                        color: theme.surface,
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        boxShadow: `0 4px 12px ${theme.shadow}`,
                        zIndex: 1000,
                        pointerEvents: 'none'
                      }}>
                        {user.name} (You)
                        {/* Tooltip arrow */}
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: '12px',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: `6px solid ${theme.text}`
                        }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 8px)',
            padding: 'clamp(10px, 2.5vw, 12px)',
            background: `${theme.primary}10`,
            borderRadius: '12px',
            border: `1px solid ${theme.primary}30`,
            marginTop: '8px'
          }}>
            <div style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center'
            }}>
              <span style={{ 
                animation: 'bounce 1.4s infinite',
                fontSize: 'clamp(8px, 2vw, 10px)',
                color: theme.primary
              }}>●</span>
              <span style={{ 
                animation: 'bounce 1.4s infinite 0.2s',
                fontSize: 'clamp(8px, 2vw, 10px)',
                color: theme.primary
              }}>●</span>
              <span style={{ 
                animation: 'bounce 1.4s infinite 0.4s',
                fontSize: 'clamp(8px, 2vw, 10px)',
                color: theme.primary
              }}>●</span>
            </div>
            <span style={{
              color: theme.primary,
              fontSize: 'clamp(12px, 3vw, 13px)',
              fontWeight: '500'
            }}>
              {typingUsers[0].userName} is typing...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} style={{
        padding: 'clamp(12px, 3vw, 16px)',
        background: theme.surface,
        borderTop: `1px solid ${theme.border}`,
        display: 'flex',
        gap: 'clamp(6px, 1.5vw, 8px)',
        flexShrink: 0
      }}>
        <input
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={!isConnected}
          style={{
            flex: 1,
            padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 14px)',
            border: `2px solid ${theme.border}`,
            borderRadius: '12px',
            fontSize: 'clamp(13px, 3.2vw, 14px)',
            outline: 'none',
            background: theme.background,
            color: theme.text,
            transition: 'border-color 0.2s',
            minWidth: 0
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
          onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
        />
        <button
          type="submit"
          disabled={!isConnected || !inputMessage.trim()}
          style={{
            background: (!isConnected || !inputMessage.trim()) 
              ? theme.border 
              : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: 'clamp(8px, 2vw, 10px) clamp(16px, 4vw, 20px)',
            fontSize: 'clamp(13px, 3.2vw, 16px)',
            cursor: (!isConnected || !inputMessage.trim()) ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
        >
          Send
        </button>
      </form>

      <style jsx>{`
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-8px);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
          :global(.chat-box-responsive) {
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: calc(100vh - 60px) !important;
            max-height: calc(100vh - 60px) !important;
            border-radius: 16px 16px 0 0 !important;
          }
        }
        
        @media (max-width: 480px) {
          :global(.chat-box-responsive) {
            height: calc(100vh - 50px) !important;
            max-height: calc(100vh - 50px) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatBox;
