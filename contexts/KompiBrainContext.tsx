import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  messages: Message[];
  title: string;
  createdAt: Date;
}

interface KompiBrainState {
  isActive: boolean;
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  settings: {
    autoSave: boolean;
    theme: 'light' | 'dark';
    language: 'es' | 'en';
  };
}

interface KompiBrainActions {
  activateKompi: () => void;
  deactivateKompi: () => void;
  createConversation: (title?: string) => string;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  setCurrentConversation: (id: string | null) => void;
  deleteConversation: (id: string) => void;
  updateSettings: (settings: Partial<KompiBrainState['settings']>) => void;
  clearAllData: () => void;
  getCurrentConversation: () => Conversation | null;
}

type KompiBrainContextType = KompiBrainState & KompiBrainActions;



export const [KompiBrainProvider, useKompiBrain] = createContextHook<KompiBrainContextType>(() => {
  const [state, setState] = useState<KompiBrainState>({
    isActive: false,
    conversations: [],
    currentConversationId: null,
    isLoading: false,
    settings: {
      autoSave: true,
      theme: 'light',
      language: 'es',
    },
  });



  const activateKompi = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));
  }, []);

  const deactivateKompi = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  const createConversation = useCallback((title?: string): string => {
    const id = Date.now().toString();
    
    setState(prev => {
      const newConversation: Conversation = {
        id,
        messages: [],
        title: title || `Conversación ${prev.conversations.length + 1}`,
        createdAt: new Date(),
      };
      
      return {
        ...prev,
        conversations: [...prev.conversations, newConversation],
        currentConversationId: id,
      };
    });
    
    return id;
  }, []);

  const addMessage = useCallback((conversationId: string, role: 'user' | 'assistant' | 'system', content: string) => {
    const messageId = Date.now().toString();
    const newMessage: Message = {
      id: messageId,
      role,
      content,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      conversations: prev.conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, newMessage] }
          : conv
      ),
    }));
  }, []);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    setState(prev => {
      if (!content.trim() || prev.isLoading) return prev;
      return { ...prev, isLoading: true };
    });

    // Add user message
    addMessage(conversationId, 'user', content.trim());

    try {
      // Get current conversation messages for context
      let conversationMessages: Message[] = [];
      setState(prev => {
        const conversation = prev.conversations.find(conv => conv.id === conversationId);
        conversationMessages = conversation?.messages || [];
        return prev;
      });

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Eres KompiBrain, un asistente inteligente para la aplicación Sakura Beauty Salon. Ayudas a usuarios con preguntas sobre servicios de belleza, reservas, y funcionalidades de la app. Responde de manera amigable y profesional en español.',
            },
            ...conversationMessages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            {
              role: 'user',
              content: content.trim(),
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add assistant response
      addMessage(conversationId, 'assistant', data.completion || 'Lo siento, no pude procesar tu mensaje.');
    } catch (error) {
      console.error('Error sending message to KompiBrain:', error);
      
      addMessage(conversationId, 'assistant', 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [addMessage]);

  const setCurrentConversation = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, currentConversationId: id }));
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      conversations: prev.conversations.filter(conv => conv.id !== id),
      currentConversationId: prev.currentConversationId === id ? null : prev.currentConversationId,
    }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<KompiBrainState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      setState({
        isActive: false,
        conversations: [],
        currentConversationId: null,
        isLoading: false,
        settings: {
          autoSave: true,
          theme: 'light',
          language: 'es',
        },
      });
    } catch (error) {
      console.error('Error clearing KompiBrain data:', error);
    }
  }, []);

  const getCurrentConversation = useCallback((): Conversation | null => {
    let result: Conversation | null = null;
    setState(prev => {
      if (!prev.currentConversationId) {
        result = null;
      } else {
        result = prev.conversations.find(conv => conv.id === prev.currentConversationId) || null;
      }
      return prev;
    });
    return result;
  }, []);

  return useMemo(() => ({
    ...state,
    activateKompi,
    deactivateKompi,
    createConversation,
    sendMessage,
    setCurrentConversation,
    deleteConversation,
    updateSettings,
    clearAllData,
    getCurrentConversation,
  }), [state, activateKompi, deactivateKompi, createConversation, sendMessage, setCurrentConversation, deleteConversation, updateSettings, clearAllData, getCurrentConversation]);
});

export type { KompiBrainContextType, Message, Conversation };