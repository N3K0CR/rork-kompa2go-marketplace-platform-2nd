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
  getAppointmentsForDate: (date: string) => Appointment[];
  getConfirmationState: (appointment: Appointment) => ConfirmationState;
  refreshAppointments: () => Promise<void>;
  setUserTypeAndReload: (userType: string) => Promise<void>;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

// Datos de prueba actualizados para incluir citas en diferentes momentos
const clientMockAppointments: Appointment[] = [
  { id: 'c1', date: new Date().toISOString().split('T')[0], time: '18:00', duration: 120, clientName: 'Ana Cleaning', service: 'Limpieza Completa', type: 'kompa2go', status: 'confirmed', confirmationPostpones: 0 },
  // Cita para mañana a esta hora -> Entrará en el flujo de 24 horas
  { id: 'c2', date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit'}), duration: 90, clientName: 'María Pro', service: 'Limpieza Ventanas', type: 'kompa2go', status: 'pending', confirmationPostpones: 0 },
  // Cita para dentro de 15 horas -> Ya pospuesta una vez
  { id: 'c3', date: new Date(Date.now() + 15 * 60 * 60 * 1000).toISOString().split('T')[0], time: new Date(Date.now() + 15 * 60 * 60 * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit'}), duration: 60, clientName: 'Carlos Detailing', service: 'Lavado Auto', type: 'kompa2go', status: 'pending', confirmationPostpones: 1 },
   // Cita para dentro de 4 horas -> Opciones finales
  { id: 'c4', date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().split('T')[0], time: new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit'}), duration: 180, clientName: 'Sofia Garden', service: 'Jardinería', type: 'kompa2go', status: 'pending', confirmationPostpones: 3 },
];

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string>('client'); // Default a cliente para pruebas

  const getMockDataForUser = (type: string) => {
    return type === 'client' ? clientMockAppointments : [];
  };

  const loadAppointments = useCallback(async (currentUserType: string) => {
    setLoading(true);
    try {
      const storageKey = currentUserType === 'client' ? 'client_appointments' : 'appointments';
      const storedAppointments = await AsyncStorage.getItem(storageKey);
      
      if (storedAppointments) {
        setAppointments(JSON.parse(storedAppointments));
      } else {
        const mockData = getMockDataForUser(currentUserType);
        setAppointments(mockData);
        await AsyncStorage.setItem(storageKey, JSON.stringify(mockData));
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments(getMockDataForUser(currentUserType));
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAppointments = useCallback(async (newAppointments: Appointment[]) => {
    try {
      const storageKey = userType === 'client' ? 'client_appointments' : 'appointments';
      await AsyncStorage.setItem(storageKey, JSON.stringify(newAppointments));
    } catch (error) {
      console.error('Error saving appointments:', error);
    }
  }, [userType]);

  useEffect(() => {
    loadAppointments(userType);
  }, [userType, loadAppointments]);

  const setUserTypeAndReload = useCallback(async (newUserType: string) => {
    if (newUserType !== userType) {
      setUserType(newUserType);
    }
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

  const getAppointmentsForDate = useCallback((date: string): Appointment[] => {
    return appointments.filter(appointment => appointment.date === date);
  }, [appointments]);

  // --- ¡NUEVO CEREBRO DE LA LÓGICA! ---
  const getConfirmationState = (appointment: Appointment): ConfirmationState => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const baseState = {
        hoursUntilAppointment,
        postponeCount: appointment.confirmationPostpones,
        canConfirm: false, canPostpone: false, canReschedule: false, canCancel: false,
    };

    if (appointment.status !== 'pending' || appointment.type !== 'kompa2go' || hoursUntilAppointment > 24) {
      return { ...baseState, status: 'default' as const, message: "Esta cita no requiere confirmación en este momento." };
    }

    // Lógica de recordatorios y acciones
    if (hoursUntilAppointment <= 5 && appointment.confirmationPostpones >= 3) {
      return { ...baseState, status: 'final_options' as const, message: "Última oportunidad: Por favor, toma una acción para respetar el tiempo del proveedor.", canConfirm: true, canReschedule: true, canCancel: true };
    }
    if (hoursUntilAppointment <= 8 && appointment.confirmationPostpones === 2) {
      return { ...baseState, status: 'pending_confirmation' as const, message: "Tu cita es pronto. Puedes posponer una última vez por 5 horas.", canConfirm: true, canPostpone: true, postponeDuration: 5 };
    }
    if (hoursUntilAppointment <= 16 && appointment.confirmationPostpones === 1) {
      return { ...baseState, status: 'pending_confirmation' as const, message: "Recordatorio de tu cita. ¿Confirmas tu asistencia?", canConfirm: true, canPostpone: true, postponeDuration: 8 };
    }
    if (hoursUntilAppointment <= 24 && appointment.confirmationPostpones === 0) {
      return { ...baseState, status: 'pending_confirmation' as const, message: "Tu cita es en menos de 24 horas. Por favor, confirma tu asistencia.", canConfirm: true, canPostpone: true, postponeDuration: 8 };
    }
    
    // Si está pendiente pero fuera de los rangos (ej. 17 horas y ya pospuso 1 vez)
    return { ...baseState, status: 'default' as const, message: "Has pospuesto la confirmación. Recibirás un nuevo recordatorio pronto." };
  };

  const refreshAppointments = useCallback(async () => {
    await loadAppointments(userType);
  }, [userType, loadAppointments]);

  const value = { appointments, loading, addAppointment, updateAppointment, getAppointmentsForDate, getConfirmationState, refreshAppointments, setUserTypeAndReload };

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>;
}

export function useAppointments() {
  const context = useContext(AppointmentsContext);
  if (!context) throw new Error('useAppointments must be used within an AppointmentsProvider');
  return context;
}