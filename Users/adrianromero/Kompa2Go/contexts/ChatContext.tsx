import { useState, useEffect, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { ChatService } from '../src/modules/chat/services/chat-service';
import type { Chat, ChatMessage, TypingIndicator } from '../src/shared/types/chat-types';
import { useFirebaseAuth } from './FirebaseAuthContext';

interface ChatContextValue {
  chats: Chat[];
  currentChat: Chat | null;
  messages: ChatMessage[];
  typingIndicators: TypingIndicator[];
  loading: boolean;
  error: string | null;
  
  selectChat: (chatId: string) => void;
  sendMessage: (content: string, type?: ChatMessage['type'], additionalData?: Partial<ChatMessage>) => Promise<void>;
  createChat: (participants: Chat['participants'], type: Chat['type'], relatedTo?: Chat['relatedTo']) => Promise<string>;
  findOrCreateChat: (userId: string, type: Chat['type'], relatedTo?: Chat['relatedTo']) => Promise<string>;
  markAsRead: () => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  archiveChat: (chatId: string) => Promise<void>;
  blockChat: (chatId: string) => Promise<void>;
  clearCurrentChat: () => void;
}

export const [ChatContext, useChat] = createContextHook<ChatContextValue>(() => {
  const { user } = useFirebaseAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    console.log('Subscribing to user chats:', user.uid);
    const unsubscribe = ChatService.subscribeToUserChats(user.uid, (userChats: Chat[]) => {
      console.log('User chats updated:', userChats.length);
      setChats(userChats);
    });

    return () => {
      console.log('Unsubscribing from user chats');
      unsubscribe();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!currentChat?.id) {
      setMessages([]);
      setTypingIndicators([]);
      return;
    }

    console.log('Subscribing to messages for chat:', currentChat.id);
    const unsubscribeMessages = ChatService.subscribeToMessages(currentChat.id, (chatMessages: ChatMessage[]) => {
      console.log('Messages updated:', chatMessages.length);
      setMessages(chatMessages);
    });

    const unsubscribeTyping = ChatService.subscribeToTypingIndicators(
      currentChat.id,
      user?.uid || '',
      (indicators: TypingIndicator[]) => {
        console.log('Typing indicators updated:', indicators.length);
        setTypingIndicators(indicators);
      }
    );

    return () => {
      console.log('Unsubscribing from messages and typing');
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [currentChat?.id, user?.uid]);

  const selectChat = useCallback((chatId: string) => {
    console.log('Selecting chat:', chatId);
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
      if (user?.uid) {
        ChatService.markMessagesAsRead(chatId, user.uid).catch((err: any) => {
          console.error('Error marking messages as read:', err);
        });
      }
    }
  }, [chats, user?.uid]);

  const sendMessage = useCallback(async (
    content: string,
    type: ChatMessage['type'] = 'text',
    additionalData?: Partial<ChatMessage>
  ) => {
    if (!currentChat || !user) {
      console.error('Cannot send message: no current chat or user');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const participant = currentChat.participants.find((p: Chat['participants'][0]) => p.userId === user.uid);
      if (!participant) {
        throw new Error('User not found in chat participants');
      }

      await ChatService.sendMessage(
        currentChat.id,
        user.uid,
        participant.userName,
        participant.userRole,
        content,
        type,
        additionalData
      );

      console.log('Message sent successfully');
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Error al enviar mensaje');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentChat, user]);

  const createChat = useCallback(async (
    participants: Chat['participants'],
    type: Chat['type'],
    relatedTo?: Chat['relatedTo']
  ): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const chatId = await ChatService.createChat(participants, type, relatedTo);
      console.log('Chat created:', chatId);
      return chatId;
    } catch (err) {
      console.error('Error creating chat:', err);
      setError(err instanceof Error ? err.message : 'Error al crear chat');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const findOrCreateChat = useCallback(async (
    userId: string,
    type: Chat['type'],
    relatedTo?: Chat['relatedTo']
  ): Promise<string> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const chatId = await ChatService.findOrCreateChat(user.uid, userId, type, relatedTo);
      console.log('Chat found or created:', chatId);
      return chatId;
    } catch (err) {
      console.error('Error finding or creating chat:', err);
      setError(err instanceof Error ? err.message : 'Error al buscar o crear chat');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const markAsRead = useCallback(async () => {
    if (!currentChat || !user?.uid) return;

    try {
      await ChatService.markMessagesAsRead(currentChat.id, user.uid);
      console.log('Messages marked as read');
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [currentChat, user?.uid]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (!currentChat || !user) return;

    const participant = currentChat.participants.find((p: Chat['participants'][0]) => p.userId === user.uid);
    if (!participant) return;

    ChatService.setTypingIndicator(
      currentChat.id,
      user.uid,
      participant.userName,
      isTyping
    ).catch((err: any) => {
      console.error('Error setting typing indicator:', err);
    });
  }, [currentChat, user]);

  const archiveChat = useCallback(async (chatId: string) => {
    try {
      setLoading(true);
      setError(null);
      await ChatService.archiveChat(chatId);
      console.log('Chat archived');
    } catch (err) {
      console.error('Error archiving chat:', err);
      setError(err instanceof Error ? err.message : 'Error al archivar chat');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const blockChat = useCallback(async (chatId: string) => {
    try {
      setLoading(true);
      setError(null);
      await ChatService.blockChat(chatId);
      console.log('Chat blocked');
    } catch (err) {
      console.error('Error blocking chat:', err);
      setError(err instanceof Error ? err.message : 'Error al bloquear chat');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCurrentChat = useCallback(() => {
    setCurrentChat(null);
    setMessages([]);
    setTypingIndicators([]);
  }, []);

  return {
    chats,
    currentChat,
    messages,
    typingIndicators,
    loading,
    error,
    selectChat,
    sendMessage,
    createChat,
    findOrCreateChat,
    markAsRead,
    setTyping,
    archiveChat,
    blockChat,
    clearCurrentChat,
  };
});
