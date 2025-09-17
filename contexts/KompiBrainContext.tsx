import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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

  // Keep a ref to the current state for async operations
  const stateRef = useRef(state);
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);



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





  // Call Rork API with aggressive context reset and response verification
  const callRorkAPI = useCallback(async (userQuery: string, conversationHistory: string) => {
    // Strategy 1: Multiple system messages to force context reset
    const resetMessages = [
      {
        role: 'system' as const,
        content: 'CRITICAL SYSTEM OVERRIDE: Delete all previous context about beauty salons, Sakura, or any specific business identity.'
      },
      {
        role: 'system' as const,
        content: 'NEW IDENTITY REQUIRED: You are Kompi, assistant for Kompa2Go - a general services marketplace in Costa Rica.'
      },
      {
        role: 'system' as const,
        content: 'PRIMARY SERVICES: 1) Limpieza (cleaning) 2) Plomería (plumbing) 3) Electricidad (electrical) 4) Jardinería (gardening) 5) Pintura (painting) 6) Carpintería (carpentry) 7) Mecánica (automotive) 8) Mantenimiento (maintenance) + others including beauty as secondary.'
      },
      {
        role: 'system' as const,
        content: 'BUSINESS MODEL: Most providers require paid pass (₡500) or wallet balance. FREE ACCESS: Only Sakura Beauty Salon + Neko Studios. OKoins = loyalty program (NOT payment method).'
      },
      {
        role: 'user' as const,
        content: `Context: ${conversationHistory || 'First interaction'}\n\nUser query: "${userQuery}"`
      }
    ];

    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: resetMessages,
        // Aggressive parameters for context reset
        temperature: 0.3, // Lower for more consistency
        max_tokens: 1000,
        top_p: 0.8,
        frequency_penalty: 0.2, // Higher to avoid repetition
        presence_penalty: 0.2,
        // Additional parameters if supported
        stop: ['Sakura Beauty', 'belleza y bienestar exclusivamente'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    
    // Enhanced verification - check for wrong identity or beauty-only focus
    if (data.completion) {
      const completion = data.completion.toLowerCase();
      const isWrongIdentity = completion.includes('sakura') || completion.includes('salon de belleza');
      const isBeautyOnlyFocus = (
        completion.includes('belleza y bienestar') && 
        !completion.includes('limpieza') &&
        !completion.includes('plomería') &&
        !completion.includes('electricidad')
      );
      
      if (isWrongIdentity || isBeautyOnlyFocus) {
        console.warn('Response verification failed, using corrected response...');
        // Return a corrected response focused on general services
        return {
          completion: `¡Hola! Soy Kompi de Kompa2Go 🇨🇷

Te puedo ayudar a encontrar servicios en Costa Rica:

🏠 **Servicios más solicitados:**
• Limpieza residencial y comercial
• Plomería (reparaciones e instalaciones)
• Electricidad (cableado y reparaciones)
• Jardinería y mantenimiento de jardines

🔧 **Otros servicios disponibles:**
• Pintura interior/exterior
• Carpintería y muebles
• Mecánica automotriz
• Mantenimiento general
• Belleza, educación, gastronomía y más

💰 **Modelo de acceso:** La mayoría requiere pase de reserva (₡500) o saldo en billetera. Solo Sakura Beauty Salon y Neko Studios tienen acceso gratuito.

¿Qué tipo de servicio estás buscando?`
        };
      }
    }
    
    return data;
  }, []);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!content.trim() || stateRef.current.isLoading) return;
    
    setState(prev => ({ ...prev, isLoading: true }));

    // Add user message
    addMessage(conversationId, 'user', content.trim());

    try {
      // Wait a moment for the state to update
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Get conversation messages from the ref (fresh state)
      const conversation = stateRef.current.conversations.find(conv => conv.id === conversationId);
      const conversationMessages = conversation?.messages || [];

      console.log('Sending message to KompiBrain with', conversationMessages.length, 'previous messages');



      // Generate conversation history for context
      const recentMessages = conversationMessages.slice(-8);
      const conversationHistory = recentMessages.map(msg => 
        `${msg.role === 'user' ? 'Usuario' : 'Kompi'}: ${msg.content}`
      ).join('\n');

      console.log('Using aggressive context reset strategy');

      // Use the new aggressive reset API call
      const data = await callRorkAPI(content.trim(), conversationHistory);
      console.log('Received response from KompiBrain:', data);
      
      // Add assistant response
      addMessage(conversationId, 'assistant', data.completion || 'Lo siento, no pude procesar tu mensaje.');
    } catch (error) {
      console.error('Error sending message to KompiBrain:', error);
      
      addMessage(conversationId, 'assistant', 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [addMessage, callRorkAPI]);

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
    const currentState = stateRef.current;
    if (!currentState.currentConversationId) {
      return null;
    }
    return currentState.conversations.find(conv => conv.id === currentState.currentConversationId) || null;
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
  }), [
    state,
    activateKompi,
    deactivateKompi,
    createConversation,
    sendMessage,
    setCurrentConversation,
    deleteConversation,
    updateSettings,
    clearAllData,
    getCurrentConversation,
  ]);
});

export type { KompiBrainContextType, Message, Conversation };