import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  duration: number; // in minutes
  clientName: string;
  clientPhone?: string;
  service: string;
  type: 'kompa2go' | 'manual' | 'blocked' | 'dayoff' | 'personal';
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  collaboratorId?: string;
  providerId?: string;
  providerName?: string;
}

// Interfaz para un bloque de tiempo
interface TimeSlot {
  start: Date;
  end: Date;
}

interface AppointmentsContextType {
  appointments: Appointment[];
  loading: boolean;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getAppointmentsForDate: (date: string) => Appointment[];
  getTodayAppointments: () => Appointment[];
  getUpcomingAppointments: () => Appointment[];
  getClientFreeSlots: (date: string, serviceDuration: number) => TimeSlot[];
  refreshAppointments: () => Promise<void>;
  setUserTypeAndReload: (userType: string) => Promise<void>;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

// Mock data for testing - PROVIDER
const mockAppointments: Appointment[] = [
  { id: '1', date: new Date().toISOString().split('T')[0], time: '09:00', duration: 120, clientName: 'María González', service: 'Limpieza Residencial', type: 'kompa2go', status: 'confirmed' },
  { id: '2', date: new Date().toISOString().split('T')[0], time: '11:30', duration: 90, clientName: 'Carlos Rodríguez', service: 'Limpieza de Oficina', type: 'kompa2go', status: 'confirmed' },
  { id: 'p3', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], time: '10:00', duration: 60, clientName: 'Reunión Interna', service: 'Planificación', type: 'manual', status: 'confirmed' },
];

// Mock appointments for CLIENT view
const clientMockAppointments: Appointment[] = [
  { id: 'c1', date: new Date().toISOString().split('T')[0], time: '10:00', duration: 120, clientName: 'Ana Cleaning Services', service: 'Limpieza Completa', type: 'kompa2go', status: 'confirmed' },
  { id: 'c2', date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], time: '14:00', duration: 90, clientName: 'María Cleaning Pro', service: 'Limpieza de Ventanas', type: 'kompa2go', status: 'pending' },
];

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string>('provider');

  const getMockDataForUser = (type: string) => {
    return type === 'client' ? clientMockAppointments : mockAppointments;
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

  const addAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id'>) => {
    const newAppointment: Appointment = { ...appointmentData, id: Date.now().toString() };
    const updatedAppointments = [...appointments, newAppointment];
    setAppointments(updatedAppointments);
    await saveAppointments(updatedAppointments);
  }, [appointments, saveAppointments]);
  
  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    const updatedAppointments = appointments.map(app => app.id === id ? { ...app, ...updates } : app);
    setAppointments(updatedAppointments);
    await saveAppointments(updatedAppointments);
  }, [appointments, saveAppointments]);

  const deleteAppointment = useCallback(async (id: string) => {
    const updatedAppointments = appointments.filter(app => app.id !== id);
    setAppointments(updatedAppointments);
    await saveAppointments(updatedAppointments);
  }, [appointments, saveAppointments]);

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

  // --- ¡NUEVA FUNCIÓN! ---
  const getClientFreeSlots = useCallback((date: string, serviceDuration: number): TimeSlot[] => {
    const dayStart = new Date(`${date}T08:00:00`); // Asumimos un día de 8 AM
    const dayEnd = new Date(`${date}T20:00:00`);   // a 8 PM
    
    const clientBookedSlots = getAppointmentsForDate(date).map(app => {
        const start = new Date(`${app.date}T${app.time}`);
        const end = new Date(start.getTime() + app.duration * 60000);
        return { start, end };
    });

    let freeSlots: TimeSlot[] = [];
    let currentTime = dayStart;

    while (currentTime < dayEnd) {
      const potentialSlotEnd = new Date(currentTime.getTime() + serviceDuration * 60000);
      if (potentialSlotEnd > dayEnd) break;

      let isAvailable = true;
      for (const bookedSlot of clientBookedSlots) {
        // Comprobar si el slot potencial se solapa con un slot ocupado
        if (currentTime < bookedSlot.end && potentialSlotEnd > bookedSlot.start) {
          isAvailable = false;
          currentTime = bookedSlot.end; // Saltamos al final del slot ocupado
          break;
        }
      }

      if (isAvailable) {
        freeSlots.push({ start: new Date(currentTime), end: potentialSlotEnd });
        currentTime = new Date(currentTime.getTime() + 30 * 60000); // Avanzamos en intervalos de 30 min
      }
    }
    
    return freeSlots;
  }, [getAppointmentsForDate]);

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
    getClientFreeSlots,
    refreshAppointments,
    setUserTypeAndReload,
  };

  return <AppointmentsContext.Provider value={value}>{children}</AppointmentsContext.Provider>;
}

export function useAppointments() {
  const context = useContext(AppointmentsContext);
  if (!context) throw new Error('useAppointments must be used within an AppointmentsProvider');
  return context;
}