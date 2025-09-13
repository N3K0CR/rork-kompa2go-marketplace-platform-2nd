import { useState, useEffect, useMemo, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderType: 'client' | 'provider';
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Chat {
  id: string;
  clientId: string;
  clientName: string;
  providerId: string;
  providerName: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isActive: boolean;
}

export const [ChatProvider, useChat] = createContextHook(() => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<{ [chatId: string]: ChatMessage[] }>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadChats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // Simulate AsyncStorage with localStorage for web compatibility
      const storedChats = typeof window !== 'undefined' 
        ? localStorage.getItem(`chats_${user.id}`)
        : null;
      const storedMessages = typeof window !== 'undefined'
        ? localStorage.getItem(`messages_${user.id}`)
        : null;
      
      if (storedChats) {
        const parsedChats = JSON.parse(storedChats).map((chat: any) => ({
          ...chat,
          lastMessageTime: chat.lastMessageTime ? new Date(chat.lastMessageTime) : undefined
        }));
        setChats(parsedChats);
      }
      
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        Object.keys(parsedMessages).forEach(chatId => {
          parsedMessages[chatId] = parsedMessages[chatId].map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        });
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user?.id]);

  const saveChats = useCallback(async (newChats: Chat[]) => {
    if (!user?.id || !Array.isArray(newChats)) return;
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`chats_${user.id}`, JSON.stringify(newChats));
      }
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  }, [user?.id]);

  const saveMessages = useCallback(async (newMessages: { [chatId: string]: ChatMessage[] }) => {
    if (!user?.id || !newMessages || typeof newMessages !== 'object') return;
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`messages_${user.id}`, JSON.stringify(newMessages));
      }
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }, [user?.id]);

  const createChat = useCallback(async (providerId: string, providerName: string): Promise<string> => {
    if (!user || !providerId?.trim() || !providerName?.trim()) {
      throw new Error('Invalid parameters');
    }
    
    const sanitizedProviderId = providerId.trim();
    const sanitizedProviderName = providerName.trim();
    
    // Check if chat already exists
    const existingChat = chats.find(chat => 
      (user.userType === 'client' && chat.providerId === sanitizedProviderId) ||
      (user.userType === 'provider' && chat.clientId === sanitizedProviderId)
    );
    
    if (existingChat) {
      return existingChat.id;
    }
    
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newChat: Chat = {
      id: chatId,
      clientId: user.userType === 'client' ? user.id : sanitizedProviderId,
      clientName: user.userType === 'client' ? user.name : sanitizedProviderName,
      providerId: user.userType === 'provider' ? user.id : sanitizedProviderId,
      providerName: user.userType === 'provider' ? user.name : sanitizedProviderName,
      unreadCount: 0,
      isActive: true
    };
    
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    await saveChats(updatedChats);
    
    return chatId;
  }, [user, chats, saveChats]);

  const sendMessage = useCallback(async (chatId: string, messageText: string) => {
    if (!user || !chatId?.trim() || !messageText?.trim()) return;
    
    const sanitizedMessage = messageText.trim();
    if (sanitizedMessage.length > 1000) return; // Limit message length
    
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId: user.id,
      senderName: user.name,
      senderType: user.userType as 'client' | 'provider',
      message: sanitizedMessage,
      timestamp: new Date(),
      isRead: false
    };
    
    // Update messages
    const updatedMessages = {
      ...messages,
      [chatId]: [...(messages[chatId] || []), message]
    };
    setMessages(updatedMessages);
    await saveMessages(updatedMessages);
    
    // Update chat with last message info
    const updatedChats = chats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          lastMessage: sanitizedMessage,
          lastMessageTime: new Date(),
          unreadCount: user.userType === 'client' ? chat.unreadCount : chat.unreadCount + 1
        };
      }
      return chat;
    });
    
    // Move chat to top
    const chatIndex = updatedChats.findIndex(chat => chat.id === chatId);
    if (chatIndex > 0) {
      const [movedChat] = updatedChats.splice(chatIndex, 1);
      updatedChats.unshift(movedChat);
    }
    
    setChats(updatedChats);
    await saveChats(updatedChats);
  }, [user, messages, chats, saveMessages, saveChats]);

  const markAsRead = useCallback(async (chatId: string) => {
    if (!user || !chatId?.trim()) return;
    
    // Mark messages as read
    const updatedMessages = {
      ...messages,
      [chatId]: (messages[chatId] || []).map(msg => 
        msg.senderId !== user.id ? { ...msg, isRead: true } : msg
      )
    };
    setMessages(updatedMessages);
    await saveMessages(updatedMessages);
    
    // Reset unread count
    const updatedChats = chats.map(chat => 
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    );
    setChats(updatedChats);
    await saveChats(updatedChats);
  }, [user, messages, chats, saveMessages, saveChats]);

  const getChatMessages = useCallback((chatId: string): ChatMessage[] => {
    if (!chatId?.trim()) return [];
    return messages[chatId] || [];
  }, [messages]);

  const getUnreadCount = useCallback((): number => {
    return chats.reduce((total, chat) => total + chat.unreadCount, 0);
  }, [chats]);

  const refreshChats = useCallback(async () => {
    await loadChats();
  }, [loadChats]);

  return useMemo(() => ({
    chats,
    messages,
    loading,
    createChat,
    sendMessage,
    markAsRead,
    getChatMessages,
    getUnreadCount,
    refreshChats
  }), [chats, messages, loading, createChat, sendMessage, markAsRead, getChatMessages, getUnreadCount, refreshChats]);
});