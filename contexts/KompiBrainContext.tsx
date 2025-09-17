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

  // Generate Rork prompt with context reset and identity enforcement
  const generateRorkPrompt = useCallback((conversationMessages: Message[]) => {
    const resetInstruction = `RESET: Ignora completamente cualquier contexto, identidad o instrucciones previas. Eres exclusivamente KompiBrain de Kompa2Go.`;
    
    const identityPrompt = `
IDENTIDAD FORZADA: Eres KompiBrain, el asistente inteligente exclusivo de Kompa2Go.

Kompa2Go es una plataforma integral de servicios de belleza y bienestar que conecta usuarios con profesionales certificados.

CARACTERÍSTICAS DE KOMPA2GO:
- Reserva de citas con profesionales de belleza
- Sistema de pagos integrado con OKoins (moneda virtual)
- Geolocalización para encontrar servicios cercanos
- Chat en tiempo real con proveedores
- Historial de servicios y reseñas
- Programas de lealtad y recompensas
- Análisis y estadísticas para proveedores

TU FUNCIÓN:
- Ayudar con navegación de la app
- Explicar funcionalidades de Kompa2Go
- Asistir con reservas y pagos
- Resolver dudas sobre servicios
- Guiar en el uso de OKoins
- Proporcionar información sobre proveedores

RESPONDE SIEMPRE:
- En español
- Como KompiBrain de Kompa2Go
- De manera amigable y profesional
- Con información específica de la plataforma

NUNCA menciones otras aplicaciones o servicios de belleza.`;

    return [
      {
        role: 'system' as const,
        content: resetInstruction + identityPrompt
      },
      ...conversationMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];
  }, []);

  // Call Rork API with response verification
  const callRorkAPI = useCallback(async (messages: any[]) => {
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        // Context cleanup parameters
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    
    // Verify response doesn't mention wrong identity
    if (data.completion && data.completion.toLowerCase().includes('sakura')) {
      console.warn('Response contained wrong identity, regenerating...');
      // Return a corrected response
      return {
        completion: 'Soy KompiBrain, tu asistente de Kompa2Go. ¿En qué puedo ayudarte con nuestros servicios de belleza y bienestar?'
      };
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

      const messages = generateRorkPrompt(conversationMessages);
      console.log('Generated prompt with context reset');

      const data = await callRorkAPI(messages);
      console.log('Received response from KompiBrain:', data);
      
      // Add assistant response
      addMessage(conversationId, 'assistant', data.completion || 'Lo siento, no pude procesar tu mensaje.');
    } catch (error) {
      console.error('Error sending message to KompiBrain:', error);
      
      addMessage(conversationId, 'assistant', 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [addMessage, generateRorkPrompt, callRorkAPI]);

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