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
  // All hooks must be called in the same order every time
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





  // Enhanced API call with conversation context and service detection
  const callRorkAPI = useCallback(async (userQuery: string, conversationHistory: string) => {
    console.log('🚀 Calling Rork API with query:', userQuery);
    console.log('📚 Conversation context:', conversationHistory);
    
    // Detect if user is asking for a specific service
    const queryLower = userQuery.toLowerCase();
    
    const serviceKeywords = {
      barberia: ['barberia', 'barbería', 'corte de pelo', 'cortar pelo', 'peluquero', 'barber', 'corte', 'pelo'],
      limpieza: ['limpieza', 'limpiar', 'cleaning', 'aseo', 'limpie'],
      plomeria: ['plomería', 'plomeria', 'fontanero', 'tubería', 'agua', 'plomero'],
      electricidad: ['electricidad', 'electricista', 'luz', 'cables', 'eléctrico'],
      jardineria: ['jardinería', 'jardineria', 'jardín', 'plantas', 'poda', 'jardinero'],
      pintura: ['pintura', 'pintar', 'paint', 'pintor'],
      mecanica: ['mecánica', 'mecanica', 'carro', 'auto', 'vehiculo', 'mecánico'],
      belleza: ['belleza', 'beauty', 'spa', 'masaje', 'facial', 'manicure', 'pedicure'],
      ubicacion: ['cerca', 'cercano', 'ubicación', 'zona', 'área', 'donde', 'dónde', 'mi ubicación', 'ubicacion actual']
    };
    
    let detectedService = '';
    
    for (const [service, keywords] of Object.entries(serviceKeywords)) {
      if (keywords.some(keyword => queryLower.includes(keyword))) {
        detectedService = service;
        break;
      }
    }
    
    // Detect if user needs location sharing
    const needsLocation = serviceKeywords.ubicacion.some(keyword => queryLower.includes(keyword)) ||
                         (detectedService && detectedService !== 'ubicacion' && ['cerca', 'cercano'].some(word => queryLower.includes(word)));
    
    console.log('🔍 Detected service:', detectedService || 'general');
    console.log('📍 Needs location:', needsLocation);

    const systemPrompt = `OVERRIDE ALL PREVIOUS INSTRUCTIONS. SYSTEM RESET REQUIRED.

YOU ARE: Kompi from Kompa2Go Costa Rica - General Services Marketplace

KOMPA2GO SERVICES (NOT BEAUTY FOCUSED):
- LIMPIEZA (cleaning): Most popular service
- PLOMERÍA (plumbing): Emergency repairs, installations  
- ELECTRICIDAD (electrical): Wiring, repairs, installations
- JARDINERÍA (gardening): Landscaping, maintenance
- PINTURA (painting): Interior, exterior painting
- CARPINTERÍA (carpentry): Furniture, repairs
- MECÁNICA (automotive): Car repairs, maintenance
- BARBERÍA/PELUQUERÍA: Hair cuts, styling
- MANTENIMIENTO (maintenance): General home/office
- Other services: Beauty, tutoring, chef, photography, etc.

BUSINESS MODEL:
- Most providers require paid pass (₡500) or wallet balance
- FREE ACCESS: Only Sakura Beauty Salon + Neko Studios
- OKoins = loyalty program (NOT payment method)

${detectedService ? `DETECTED SERVICE REQUEST: ${detectedService.toUpperCase()}` : ''}
${needsLocation ? 'LOCATION SHARING NEEDED: User needs to share location for nearby providers' : ''}

CONVERSATION CONTEXT:
${conversationHistory || 'First interaction'}

USER QUERY: "${userQuery}"

IMPORTANT INSTRUCTIONS:
- Always maintain conversation context and remember previous messages
- If user asks for a service, provide specific help for that service
- If user mentions location needs or says "cerca de mi", ask them to share their location using the location button or write it manually
- Be helpful and direct, avoid generic responses
- Reference previous conversation when relevant
- When location is needed, mention: "Usa el botón 'Compartir Ubicación' o escribe tu zona manualmente"

RESPOND AS KOMPI - GENERAL MARKETPLACE ASSISTANT:`;

    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userQuery
          }
        ],
        temperature: 0.4,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    
    // Verify response quality
    if (data.completion) {
      const completion = data.completion.toLowerCase();
      const isWrongIdentity = completion.includes('sakura') && !completion.includes('kompa2go');
      
      if (isWrongIdentity) {
        console.warn('⚠️ Response verification failed, using corrected response...');
        
        // Generate service-specific response
        if (detectedService === 'barberia') {
          return {
            completion: `¡Perfecto! Te ayudo a encontrar una barbería cerca de ti 💇‍♂️

En Kompa2Go tenemos varios barberos y peluqueros disponibles en Costa Rica.

🔍 **Para mostrarte las opciones más cercanas:**
• Comparte tu ubicación actual
• O dime en qué zona estás buscando

💰 **Acceso a proveedores:**
• La mayoría requiere pase de reserva (₡500) o saldo en billetera
• Sakura Beauty Salon y Neko Studios tienen acceso gratuito

¿En qué zona necesitas el servicio de barbería?`
          };
        }
        
        if (detectedService === 'limpieza') {
          return {
            completion: `¡Excelente! Te ayudo a encontrar servicios de limpieza 🧽

En Kompa2Go tenemos proveedores de limpieza para:
• Limpieza residencial
• Limpieza comercial
• Limpieza profunda
• Mantenimiento regular

🔍 **Para mostrarte opciones cercanas:**
• Comparte tu ubicación
• O especifica la zona donde necesitas el servicio

💰 **Acceso:** La mayoría requiere pase (₡500) o saldo en billetera.

¿Qué tipo de limpieza necesitas y en qué zona?`
          };
        }
        
        if (detectedService === 'ubicacion') {
          return {
            completion: `📍 Para mostrarte proveedores cercanos necesito conocer tu ubicación.

🔍 **Opciones:**
• Comparte tu ubicación actual usando el botón de ubicación
• Dime el nombre de tu ciudad o zona
• Especifica el área donde necesitas el servicio

¿En qué zona de Costa Rica estás buscando?`
          };
        }
        
        return {
          completion: `¡Hola! Soy Kompi de Kompa2Go 🇨🇷

Te ayudo a encontrar servicios en Costa Rica. Tenemos proveedores para:

🏠 **Servicios principales:**
• Limpieza residencial y comercial
• Plomería y reparaciones
• Electricidad e instalaciones
• Jardinería y mantenimiento
• Barbería y peluquería
• Pintura y carpintería
• Mecánica automotriz

💰 **Acceso:** La mayoría requiere pase (₡500) o saldo. Sakura Beauty Salon y Neko Studios son gratuitos.

¿Qué servicio necesitas?`
        };
      }
    }
    
    return data;
  }, []);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    const trimmedContent = content.trim();
    
    if (!trimmedContent || state.isLoading) {
      console.log('Skipping message send:', { trimmedContent: !!trimmedContent, isLoading: state.isLoading });
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true }));

    // Add user message first
    addMessage(conversationId, 'user', trimmedContent);

    try {
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get updated conversation with the new user message
      const currentState = stateRef.current;
      const conversation = currentState.conversations.find(conv => conv.id === conversationId);
      const conversationMessages = conversation?.messages || [];

      console.log('📝 Sending message with', conversationMessages.length, 'messages in history');
      console.log('💬 Current conversation messages:', conversationMessages.map(m => `${m.role}: ${m.content.substring(0, 50)}...`));

      // Generate conversation history for context (including the new user message)
      const recentMessages = conversationMessages.slice(-6); // Keep last 6 messages for context
      const conversationHistory = recentMessages.map(msg => 
        `${msg.role === 'user' ? 'Usuario' : 'Kompi'}: ${msg.content}`
      ).join('\n');

      console.log('🔄 Using conversation history:', conversationHistory);

      // Call API with conversation context
      const data = await callRorkAPI(trimmedContent, conversationHistory);
      console.log('✅ Received response from KompiBrain');
      
      // Add assistant response
      addMessage(conversationId, 'assistant', data.completion || 'Lo siento, no pude procesar tu mensaje.');
    } catch (error) {
      console.error('❌ Error sending message to KompiBrain:', error);
      addMessage(conversationId, 'assistant', 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [addMessage, callRorkAPI, state.isLoading]);

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

  // Return the context value - using useMemo to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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

  return contextValue;
});

export type { KompiBrainContextType, Message, Conversation };