// ID: AppointmentsContext_v4
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Appointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  clientName: string;
  service: string;
  type: 'kompa2go' | 'manual' | 'blocked' | 'dayoff' | 'personal';
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  providerId?: string;
  providerName?: string;
  // Nuevo campo para rastrear el flujo de confirmación
  confirmationPostpones: number; 
}

// Describe el estado actual del flujo de confirmación de una cita
export interface ConfirmationState {
  status: 'default' | 'pending_confirmation' | 'final_options';
  message: string;
  hoursUntilAppointment: number;
  postponeCount: number;
  canConfirm: boolean;
  canPostpone: boolean;
  postponeDuration?: 8 | 5;
  canReschedule: boolean;
  canCancel: boolean;
}

interface AppointmentsContextType {
  appointments: Appointment[];
  loading: boolean;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'confirmationPostpones'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getAppointmentsForDate: (date: string) => Appointment[];
  getTodayAppointments: () => Appointment[];
  getUpcomingAppointments: () => Appointment[];
  getConfirmationState: (appointment: Appointment) => ConfirmationState;
  refreshAppointments: () => Promise<void>;
  setUserTypeAndReload: (userType: string) => Promise<void>;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

// Datos de prueba actualizados para incluir citas en diferentes momentos
const clientMockAppointments: Appointment[] = [
  { id: 'c1', date: new Date().toISOString().split('T')[0], time: '18:00', duration: 120, clientName: 'Ana Cleaning', service: 'Limpieza Completa', type: 'kompa2go', status: 'confirmed', confirmationPostpones: 0 },
  // Cita para mañana a esta hora -> Entrará en el flujo de 24 horas
  { id: 'c2', date: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString().split('T')[0], time: new Date(Date.now() + 23 * 60 * 60 * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit'}), duration: 90, clientName: 'María Pro', service: 'Limpieza Ventanas', type: 'kompa2go', status: 'pending', confirmationPostpones: 0 },
  // Cita para dentro de 15 horas -> Ya pospuesta una vez
  { id: 'c3', date: new Date(Date.now() + 15 * 60 * 60 * 1000).toISOString().split('T')[0], time: new Date(Date.now() + 15 * 60 * 60 * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit'}), duration: 60, clientName: 'Carlos Detailing', service: 'Lavado Auto', type: 'kompa2go', status: 'pending', confirmationPostpones: 1 },
   // Cita para dentro de 7 horas -> Ya pospuesta dos veces
  { id: 'c4', date: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split('T')[0], time: new Date(Date.now() + 7 * 60 * 60 * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit'}), duration: 180, clientName: 'Sofia Garden', service: 'Jardinería', type: 'kompa2go', status: 'pending', confirmationPostpones: 2 },
  // Cita para dentro de 4 horas -> Opciones finales
  { id: 'c5', date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().split('T')[0], time: new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit'}), duration: 180, clientName: 'Juan Mecánica', service: 'Revisión General', type: 'kompa2go', status: 'pending', confirmationPostpones: 3 },
];

const mockAppointments: Appointment[] = [
  { id: '1', date: new Date().toISOString().split('T')[0], time: '09:00', duration: 120, clientName: 'María González', service: 'Limpieza Residencial', type: 'kompa2go', status: 'confirmed', confirmationPostpones: 0 },
  { id: '2', date: new Date().toISOString().split('T')[0], time: '11:30', duration: 90, clientName: 'Carlos Rodríguez', service: 'Limpieza de Oficina', type: 'kompa2go', status: 'confirmed', confirmationPostpones: 0 },
  { id: 'p3', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], time: '10:00', duration: 60, clientName: 'Reunión Interna', service: 'Planificación', type: 'manual', status: 'confirmed', confirmationPostpones: 0 },
];

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string>('client');
  
  const saveAppointments = useCallback(async (newAppointments: Appointment[]) => {
    const storageKey = userType === 'client' ? 'client_appointments' : 'appointments';
    await AsyncStorage.setItem(storageKey, JSON.stringify(newAppointments));
  }, [userType]);
  
  const loadAppointments = useCallback(async (currentUserType: string) => {
    setLoading(true);
    try {
      const storageKey = currentUserType === 'client' ? 'client_appointments' : 'appointments';
      const storedAppointments = await AsyncStorage.getItem(storageKey);
      
      if (storedAppointments) {
        setAppointments(JSON.parse(storedAppointments));
      } else {
        const mockData = currentUserType === 'client' ? clientMockAppointments : mockAppointments;
        setAppointments(mockData);
        await AsyncStorage.setItem(storageKey, JSON.stringify(mockData));
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      const mockData = currentUserType === 'client' ? clientMockAppointments : mockAppointments;
      setAppointments(mockData);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadAppointments(userType);
  }, [userType, loadAppointments]);

  const setUserTypeAndReload = useCallback(async (newUserType: string) => {
    if (newUserType !== userType) setUserType(newUserType);
  }, [userType]);

  const addAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id' | 'confirmationPostpones'>) => {
    const newAppointment: Appointment = { ...appointmentData, id: Date.now().toString(), confirmationPostpones: 0 };
    setAppointments(prev => {
      const updated = [...prev, newAppointment];
      saveAppointments(updated);
      return updated;
    });
  }, [saveAppointments]);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => {
        const updated = prev.map(app => app.id === id ? { ...app, ...updates } : app);
        saveAppointments(updated);
        return updated;
    });
  }, [saveAppointments]);

  const deleteAppointment = useCallback(async (id: string) => {
    setAppointments(prev => {
      const updated = prev.filter(app => app.id !== id);
      saveAppointments(updated);
      return updated;
    });
  }, [saveAppointments]);

  // --- EL CEREBRO DE LA LÓGICA DE CONFIRMACIÓN ---
  const getConfirmationState = (appointment: Appointment): ConfirmationState => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const baseState: Omit<ConfirmationState, 'status' | 'message'> = {
        hoursUntilAppointment,
        postponeCount: appointment.confirmationPostpones || 0,
        canConfirm: false, canPostpone: false, canReschedule: true, canCancel: true,
    };

    if (appointment.status !== 'pending' || appointment.type !== 'kompa2go' || hoursUntilAppointment > 24) {
      return { ...baseState, status: 'default', message: "Recuerda llegar 10 minutos antes de tu cita para una mejor experiencia." };
    }

    const postponeCount = baseState.postponeCount;

    // Etapa 4: Opciones finales (menos de 5 horas restantes O después de 3 posposiciones)
    if (postponeCount >= 3 || (postponeCount >=2 && hoursUntilAppointment <= 5) ) {
        return { ...baseState, status: 'final_options', message: "Última oportunidad: Tu cita es muy pronto. Por favor, toma una acción para respetar el tiempo del proveedor.", canConfirm: true, canReschedule: true, canCancel: true };
    }
    // Etapa 3: Segunda posposición (5 horas)
    if (postponeCount === 2 && hoursUntilAppointment <= (24 - 8 - 8)) {
        return { ...baseState, status: 'pending_confirmation', message: "Tu cita es pronto. Puedes posponer una última vez por 5 horas.", canConfirm: true, canPostpone: true, postponeDuration: 5 };
    }
    // Etapa 2: Primera posposición (8 horas)
    if (postponeCount === 1 && hoursUntilAppointment <= (24 - 8)) {
        return { ...baseState, status: 'pending_confirmation', message: "Recordatorio de tu cita. ¿Confirmas tu asistencia?", canConfirm: true, canPostpone: true, postponeDuration: 8 };
    }
    // Etapa 1: Primer recordatorio (24 horas)
    if (postponeCount === 0 && hoursUntilAppointment <= 24) {
        return { ...baseState, status: 'pending_confirmation', message: "Tu cita es en menos de 24 horas. Por favor, confirma tu asistencia.", canConfirm: true, canPostpone: true, postponeDuration: 8 };
    }
    
    return { ...baseState, status: 'default', message: "Has pospuesto la confirmación. Recibirás un nuevo recordatorio pronto." };
  };

  const getAppointmentsForDate = useCallback((date: string): Appointment[] => {
    return appointments.filter(appointment => appointment.date === date);
  }, [appointments]);

  const getTodayAppointments = useCallback((): Appointment[] => {
    const today = new Date().toISOString().split('T')[0];
    return getAppointmentsForDate(today);
  }, [getAppointmentsForDate]);

  const getUpcomingAppointments = useCallback((): Appointment[] => {
    const today = new Date().toISOString().split('T')[0];
    return appointments
      .filter(appointment => appointment.date > today && appointment.status === 'confirmed')
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [appointments]);

  const refreshAppointments = useCallback(async () => {
    await loadAppointments(userType);
  }, [userType, loadAppointments]);

  const value = {
    appointments,
    loading,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsForDate,
    getTodayAppointments,
    getUpcomingAppointments,
    getConfirmationState,
    refreshAppointments,
    setUserTypeAndReload
  };

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>;
}

export function useAppointments() {
  const context = useContext(AppointmentsContext);
  if (!context) throw new Error('useAppointments must be used within an AppointmentsProvider');
  return context;
}