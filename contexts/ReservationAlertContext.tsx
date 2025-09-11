import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
// expo-notifications removed due to SDK 53 compatibility
// import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import createContextHook from '@nkzw/create-context-hook';
import { useAppointments, Appointment } from './AppointmentsContext';

interface PendingReservation {
  id: string;
  appointment: Omit<Appointment, 'id'>;
  timestamp: number;
  autoAcceptAt: number; // timestamp when it will be auto-accepted
}

// Notification handler removed - using web-compatible alternatives only

export const [ReservationAlertProvider, useReservationAlert] = createContextHook(() => {
  const [pendingReservations, setPendingReservations] = useState<PendingReservation[]>([]);
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [webAudio, setWebAudio] = useState<HTMLAudioElement | null>(null);
  const { addAppointment } = useAppointments();
  const appState = useRef(AppState.currentState);
  const soundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSound = useCallback(async () => {
    try {
      // Use a web-compatible sound URL for the alert
      const soundUri = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
      
      if (Platform.OS === 'web') {
        // For web, create HTML5 Audio element with looping
        const audio = new window.Audio(soundUri);
        audio.loop = true;
        audio.volume = 0.7;
        setWebAudio(audio);
        return;
      }
      
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: soundUri },
        { shouldPlay: false, isLooping: true }
      );
      setSound(audioSound);
    } catch (error) {
      console.log('Error loading sound:', error);
    }
  }, []);

  // Load and prepare alert sound
  useEffect(() => {
    loadSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (webAudio) {
        webAudio.pause();
        webAudio.currentTime = 0;
      }
    };
  }, [loadSound]);

  const playAlertSound = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        if (webAudio) {
          webAudio.currentTime = 0;
          await webAudio.play();
        }
      } else if (sound) {
        await sound.playAsync();
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }, [sound, webAudio]);

  const stopAlertSound = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        if (webAudio) {
          webAudio.pause();
          webAudio.currentTime = 0;
        }
      } else if (sound) {
        await sound.stopAsync();
      }
    } catch (error) {
      console.log('Error stopping sound:', error);
    }
  }, [sound, webAudio]);

  const showNotification = useCallback(async (title: string, body: string) => {
    try {
      if (Platform.OS === 'web') {
        // For web, use browser notifications if permission is granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.png' });
        }
      } else {
        // Native notifications not available in Expo Go SDK 53
        // Using console log as fallback for mobile
        console.log(`Notification: ${title} - ${body}`);
      }
    } catch (error) {
      console.log('Error showing notification:', error);
    }
  }, []);

  const stopAlert = useCallback(() => {
    setIsAlertActive(false);
    
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    
    // Stop the looping sound
    stopAlertSound();
    
    console.log('Reservation alert stopped');
  }, [stopAlertSound]);

  const startAlert = useCallback(() => {
    setIsAlertActive(true);
    
    // Play looping sound immediately
    playAlertSound();
    
    console.log('Reservation alert started - sound will loop continuously for 20 seconds');
  }, [playAlertSound]);

  const checkForMissedReservations = useCallback(() => {
    if (pendingReservations.length > 0) {
      showNotification(
        'Reservas Pendientes',
        `Tienes ${pendingReservations.length} reserva(s) pendiente(s) de respuesta.`
      );
    }
  }, [pendingReservations.length, showNotification]);

  // Monitor app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        checkForMissedReservations();
      }
      appState.current = nextAppState;
    });

    return () => subscription?.remove();
  }, [checkForMissedReservations]);

  // Auto-accept reservations after 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPendingReservations(prev => {
        const toAutoAccept = prev.filter(reservation => now >= reservation.autoAcceptAt);
        const remaining = prev.filter(reservation => now < reservation.autoAcceptAt);
        
        // Auto-accept expired reservations
        toAutoAccept.forEach(reservation => {
          console.log('Auto-accepting reservation:', reservation.id);
          addAppointment(reservation.appointment);
          showNotification('Reserva Auto-Aceptada', `Reserva de ${reservation.appointment.clientName} fue aceptada automáticamente.`);
        });
        
        // Stop alert if no more pending reservations
        if (remaining.length === 0 && prev.length > 0) {
          stopAlert();
        }
        
        return remaining;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [addAppointment, stopAlert, showNotification]);

  const addNewReservation = useCallback((appointment: Omit<Appointment, 'id'>) => {
    const now = Date.now();
    const newReservation: PendingReservation = {
      id: `reservation_${now}`,
      appointment,
      timestamp: now,
      autoAcceptAt: now + 20000, // 20 seconds from now
    };
    
    setPendingReservations(prev => {
      const updated = [...prev, newReservation];
      
      // Start alert if this is the first pending reservation
      if (prev.length === 0) {
        startAlert();
      }
      
      return updated;
    });
    
    // Show notification
    showNotification(
      '¡Nueva Reserva Recibida!',
      `${appointment.clientName} ha solicitado ${appointment.service} para ${appointment.date} a las ${appointment.time}`
    );
    
    console.log('New reservation alert triggered:', newReservation);
  }, [startAlert, showNotification]);

  const acceptReservation = useCallback((reservationId: string) => {
    setPendingReservations(prev => {
      const reservation = prev.find(r => r.id === reservationId);
      if (reservation) {
        addAppointment(reservation.appointment);
        showNotification('Reserva Aceptada', `Reserva de ${reservation.appointment.clientName} ha sido aceptada.`);
        
        const remaining = prev.filter(r => r.id !== reservationId);
        
        // Stop alert if no more pending reservations
        if (remaining.length === 0) {
          stopAlert();
        }
        
        console.log('Reservation accepted manually:', reservationId);
        return remaining;
      }
      return prev;
    });
  }, [addAppointment, stopAlert, showNotification]);

  const dismissReservation = useCallback((reservationId: string) => {
    setPendingReservations(prev => {
      const reservation = prev.find(r => r.id === reservationId);
      if (reservation) {
        showNotification('Reserva Rechazada', `Reserva de ${reservation.appointment.clientName} ha sido rechazada.`);
        
        const remaining = prev.filter(r => r.id !== reservationId);
        
        // Stop alert if no more pending reservations
        if (remaining.length === 0) {
          stopAlert();
        }
        
        console.log('Reservation dismissed:', reservationId);
        return remaining;
      }
      return prev;
    });
  }, [stopAlert, showNotification]);

  // Simulate new reservation for testing
  const simulateNewReservation = useCallback(() => {
    const mockReservation: Omit<Appointment, 'id'> = {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      duration: 120,
      clientName: 'Cliente de Prueba',
      clientPhone: '+506 8888-9999',
      service: 'Limpieza Residencial',
      type: 'kompa2go',
      status: 'pending',
      notes: 'Reserva de prueba del sistema de alertas'
    };
    
    addNewReservation(mockReservation);
  }, [addNewReservation]);

  // Request notification permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } else {
        // Native notification permissions not available in Expo Go SDK 53
        console.log('Native notifications not available in Expo Go');
      }
    };
    
    requestPermissions();
  }, []);

  return useMemo(() => ({
    pendingReservations,
    isAlertActive,
    acceptReservation,
    dismissReservation,
    simulateNewReservation,
  }), [pendingReservations, isAlertActive, acceptReservation, dismissReservation, simulateNewReservation]);
});