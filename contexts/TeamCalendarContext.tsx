import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment } from './AppointmentsContext';

interface Collaborator {
  id: string;
  name: string;
  alias: string;
  services: string[];
  avatar: string;
  isActive: boolean;
  schedule?: {
    [key: string]: { start: string; end: string; };
  };
}

interface TeamEvent {
  id: string;
  date: string;
  time: string;
  duration: number;
  title: string;
  type: 'kompa2go' | 'manual' | 'blocked' | 'dayoff' | 'personal';
  collaboratorId?: string;
  collaboratorName?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  clientName?: string;
  service?: string;
  notes?: string;
}

interface ConsolidatedCalendarData {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByCollaborator: Record<string, number>;
  upcomingEvents: TeamEvent[];
  todayEvents: TeamEvent[];
  weekEvents: TeamEvent[];
}

interface TeamCalendarContextType {
  collaborators: Collaborator[];
  loading: boolean;
  consolidatedData: ConsolidatedCalendarData;
  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => Promise<void>;
  updateCollaborator: (id: string, updates: Partial<Collaborator>) => Promise<void>;
  deleteCollaborator: (id: string) => Promise<void>;
  getTeamEventsForDate: (date: string) => TeamEvent[];
  getTeamEventsForDateRange: (startDate: string, endDate: string) => TeamEvent[];
  getCollaboratorEvents: (collaboratorId: string, date?: string) => TeamEvent[];
  refreshTeamCalendar: () => Promise<void>;
  getOptimizedEventSummary: (limit?: number) => TeamEvent[];
}

const TeamCalendarContext = createContext<TeamCalendarContextType | undefined>(undefined);

// Mock collaborators data
const mockCollaborators: Collaborator[] = [
  {
    id: '1',
    name: 'Luis Pérez',
    alias: 'Luis',
    services: ['Limpieza General', 'Limpieza Profunda'],
    avatar: '👨‍💼',
    isActive: true,
    schedule: {
      monday: { start: '08:00', end: '17:00' },
      tuesday: { start: '08:00', end: '17:00' },
      wednesday: { start: '08:00', end: '17:00' },
      thursday: { start: '08:00', end: '17:00' },
      friday: { start: '08:00', end: '17:00' },
    }
  },
  {
    id: '2',
    name: 'Carmen Solís',
    alias: 'Carmen',
    services: ['Organización', 'Limpieza de Ventanas'],
    avatar: '👩‍💼',
    isActive: true,
    schedule: {
      monday: { start: '09:00', end: '16:00' },
      tuesday: { start: '09:00', end: '16:00' },
      wednesday: { start: '09:00', end: '16:00' },
      thursday: { start: '09:00', end: '16:00' },
      friday: { start: '09:00', end: '16:00' },
    }
  },
  {
    id: '3',
    name: 'Roberto Jiménez',
    alias: 'Roberto',
    services: ['Mantenimiento', 'Reparaciones'],
    avatar: '👨‍🔧',
    isActive: true,
    schedule: {
      monday: { start: '07:00', end: '15:00' },
      tuesday: { start: '07:00', end: '15:00' },
      wednesday: { start: '07:00', end: '15:00' },
      thursday: { start: '07:00', end: '15:00' },
      friday: { start: '07:00', end: '15:00' },
    }
  },
];

