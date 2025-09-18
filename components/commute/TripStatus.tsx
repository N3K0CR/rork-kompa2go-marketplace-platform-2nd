import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { 
  Play, 
  Pause, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Navigation,
  MessageCircle,
  Phone,
  X
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';
import { Trip } from '@/backend/trpc/routes/commute/types';

interface TripStatusProps {
  trip: Trip;
  onStart?: (trip: Trip) => void;
  onPause?: (trip: Trip) => void;
  onResume?: (trip: Trip) => void;
  onComplete?: (trip: Trip) => void;
  onCancel?: (trip: Trip) => void;
  onEmergency?: (trip: Trip) => void;
  onContactDriver?: (trip: Trip) => void;
  onContactPassenger?: (trip: Trip) => void;
  userRole?: 'driver' | 'passenger';
  showActions?: boolean;
  compact?: boolean;
}

export default function TripStatus({
  trip,
  onStart,
  onPause,
  onResume,
  onComplete,
  onCancel,
  onEmergency,
  onContactDriver,
  onContactPassenger,
  userRole = 'passenger',
  showActions = true,
  compact = false
}: TripStatusProps) {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculate elapsed time for active trips
  useEffect(() => {
    if (trip.status === 'in_progress' && trip.startTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(trip.startTime);
        const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [trip.status, trip.startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (trip.status) {
      case 'planned':
        return Colors.neutral[500];
      case 'in_progress':
        return Colors.success[500];
      case 'completed':
        return Colors.primary[500];
      case 'cancelled':
        return Colors.error[500];
      default:
        return Colors.neutral[400];
    }
  };

  const getStatusText = () => {
    switch (trip.status) {
      case 'planned':
        return 'Planificado';
      case 'in_progress':
        return 'En progreso';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const getStatusIcon = () => {
    switch (trip.status) {
      case 'planned':
        return <Clock size={16} color={getStatusColor()} />;
      case 'in_progress':
        return <Navigation size={16} color={getStatusColor()} />;
      case 'completed':
        return <CheckCircle size={16} color={getStatusColor()} />;
      case 'cancelled':
        return <X size={16} color={getStatusColor()} />;
      default:
        return <Clock size={16} color={getStatusColor()} />;
    }
  };

  const handleStart = () => {
    if (!trip?.id?.trim()) return;
    console.log('🚀 TripStatus: Starting trip:', trip.id);
    onStart?.(trip);
  };

  const handlePause = () => {
    if (!trip?.id?.trim()) return;
    console.log('⏸️ TripStatus: Pausing trip:', trip.id);
    onPause?.(trip);
  };

  const handleResume = () => {
    if (!trip?.id?.trim()) return;
    console.log('▶️ TripStatus: Resuming trip:', trip.id);
    onResume?.(trip);
  };

  const handleComplete = () => {
    if (!trip?.id?.trim()) return;
    console.log('✅ TripStatus: Completing trip:', trip.id);
    onComplete?.(trip);
  };

  const handleCancel = () => {
    if (!trip?.id?.trim()) return;
    console.log('❌ TripStatus: Cancelling trip:', trip.id);
    onCancel?.(trip);
  };

  const handleEmergency = () => {
    if (!trip?.id?.trim()) return;
    console.log('🚨 TripStatus: Emergency alert:', trip.id);
    setShowEmergencyModal(true);
    onEmergency?.(trip);
  };

  const handleContact = () => {
    if (!trip?.id?.trim()) return;
    if (userRole === 'driver') {
      console.log('📞 TripStatus: Contacting passenger:', trip.id);
      onContactPassenger?.(trip);
    } else {
      console.log('📞 TripStatus: Contacting driver:', trip.id);
      onContactDriver?.(trip);
    }
  };

  const renderProgressBar = () => {
    if (trip.status !== 'in_progress' || !trip.actualDuration) return null;
    
    const progress = trip.actualDuration / (trip.actualDuration + 300); // Estimate remaining time
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${Math.min(progress * 100, 100)}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progress * 100)}% completado
        </Text>
      </View>
    );
  };

  const renderTripStats = () => {
    return (
      <View style={styles.statsContainer}>
        {trip.status === 'in_progress' && (
          <View style={styles.statItem}>
            <Clock size={14} color={Colors.primary[500]} />
            <Text style={styles.statText}>
              {formatTime(elapsedTime)}
            </Text>
          </View>
        )}
        
        {trip.actualDistance && (
          <View style={styles.statItem}>
            <MapPin size={14} color={Colors.neutral[600]} />
            <Text style={styles.statText}>
              {(trip.actualDistance / 1000).toFixed(1)} km
            </Text>
          </View>
        )}
        
        {trip.actualCost && (
          <View style={styles.statItem}>
            <Text style={styles.costText}>₡{trip.actualCost}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderActions = () => {
    if (!showActions) return null;

    const actions = [];

    // Trip control actions
    if (trip.status === 'planned' && userRole === 'driver') {
      actions.push(
        <TouchableOpacity
          key="start"
          style={[styles.actionButton, styles.startButton]}
          onPress={handleStart}
          activeOpacity={0.7}
        >
          <Play size={16} color="white" />
          <Text style={styles.actionButtonText}>Iniciar</Text>
        </TouchableOpacity>
      );
    }

    if (trip.status === 'in_progress') {
      if (userRole === 'driver') {
        actions.push(
          <TouchableOpacity
            key="pause"
            style={[styles.actionButton, styles.pauseButton]}
            onPress={handlePause}
            activeOpacity={0.7}
          >
            <Pause size={16} color="white" />
            <Text style={styles.actionButtonText}>Pausar</Text>
          </TouchableOpacity>
        );
        
        actions.push(
          <TouchableOpacity
            key="complete"
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleComplete}
            activeOpacity={0.7}
          >
            <CheckCircle size={16} color="white" />
            <Text style={styles.actionButtonText}>Completar</Text>
          </TouchableOpacity>
        );
      }
    }

    // Communication actions
    actions.push(
      <TouchableOpacity
        key="contact"
        style={[styles.actionButton, styles.contactButton]}
        onPress={handleContact}
        activeOpacity={0.7}
      >
        <MessageCircle size={16} color={Colors.primary[500]} />
        <Text style={[styles.actionButtonText, { color: Colors.primary[500] }]}>
          {userRole === 'driver' ? 'Pasajero' : 'Conductor'}
        </Text>
      </TouchableOpacity>
    );

    // Emergency action
    actions.push(
      <TouchableOpacity
        key="emergency"
        style={[styles.actionButton, styles.emergencyButton]}
        onPress={handleEmergency}
        activeOpacity={0.7}
      >
        <AlertTriangle size={16} color={Colors.error[500]} />
        <Text style={[styles.actionButtonText, { color: Colors.error[500] }]}>
          Emergencia
        </Text>
      </TouchableOpacity>
    );

    return (
      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <React.Fragment key={index}>{action}</React.Fragment>
        ))}
      </View>
    );
  };

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <View style={styles.compactHeader}>
          <View style={styles.statusIndicator}>
            {getStatusIcon()}
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          
          {trip.status === 'in_progress' && (
            <Text style={styles.elapsedTime}>
              {formatTime(elapsedTime)}
            </Text>
          )}
        </View>
        
        {renderTripStats()}
      </View>
    );
  }

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.statusIndicator}>
            {getStatusIcon()}
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          
          <View style={styles.tripInfo}>
            <Text style={styles.tripId}>Viaje #{trip.id.slice(-6)}</Text>
            {trip.startTime && (
              <Text style={styles.startTime}>
                Inicio: {new Date(trip.startTime).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            )}
          </View>
        </View>

        {renderProgressBar()}
        {renderTripStats()}

        {trip.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notas:</Text>
            <Text style={styles.notesText}>{trip.notes}</Text>
          </View>
        )}

        {renderActions()}
      </View>

      {/* Emergency Modal */}
      <Modal
        visible={showEmergencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmergencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.emergencyModal}>
            <View style={styles.emergencyHeader}>
              <AlertTriangle size={24} color={Colors.error[500]} />
              <Text style={styles.emergencyTitle}>Alerta de Emergencia</Text>
              <TouchableOpacity
                onPress={() => setShowEmergencyModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.neutral[600]} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.emergencyContent}>
              <Text style={styles.emergencyDescription}>
                Se ha activado una alerta de emergencia para este viaje. Los servicios de emergencia han sido notificados automáticamente.
              </Text>
              
              <View style={styles.emergencyActions}>
                <TouchableOpacity style={styles.emergencyCallButton}>
                  <Phone size={20} color="white" />
                  <Text style={styles.emergencyCallText}>Llamar 911</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.emergencyContactButton}>
                  <MessageCircle size={20} color={Colors.primary[500]} />
                  <Text style={styles.emergencyContactText}>Contactar Soporte</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.emergencyNote}>
                Tu ubicación y detalles del viaje han sido compartidos con los contactos de emergencia.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    ...Shadows.base,
  },
  compactCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginBottom: Spacing[2],
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  statusText: {
    ...Typography.textStyles.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
  },
  tripInfo: {
    alignItems: 'flex-end',
  },
  tripId: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
  },
  startTime: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
  },
  elapsedTime: {
    ...Typography.textStyles.h6,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.bold,
  },
  progressContainer: {
    marginBottom: Spacing[3],
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing[1],
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success[500],
    borderRadius: 3,
  },
  progressText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    marginBottom: Spacing[3],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  statText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.medium,
  },
  costText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.bold,
  },
  notesContainer: {
    backgroundColor: Colors.neutral[50],
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[3],
  },
  notesLabel: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[1],
  },
  notesText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[700],
    lineHeight: Typography.lineHeight.relaxed,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.md,
    gap: Spacing[1],
    minWidth: 80,
  },
  actionButtonText: {
    ...Typography.textStyles.bodySmall,
    fontWeight: Typography.fontWeight.medium,
  },
  startButton: {
    backgroundColor: Colors.success[500],
  },
  pauseButton: {
    backgroundColor: Colors.warning[500],
  },
  completeButton: {
    backgroundColor: Colors.primary[500],
  },
  contactButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary[300],
  },
  emergencyButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.error[300],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  emergencyModal: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...Shadows.xl,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    gap: Spacing[3],
  },
  emergencyTitle: {
    ...Typography.textStyles.h6,
    color: Colors.error[600],
    flex: 1,
  },
  closeButton: {
    padding: Spacing[1],
  },
  emergencyContent: {
    padding: Spacing[4],
  },
  emergencyDescription: {
    ...Typography.textStyles.body,
    color: Colors.neutral[700],
    lineHeight: Typography.lineHeight.relaxed,
    marginBottom: Spacing[4],
  },
  emergencyActions: {
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  emergencyCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error[500],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
    gap: Spacing[2],
  },
  emergencyCallText: {
    ...Typography.textStyles.button,
    color: 'white',
  },
  emergencyContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary[300],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
    gap: Spacing[2],
  },
  emergencyContactText: {
    ...Typography.textStyles.button,
    color: Colors.primary[500],
  },
  emergencyNote: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});