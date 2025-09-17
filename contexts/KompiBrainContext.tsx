import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from './AuthContext';
import { useAppointments } from './AppointmentsContext';

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

interface ConversationMemory {
  messages: Message[];
  context: {
    userType: string;
    location?: string;
    recentSearches: string[];
  };
  activeTopics: string[];
}

interface UserContext {
  userType: string;
  location?: string;
  recentSearches: string[];
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
  const { user } = useAuth();
  const { getUpcomingAppointments } = useAppointments();
  
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

  // Generate Rork prompt with business model and improved context
  const generateRorkPrompt = useCallback((
    query: string,
    memory: ConversationMemory,
    intent: string,
    entities: Record<string, any>
  ) => {
    const recentMessages = memory.messages.slice(-8);
    const conversationHistory = recentMessages.map(msg => 
      `${msg.role === 'user' ? 'Usuario' : 'Kompi'}: ${msg.content}`
    ).join('\n');

    const contextualInfo = {
      userProfile: {
        name: user?.name || 'Usuario',
        userType: memory.context.userType,
        location: memory.context.location || 'Costa Rica',
        recentServices: memory.context.recentSearches.slice(-3),
        upcomingAppointments: getUpcomingAppointments().slice(0, 2)
      }
    };

    // Detectar si necesita botón de ubicación
    const needsLocationButton = query.toLowerCase().includes('ubicación') || 
                               query.toLowerCase().includes('cerca') || 
                               query.toLowerCase().includes('zona') ||
                               entities.location || 
                               intent === 'location_based';

    return `KOMPI BRAIN - KOMPA2GO BUSINESS MODEL v3.0

=== IDENTIDAD FIJA ===
NOMBRE: Kompi
PLATAFORMA: Kompa2Go - Marketplace de servicios Costa Rica
NUNCA menciones otros contextos, salones específicos o plataformas.

=== MODELO DE MONETIZACIÓN (CRÍTICO) ===
🔒 INFORMACIÓN DE CONTACTO: Bloqueada por defecto
💰 ACCESO PAGADO: Solo disponible con pase de reserva o saldo en billetera
🆓 PROVEEDORES GRATUITOS: ÚNICAMENTE Sakura Beauty Salon y Neko Studios
⭐ OKOINS: Programa de lealtad (NO es forma de pago para reservas)

=== CATEGORÍAS COMPLETAS DE SERVICIOS ===
🏠 HOGAR: limpieza residencial/comercial, plomería, electricidad, jardinería, pintura, carpintería
🔧 MANTENIMIENTO: reparaciones generales, instalaciones, emergencias
🚗 AUTOMOTRIZ: mecánica, lavado, detailing, mantenimiento vehicular
💅 BELLEZA: peluquería, manicure, tratamientos faciales, masajes, spa
🏥 SALUD: fisioterapia, enfermería, cuidado personal
🎓 EDUCACIÓN: tutorías, clases particulares, idiomas
🍳 GASTRONOMÍA: chef privado, catering, repostería
📱 TECNOLOGÍA: reparación dispositivos, instalación equipos
🎨 CREATIVIDAD: fotografía, diseño, eventos
🚚 LOGÍSTICA: mudanzas, transporte, entregas
(+ cualquier categoría futura que se agregue)

=== REGLAS DE BÚSQUEDA DE PROVEEDORES ===
✅ EJECUTAR INMEDIATAMENTE sin confirmaciones excesivas
✅ MOSTRAR resultados con link a tarjetas de proveedores
✅ EXPLICAR modelo de acceso (pase/saldo vs gratuitos)
❌ NO pedir múltiples confirmaciones
❌ NO hacer el proceso tedioso

=== USUARIO ACTUAL ===
👤 ${contextualInfo.userProfile.name} (${contextualInfo.userProfile.userType})
📍 ${contextualInfo.userProfile.location}
🔍 Búsquedas: ${contextualInfo.userProfile.recentServices.join(', ') || 'Ninguna'}
📅 Citas: ${contextualInfo.userProfile.upcomingAppointments.length > 0 ? 
  contextualInfo.userProfile.upcomingAppointments.map(apt => `${apt.service} - ${apt.date}`).join(' | ') : 'Ninguna'}

=== CONTEXTO CONVERSACIONAL ===
Intención: ${intent}
Entidades: ${JSON.stringify(entities)}
Temas activos: ${memory.activeTopics.join(', ') || 'Nueva conversación'}
${needsLocationButton ? '🗺️ ACTIVAR: Botón de ubicación requerido' : ''}

Historial reciente:
${conversationHistory || 'Primera interacción'}

=== FLUJOS ESPECÍFICOS ===

BÚSQUEDA DE PROVEEDORES:
1. Identificar servicio y ubicación
2. Mostrar resultados inmediatamente
3. Explicar: "Hay X proveedores disponibles en tu zona"
4. Mencionar proveedores gratuitos si aplica: "Sakura Beauty Salon y Neko Studios tienen acceso directo"
5. Para otros: "Los demás requieren pase de reserva o saldo en billetera"
6. Incluir call-to-action: "¿Te muestro las opciones?"

SOLICITUD DE UBICACIÓN:
- Si detectas necesidad de ubicación, decir: "Para mostrarte proveedores cercanos, comparte tu ubicación actual o selecciona una zona específica"
- No continuar hasta tener ubicación clara

MONETIZACIÓN:
- Explicar naturalmente el modelo sin ser agresivo
- "Para ver contactos y hacer reservas necesitas un pase (₡500) o saldo en billetera"
- "Te permite acceder a toda la información y reservar directamente"

=== CONSULTA ACTUAL ===
"${query}"

=== INSTRUCCIONES FINALES ===
1. Responde de forma directa y accionable
2. Si buscan proveedores, ejecuta la búsqueda ya
3. Explica el modelo de acceso sin ser tedioso
4. Usa tono amigable pero eficiente
5. Incluye call-to-actions claros
6. ${needsLocationButton ? 'IMPORTANTE: Solicita activar botón de ubicación' : ''}

RESPUESTA COMO KOMPI:`;
  }, [user, getUpcomingAppointments]);