export function TeamCalendarProvider({ children }: { children: ReactNode }) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Load appointments from AsyncStorage directly to avoid context dependency issues
  const loadAppointments = useCallback(async () => {
    try {
      const storedAppointments = await AsyncStorage.getItem('appointments');
      if (storedAppointments) {
        setAppointments(JSON.parse(storedAppointments));
      }
    } catch (error) {
      console.error('Error loading appointments in TeamCalendar:', error);
    }
  }, []);
  
  useEffect(() => {
    loadAppointments();
    // Refresh appointments periodically to stay in sync
    const interval = setInterval(loadAppointments, 10000); // Increased to 10 seconds to reduce load
    return () => clearInterval(interval);
  }, [loadAppointments]);

  const loadCollaborators = useCallback(async () => {
    try {
      const storedCollaborators = await AsyncStorage.getItem('team_collaborators');
      if (storedCollaborators) {
        setCollaborators(JSON.parse(storedCollaborators));
      } else {
        setCollaborators(mockCollaborators);
        await AsyncStorage.setItem('team_collaborators', JSON.stringify(mockCollaborators));
      }
    } catch (error) {
      console.error('Error loading collaborators:', error);
      setCollaborators(mockCollaborators);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveCollaborators = useCallback(async (newCollaborators: Collaborator[]) => {
    try {
      await AsyncStorage.setItem('team_collaborators', JSON.stringify(newCollaborators));
    } catch (error) {
      console.error('Error saving collaborators:', error);
    }
  }, []);

  useEffect(() => {
    loadCollaborators();
  }, [loadCollaborators]);

  // Convert appointments to team events with optimized data structure
  const convertToTeamEvents = useCallback((appointmentsList: Appointment[]): TeamEvent[] => {
    return appointmentsList.map(appointment => {
      const collaborator = collaborators.find(c => c.id === appointment.collaboratorId);
      return {
        id: appointment.id,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        title: appointment.clientName,
        type: appointment.type,
        collaboratorId: appointment.collaboratorId,
        collaboratorName: collaborator?.alias || 'Sin asignar',
        status: appointment.status,
        clientName: appointment.clientName,
        service: appointment.service,
        notes: appointment.notes,
      };
    });
  }, [collaborators]);

  // Highly optimized consolidated data calculation - minimal processing to prevent overload
  const consolidatedData = useMemo((): ConsolidatedCalendarData => {
    // Early return if no appointments to prevent unnecessary processing
    if (!appointments || appointments.length === 0) {
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsByCollaborator: {},
        upcomingEvents: [],
        todayEvents: [],
        weekEvents: [],
      };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Limit appointments processing to prevent data overload
    const limitedAppointments = appointments.slice(0, 50); // Reduced to 50 appointments
    const teamEvents = convertToTeamEvents(limitedAppointments);
    
    // Calculate summary statistics efficiently with limits
    const eventsByType: Record<string, number> = {};
    const eventsByCollaborator: Record<string, number> = {};
    const todayEvents: TeamEvent[] = [];
    const weekEvents: TeamEvent[] = [];
    const upcomingEvents: TeamEvent[] = [];
    
    // Process only essential data
    teamEvents.slice(0, 25).forEach(event => { // Reduced to 25 events for processing
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Count by collaborator (limit to prevent overflow)
      if (event.collaboratorId && Object.keys(eventsByCollaborator).length < 5) {
        eventsByCollaborator[event.collaboratorId] = (eventsByCollaborator[event.collaboratorId] || 0) + 1;
      }
      
      // Categorize by date with limits
      if (event.date === today && todayEvents.length < 3) {
        todayEvents.push(event);
      }
      
      if (event.date >= today && event.date <= weekFromNow && weekEvents.length < 5) {
        weekEvents.push(event);
      }
      
      if (event.date > today && event.status === 'confirmed' && upcomingEvents.length < 3) {
        upcomingEvents.push(event);
      }
    });
    
    // Minimal sorting
    upcomingEvents.sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalEvents: Math.min(teamEvents.length, 25), // Cap at 25 for display
      eventsByType,
      eventsByCollaborator,
      upcomingEvents: upcomingEvents.slice(0, 2), // Limit to 2 to prevent overload
      todayEvents: todayEvents.slice(0, 3).sort((a, b) => a.time.localeCompare(b.time)),
      weekEvents: weekEvents.slice(0, 5),
    };
  }, [appointments, convertToTeamEvents]);

  const addCollaborator = useCallback(async (collaboratorData: Omit<Collaborator, 'id'>) => {
    const newCollaborator: Collaborator = {
      ...collaboratorData,
      id: Date.now().toString(),
    };
    
    const updatedCollaborators = [...collaborators, newCollaborator];
    setCollaborators(updatedCollaborators);
    await saveCollaborators(updatedCollaborators);
    
    console.log('New collaborator added to team calendar:', newCollaborator);
  }, [collaborators, saveCollaborators]);

  const updateCollaborator = useCallback(async (id: string, updates: Partial<Collaborator>) => {
    const updatedCollaborators = collaborators.map(collaborator =>
      collaborator.id === id ? { ...collaborator, ...updates } : collaborator
    );
    setCollaborators(updatedCollaborators);
    await saveCollaborators(updatedCollaborators);
    
    console.log('Collaborator updated in team calendar:', id, updates);
  }, [collaborators, saveCollaborators]);

  const deleteCollaborator = useCallback(async (id: string) => {
    const updatedCollaborators = collaborators.filter(collaborator => collaborator.id !== id);
    setCollaborators(updatedCollaborators);
    await saveCollaborators(updatedCollaborators);
    
    console.log('Collaborator removed from team calendar:', id);
  }, [collaborators, saveCollaborators]);

  const getTeamEventsForDate = useCallback((date: string): TeamEvent[] => {
    const dayAppointments = appointments.filter(appointment => appointment.date === date);
    return convertToTeamEvents(dayAppointments);
  }, [appointments, convertToTeamEvents]);

  const getTeamEventsForDateRange = useCallback((startDate: string, endDate: string): TeamEvent[] => {
    const rangeAppointments = appointments.filter(appointment => 
      appointment.date >= startDate && appointment.date <= endDate
    );
    return convertToTeamEvents(rangeAppointments);
  }, [appointments, convertToTeamEvents]);

  const getCollaboratorEvents = useCallback((collaboratorId: string, date?: string): TeamEvent[] => {
    let filteredAppointments = appointments.filter(appointment => 
      appointment.collaboratorId === collaboratorId
    );
    
    if (date) {
      filteredAppointments = filteredAppointments.filter(appointment => appointment.date === date);
    }
    
    return convertToTeamEvents(filteredAppointments);
  }, [appointments, convertToTeamEvents]);

  const refreshTeamCalendar = useCallback(async () => {
    console.log('Refreshing team calendar data...');
    await loadCollaborators();
  }, [loadCollaborators]);

  // Highly optimized event summary to prevent data overload
  const getOptimizedEventSummary = useCallback((limit: number = 5): TeamEvent[] => {
    const today = new Date().toISOString().split('T')[0];
    
    // Limit processing to prevent overload
    const maxLimit = Math.min(limit, 5); // Never more than 5 events
    const limitedAppointments = appointments.slice(0, 50); // Process max 50 appointments
    
    const upcomingEvents = limitedAppointments
      .filter(appointment => appointment.date > today && appointment.status === 'confirmed')
      .slice(0, maxLimit) // Apply limit early
      .sort((a, b) => a.date.localeCompare(b.date)); // Simplified sorting
    
    return convertToTeamEvents(upcomingEvents);
  }, [appointments, convertToTeamEvents]);

  const value = useMemo(() => ({
    collaborators,
    loading,
    consolidatedData,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
    getTeamEventsForDate,
    getTeamEventsForDateRange,
    getCollaboratorEvents,
    refreshTeamCalendar,
    getOptimizedEventSummary,
  }), [
    collaborators,
    loading,
    consolidatedData,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
    getTeamEventsForDate,
    getTeamEventsForDateRange,
    getCollaboratorEvents,
    refreshTeamCalendar,
    getOptimizedEventSummary,
  ]);

  return (
    <TeamCalendarContext.Provider value={value}>
      {children}
    </TeamCalendarContext.Provider>
  );
}

export function useTeamCalendar() {
  const context = useContext(TeamCalendarContext);
  if (context === undefined) {
    throw new Error('useTeamCalendar must be used within a TeamCalendarProvider');
  }
  return context;
}

export type { Collaborator, TeamEvent, ConsolidatedCalendarData };