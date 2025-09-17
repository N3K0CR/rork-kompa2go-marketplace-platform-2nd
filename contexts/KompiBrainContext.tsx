import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';

interface KompiBrainState {
  isActive: boolean;
  conversations: {
    id: string;
    messages: {
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }[];
    title: string;
    createdAt: Date;
  }[];
  currentConversationId: string | null;
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
  addMessage: (conversationId: string, role: 'user' | 'assistant', content: string) => void;
  setCurrentConversation: (id: string | null) => void;
  deleteConversation: (id: string) => void;
  updateSettings: (settings: Partial<KompiBrainState['settings']>) => void;
  clearAllData: () => void;
}

type KompiBrainContextType = KompiBrainState & KompiBrainActions;



export const [KompiBrainProvider, useKompiBrain] = createContextHook<KompiBrainContextType>(() => {
  const [state, setState] = useState<KompiBrainState>({
    isActive: false,
    conversations: [],
    currentConversationId: null,
    settings: {
      autoSave: true,
      theme: 'light',
      language: 'es',
    },
  });

  const loadData = useCallback(async () => {
    try {
      // For now, we'll use a simple in-memory storage
      // This can be replaced with proper storage implementation later
      console.log('Loading KompiBrain data...');
    } catch (error) {
      console.error('Error loading KompiBrain data:', error);
    }
  }, []);

  const saveData = useCallback(async () => {
    try {
      // For now, we'll use a simple in-memory storage
      // This can be replaced with proper storage implementation later
      console.log('Saving KompiBrain data...');
    } catch (error) {
      console.error('Error saving KompiBrain data:', error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save data whenever state changes
  useEffect(() => {
    if (state.settings.autoSave) {
      saveData();
    }
  }, [state, saveData]);



  const activateKompi = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));
  }, []);

  const deactivateKompi = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));
  }, []);

  const createConversation = useCallback((title?: string): string => {
    const id = Date.now().toString();
    const newConversation = {
      id,
      messages: [],
      title: title || `Conversación ${state.conversations.length + 1}`,
      createdAt: new Date(),
    };
    
    setState(prev => ({
      ...prev,
      conversations: [...prev.conversations, newConversation],
      currentConversationId: id,
    }));
    
    return id;
  }, [state.conversations.length]);

  const addMessage = useCallback((conversationId: string, role: 'user' | 'assistant', content: string) => {
    const messageId = Date.now().toString();
    const newMessage = {
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

  return useMemo(() => ({
    ...state,
    activateKompi,
    deactivateKompi,
    createConversation,
    addMessage,
    setCurrentConversation,
    deleteConversation,
    updateSettings,
    clearAllData,
  }), [state, activateKompi, deactivateKompi, createConversation, addMessage, setCurrentConversation, deleteConversation, updateSettings, clearAllData]);
});

export type { KompiBrainContextType };