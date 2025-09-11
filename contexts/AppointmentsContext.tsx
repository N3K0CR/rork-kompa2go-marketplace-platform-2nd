import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  duration: number; // in minutes
  clientName: string;
  clientPhone?: string;
  service: string;
  type: 'kompa2go' | 'manual' | 'blocked' | 'dayoff';
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  collaboratorId?: string;
  providerId?: string;
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
  getAvailableTimeSlotsForDate: (date: string, providerId?: string) => string[];
  getClientVisibleAppointments: (providerId: string) => Appointment[];
  refreshAppointments: () => Promise<void>;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

// Mock data for testing
const mockAppointments: Appointment[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0], // Today
    time: '09:00',
    duration: 120,
    clientName: 'María González',
    clientPhone: '+506 8888-1111',
    service: 'Limpieza Residencial',
    type: 'kompa2go',
    status: 'confirmed',
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0], // Today
    time: '11:30',
    duration: 90,
    clientName: 'Carlos Rodríguez',
    clientPhone: '+506 7777-2222',
    service: 'Limpieza de Oficina',
    type: 'kompa2go',
    status: 'confirmed',
  },
  {
    id: '3',
    date: new Date().toISOString().split('T')[0], // Today
    time: '14:00',
    duration: 60,
    clientName: 'Ana Pérez',
    service: 'Consulta Personal',
    type: 'manual',
    status: 'confirmed',
  },
  {
    id: '4',
    date: new Date().toISOString().split('T')[0], // Today
    time: '16:00',
    duration: 120,
    clientName: 'Luis Morales',
    clientPhone: '+506 6666-3333',
    service: 'Limpieza Profunda',
    type: 'kompa2go',
    status: 'confirmed',
  },
  {
    id: '5',
    date: new Date().toISOString().split('T')[0], // Today
    time: '10:00',
    duration: 240,
    clientName: 'Tiempo Bloqueado - Almuerzo',
    service: 'No disponible',
    type: 'blocked',
    status: 'confirmed',
  },
  // Tomorrow's appointments
  {
    id: '6',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '08:00',
    duration: 180,
    clientName: 'Patricia Jiménez',
    clientPhone: '+506 5555-4444',
    service: 'Limpieza Completa',
    type: 'kompa2go',
    status: 'confirmed',
  },
  {
    id: '7',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '15:00',
    duration: 60,
    clientName: 'Roberto Silva',
    service: 'Reunión',
    type: 'manual',
    status: 'confirmed',
  },
  // More appointments for different dates
  {
    id: '8',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '13:00',
    duration: 120,
    clientName: 'Sofía Vargas',
    clientPhone: '+506 4444-5555',
    service: 'Organización de Espacios',
    type: 'kompa2go',
    status: 'confirmed',
  },
  {
    id: '9',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '12:00',
    duration: 180,
    clientName: 'Tiempo Bloqueado - Capacitación',
    service: 'No disponible',
    type: 'blocked',
    status: 'confirmed',
  },
  {
    id: '10',
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '09:30',
    duration: 150,
    clientName: 'Diego Herrera',
    clientPhone: '+506 3333-6666',
    service: 'Limpieza Post-Construcción',
    type: 'kompa2go',
    status: 'confirmed',
  },
  {
    id: '11',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '11:00',
    duration: 90,
    clientName: 'Carmen López',
    service: 'Consulta Técnica',
    type: 'manual',
    status: 'confirmed',
  },
  {
    id: '12',
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '14:30',
    duration: 120,
    clientName: 'Fernando Castro',
    clientPhone: '+506 2222-7777',
    service: 'Mantenimiento General',
    type: 'kompa2go',
    status: 'confirmed',
  },
  {
    id: '13',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '00:00',
    duration: 1440, // Full day (24 hours * 60 minutes)
    clientName: 'Día Libre',
    service: 'No disponible - Día de descanso',
    type: 'dayoff',
    status: 'confirmed',
  },
  {
    id: '14',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '00:00',
    duration: 1440,
    clientName: 'Día Libre',
    service: 'No disponible - Día de descanso',
    type: 'dayoff',
    status: 'confirmed',
  }
];

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const loadAppointments = useCallback(async () => {
    try {
      const storedAppointments = await AsyncStorage.getItem('appointments');
      if (storedAppointments) {
        setAppointments(JSON.parse(storedAppointments));
      } else {
        // Load mock data for testing
        setAppointments(mockAppointments);
        await AsyncStorage.setItem('appointments', JSON.stringify(mockAppointments));
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      // Fallback to mock data
      setAppointments(mockAppointments);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAppointments = useCallback(async (newAppointments: Appointment[]) => {
    try {
      await AsyncStorage.setItem('appointments', JSON.stringify(newAppointments));
    } catch (error) {
      console.error('Error saving appointments:', error);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);



  const addAppointment = useCallback(async (appointmentData: Omit<Appointment, 'id'>) => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: Date.now().toString(),
    };
    
    const updatedAppointments = [...appointments, newAppointment];
    setAppointments(updatedAppointments);
    await saveAppointments(updatedAppointments);
    
    // Trigger real-time update
    setLastRefresh(Date.now());
    console.log('New appointment added - triggering real-time update:', newAppointment);
  }, [appointments, saveAppointments]);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    const updatedAppointments = appointments.map(appointment =>
      appointment.id === id ? { ...appointment, ...updates } : appointment
    );
    setAppointments(updatedAppointments);
    await saveAppointments(updatedAppointments);
    
    // Trigger real-time update
    setLastRefresh(Date.now());
    console.log('Appointment updated - triggering real-time update:', id, updates);
  }, [appointments, saveAppointments]);

  const deleteAppointment = useCallback(async (id: string) => {
    const updatedAppointments = appointments.filter(appointment => appointment.id !== id);
    setAppointments(updatedAppointments);
    await saveAppointments(updatedAppointments);
    
    // Trigger real-time update
    setLastRefresh(Date.now());
    console.log('Appointment deleted - triggering real-time update:', id);
  }, [appointments, saveAppointments]);

  const getAppointmentsForDate = useCallback((date: string): Appointment[] => {
    return appointments.filter(appointment => appointment.date === date);
  }, [appointments]);

  const getTodayAppointments = useCallback((): Appointment[] => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(appointment => appointment.date === today);
  }, [appointments]);

  const getUpcomingAppointments = useCallback((): Appointment[] => {
    const today = new Date().toISOString().split('T')[0];
    return appointments
      .filter(appointment => appointment.date > today && appointment.status === 'confirmed')
      .sort((a, b) => {
        if (a.date === b.date) {
          return a.time.localeCompare(b.time);
        }
        return a.date.localeCompare(b.date);
      });
  }, [appointments]);

  // Get available time slots for a specific date (client-side visibility)
  const getAvailableTimeSlotsForDate = useCallback((date: string, providerId?: string): string[] => {
    const workingHours = {
      start: 8, // 8:00 AM
      end: 18,  // 6:00 PM
      slotDuration: 60 // 60 minutes
    };
    
    const allTimeSlots: string[] = [];
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    // Get appointments for the specific date and provider
    const dayAppointments = appointments.filter(appointment => 
      appointment.date === date && 
      (providerId ? appointment.providerId === providerId : true)
    );
    
    // Filter out occupied time slots
    const availableSlots = allTimeSlots.filter(timeSlot => {
      return !dayAppointments.some(appointment => appointment.time === timeSlot);
    });
    
    console.log(`Available time slots for ${date}:`, availableSlots);
    return availableSlots;
  }, [appointments]);

  // Get appointments visible to clients (only availability, no details)
  const getClientVisibleAppointments = useCallback((providerId: string): Appointment[] => {
    // Clients should only see that time slots are occupied, not the details
    return appointments
      .filter(appointment => appointment.providerId === providerId)
      .map(appointment => ({
        ...appointment,
        // Hide sensitive information from clients
        clientName: 'Ocupado',
        clientPhone: undefined,
        service: 'No disponible',
        notes: undefined,
      }));
  }, [appointments]);

  // Manual refresh function for real-time updates
  const refreshAppointments = useCallback(async () => {
    console.log('Manually refreshing appointments...');
    await loadAppointments();
    setLastRefresh(Date.now());
  }, [loadAppointments]);

  const value = useMemo(() => ({
    appointments,
    loading,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsForDate,
    getTodayAppointments,
    getUpcomingAppointments,
    getAvailableTimeSlotsForDate,
    getClientVisibleAppointments,
    refreshAppointments,
  }), [appointments, loading, addAppointment, updateAppointment, deleteAppointment, getAppointmentsForDate, getTodayAppointments, getUpcomingAppointments, getAvailableTimeSlotsForDate, getClientVisibleAppointments, refreshAppointments]);

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentsContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
}