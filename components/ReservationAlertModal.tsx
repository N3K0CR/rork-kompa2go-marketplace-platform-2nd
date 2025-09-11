import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { Bell, Check, X, Clock } from 'lucide-react-native';
import { useReservationAlert } from '@/contexts/ReservationAlertContext';

export function ReservationAlertModal() {
  const { pendingReservations, isAlertActive, acceptReservation, dismissReservation } = useReservationAlert();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: number }>({});
  const { width } = useWindowDimensions();

  const currentReservation = pendingReservations[0]; // Show the first pending reservation

  useEffect(() => {
    if (isAlertActive && currentReservation) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isAlertActive, currentReservation, fadeAnim, scaleAnim]);

  // Update countdown timer
  useEffect(() => {
    if (!pendingReservations.length) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const newTimeLeft: { [key: string]: number } = {};
      
      pendingReservations.forEach(reservation => {
        const remaining = Math.max(0, reservation.autoAcceptAt - now);
        newTimeLeft[reservation.id] = Math.ceil(remaining / 1000);
      });
      
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingReservations]);

  if (!isAlertActive || !currentReservation) {
    return null;
  }

  const handleAccept = () => {
    acceptReservation(currentReservation.id);
  };

  const handleDismiss = () => {
    dismissReservation(currentReservation.id);
  };

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  const progressPercentage = ((20 - (timeLeft[currentReservation.id] || 0)) / 20) * 100;

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        }
      ]}
      pointerEvents={isAlertActive ? 'auto' : 'none'}
    >
      <View style={[styles.modalContainer, { width: width * 0.9 }]}>
        <AlertContent />
      </View>
    </Animated.View>
  );

  function AlertContent() {
    return (
      <Animated.View 
        style={[
          styles.alertContainer,
          {
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        {/* Header with icon and title */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Bell size={32} color="#fff" />
          </View>
          <Text style={styles.title}>¡Nueva Reserva!</Text>
        </View>

        {/* Reservation details */}
        <View style={styles.content}>
          <Text style={styles.clientName}>{currentReservation.appointment.clientName}</Text>
          <Text style={styles.service}>{currentReservation.appointment.service}</Text>
          
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Fecha:</Text>
            <Text style={styles.detailValue}>
              {new Date(currentReservation.appointment.date).toLocaleDateString('es-CR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Hora:</Text>
            <Text style={styles.detailValue}>{currentReservation.appointment.time}</Text>
          </View>
          
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Duración:</Text>
            <Text style={styles.detailValue}>{currentReservation.appointment.duration} min</Text>
          </View>

          {currentReservation.appointment.clientPhone && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>Teléfono:</Text>
              <Text style={styles.detailValue}>{currentReservation.appointment.clientPhone}</Text>
            </View>
          )}
        </View>

        {/* Countdown timer */}
        <View style={styles.timerContainer}>
          <View style={styles.timerRow}>
            <Clock size={20} color="#ff6b35" />
            <Text style={styles.timerText}>
              Auto-aceptar en: {formatTime(timeLeft[currentReservation.id] || 0)}
            </Text>
          </View>
          
          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercentage}%` }
                ]}
              />
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.dismissButton]} 
            onPress={handleDismiss}
            testID="dismiss-reservation-button"
          >
            <X size={20} color="#fff" />
            <Text style={styles.buttonText}>Rechazar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.acceptButton]} 
            onPress={handleAccept}
            testID="accept-reservation-button"
          >
            <Check size={20} color="#fff" />
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>

        {/* Additional reservations indicator */}
        {pendingReservations.length > 1 && (
          <View style={styles.additionalIndicator}>
            <Text style={styles.additionalText}>
              +{pendingReservations.length - 1} reserva(s) más pendiente(s)
            </Text>
          </View>
        )}
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  alertContainer: {
    backgroundColor: 'transparent',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff6b35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#333',
    textAlign: 'center',
  },
  content: {
    marginBottom: 20,
  },
  clientName: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  service: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  timerContainer: {
    backgroundColor: '#fff3f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffe0d6',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ff6b35',
    marginLeft: 8,
  },
  progressBarContainer: {
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#ffe0d6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ff6b35',
    borderRadius: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dismissButton: {
    backgroundColor: '#f44336',
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  additionalIndicator: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    alignItems: 'center',
  },
  additionalText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500' as const,
  },
});