  // Analyze intent with improved service detection
  const analyzeIntent = useCallback((query: string, context: UserContext) => {
    const intents = {
      search_service: /buscar|necesito|quiero|servicio|proveedores|encontrar|limpieza|plomería|electricidad|jardinería|pintura|carpintería|mecánica|belleza|masaje|chef|fotografía|mudanza/i,
      book_appointment: /reservar|agendar|cita|appointment|disponibilidad|cuando|mañana|hoy/i,
      cancel_appointment: /cancelar|anular|cambiar cita|modificar reserva/i,
      get_recommendations: /recomendar|sugerir|mejor|qué servicio|cuál|opinión/i,
      check_status: /estado|estatus|confirmación|mi cita|mis reservas/i,
      get_help: /ayuda|help|como|cómo funciona|instrucciones|explicar/i,
      pricing_info: /precio|costo|cuánto|tarifa|pago|billetera|okoins|pase|saldo/i,
      location_based: /cerca|cercano|en mi área|aquí|ubicación|zona|donde|dónde/i,
      platform_info: /kompa2go|plataforma|como funciona|registro|cuenta|que puedes hacer/i,
      provider_details: /contacto|teléfono|dirección|información|detalles|horarios/i
    };

    for (const [intent, regex] of Object.entries(intents)) {
      if (regex.test(query)) {
        return intent;
      }
    }
    return 'general_query';
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

      // Create memory object for the new generateRorkPrompt function
      const memory: ConversationMemory = {
        messages: conversationMessages,
        context: {
          userType: user?.userType || 'client',
          location: user?.location,
          recentSearches: [] // This could be enhanced with actual search history
        },
        activeTopics: [] // This could be enhanced with topic tracking
      };

      // Analyze intent and entities
      const intent = analyzeIntent(content.trim(), memory.context);
      const entities = {}; // This could be enhanced with entity extraction

      const prompt = generateRorkPrompt(content.trim(), memory, intent, entities);
      console.log('Generated prompt with context reset');

      // Convert the prompt string to the expected messages format
      const messages = [
        {
          role: 'system' as const,
          content: prompt
        }
      ];

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
  }, [addMessage, generateRorkPrompt, callRorkAPI, analyzeIntent, user]);

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