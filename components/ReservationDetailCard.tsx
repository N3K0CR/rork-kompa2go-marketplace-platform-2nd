import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { XCircle, MessageCircle, Calendar, Clock, X, CheckCircle } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useChat } from '@/contexts/ChatContext';
import { useProvider } from '@/contexts/ProviderContext';
import { router } from 'expo-router';

interface ReservationDetailCardProps {
  reservation: any;
  onClose?: () => void;
  showHeader?: boolean;
}

export default function ReservationDetailCard({ reservation, onClose, showHeader = true }: ReservationDetailCardProps) {
  const { user } = useAuth();
  const { updateAppointment } = useAppointments();
  const { createChat, sendMessage } = useChat();
  const { businessHours } = useProvider();
  const userType = user?.userType || 'client';
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);





  const handleCancelReservation = () => {
    console.log('❌ Cancel button pressed for reservation:', reservation);
    console.log('UpdateAppointment function available:', !!updateAppointment);
    
    if (!reservation?.id) {
      console.error('❌ No reservation ID found');
      Alert.alert('Error', 'No se pudo identificar la reserva.');
      return;
    }
    
    Alert.alert(
      '⚠️ Cancelar Reserva',
      userType === 'client' ? 
        'POLÍTICA DE CANCELACIÓN:\n\n• La comisión pagada NO será reembolsada\n• El proveedor será notificado inmediatamente\n• Esta acción no se puede deshacer\n\n¿Estás completamente seguro?' :
        'Esta acción cancelará la reserva y notificará al cliente inmediatamente.\n\n¿Confirmas la cancelación?',
      [
        { text: 'No, Mantener', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Starting cancellation for reservation:', reservation.id);
              
              if (!updateAppointment) {
                throw new Error('updateAppointment function not available');
              }
              
              await updateAppointment(reservation.id, { 
                status: 'cancelled',
                notes: (reservation.notes || '') + ` [Cancelada por ${userType} el ${new Date().toLocaleString('es-ES')}${userType === 'client' ? ' - Comisión no reembolsable' : ''}]`
              });
              
              console.log('✅ Reservation cancelled successfully');
              Alert.alert(
                '❌ Reserva Cancelada', 
                userType === 'client' ? 
                  'Tu reserva ha sido cancelada. La comisión no es reembolsable.' :
                  'La reserva ha sido cancelada y el cliente ha sido notificado.'
              );
              onClose?.();
            } catch (error) {
              console.error('❌ Error cancelling reservation:', error);
              Alert.alert('Error', `No se pudo cancelar la reserva: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
          }
        }
      ]
    );
  };

  const handleReschedule = () => {
    console.log('📅 Reschedule button pressed for reservation:', reservation);
    setShowRescheduleModal(true);
  };

  const getAvailableTimeSlots = (date: Date) => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const dayName = dayNames[date.getDay()];
    const dayHours = businessHours[dayName];
    
    if (!dayHours?.isOpen) {
      return [];
    }
    
    const slots: string[] = [];
    const [openHour, openMinute] = dayHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.closeTime.split(':').map(Number);
    
    const serviceDuration = reservation.duration || 60; // Default to 60 minutes
    const slotInterval = 30; // 30-minute intervals
    
    let currentHour = openHour;
    let currentMinute = openMinute;
    
    while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
      // Check if there's enough time for the service before closing
      const minutesUntilClose = (closeHour - currentHour) * 60 + (closeMinute - currentMinute);
      if (minutesUntilClose >= serviceDuration) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
      
      // Move to next slot
      currentMinute += slotInterval;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    
    return slots;
  };

  const getNextSevenDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  const handleFinishReschedule = async () => {
    console.log('🎯 Finalizar button pressed - Starting fail-proof rescheduling process');
    console.log('Selected date:', selectedDate);
    console.log('Selected time:', selectedTime);
    console.log('Reservation ID:', reservation?.id);
    console.log('UpdateAppointment function available:', !!updateAppointment);
    
    // Comprehensive validation
    if (!selectedDate || !selectedTime) {
      console.log('❌ Missing date or time selection');
      Alert.alert('Error de Validación', 'Por favor selecciona una fecha y hora antes de finalizar la reprogramación.');
      return;
    }
    
    if (!reservation?.id) {
      console.error('❌ No reservation ID found');
      Alert.alert('Error del Sistema', 'No se pudo identificar la reserva. Por favor intenta nuevamente.');
      return;
    }
    
    if (!updateAppointment) {
      console.error('❌ updateAppointment function not available');
      Alert.alert('Error del Sistema', 'Función de actualización no disponible. Por favor reinicia la aplicación.');
      return;
    }
    
    // Show confirmation dialog
    Alert.alert(
      '🎯 Finalizar Reprogramación',
      `¿Confirmas que deseas reprogramar esta cita?\n\n📅 Nueva fecha: ${selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}\n⏰ Nueva hora: ${selectedTime}\n🔧 Servicio: ${reservation.service}\n⏱️ Duración: ${reservation.duration} minutos\n\nEsta acción no se puede deshacer.`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => console.log('Reschedule finalization cancelled by user')
        },
        {
          text: 'Finalizar',
          style: 'default',
          onPress: async () => {
            try {
              console.log('✅ User confirmed - Starting rescheduling process for reservation:', reservation.id);
              console.log('New date:', selectedDate.toISOString());
              console.log('New time:', selectedTime);
              
              // Prepare update data with comprehensive information
              const updateData = {
                date: selectedDate.toISOString().split('T')[0], // Use date format YYYY-MM-DD
                time: selectedTime,
                status: 'confirmed' as const, // Set as confirmed after successful rescheduling
                notes: (reservation.notes || '') + ` [Reprogramada por ${userType} el ${new Date().toLocaleString('es-ES')} - Fecha anterior: ${reservation.date} ${reservation.time}]`
              };
              
              console.log('Update data prepared:', updateData);
              
              // Execute the update with error handling
              await updateAppointment(reservation.id, updateData);
              
              console.log('✅ Reservation rescheduled successfully');
              
              // Play success sound notification
              if (Platform.OS !== 'web') {
                try {
                  const { sound } = await Audio.Sound.createAsync(
                    { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
                    { shouldPlay: true, volume: 0.6 }
                  );
                  setTimeout(() => {
                    sound.unloadAsync();
                  }, 2000);
                } catch (soundError) {
                  console.log('Success sound notification failed:', soundError);
                }
              }
              
              // Show success message
              Alert.alert(
                '✅ Reprogramación Finalizada', 
                `Tu reserva ha sido reprogramada exitosamente para el ${selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${selectedTime}.\n\nEl ${userType === 'client' ? 'proveedor' : 'cliente'} será notificado automáticamente.`,
                [
                  {
                    text: 'Entendido',
                    onPress: () => {
                      // Reset modal state and close
                      setShowRescheduleModal(false);
                      setSelectedDate(null);
                      setSelectedTime(null);
                      onClose?.();
                    }
                  }
                ]
              );
              
            } catch (error) {
              console.error('❌ Error during rescheduling process:', error);
              
              // Detailed error handling
              let errorMessage = 'Error desconocido';
              if (error instanceof Error) {
                errorMessage = error.message;
              }
              
              Alert.alert(
                '❌ Error en la Reprogramación', 
                `No se pudo completar la reprogramación:\n\n${errorMessage}\n\nPor favor verifica tu conexión e intenta nuevamente.`,
                [
                  {
                    text: 'Reintentar',
                    onPress: () => handleFinishReschedule()
                  },
                  {
                    text: 'Cancelar',
                    style: 'cancel'
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  const handleConfirmAttendance = async () => {
    console.log('✅ Confirm attendance button pressed for reservation:', reservation);
    console.log('UpdateAppointment function available:', !!updateAppointment);
    
    if (!reservation?.id) {
      console.error('❌ No reservation ID found');
      Alert.alert('Error', 'No se pudo identificar la reserva.');
      return;
    }
    
    Alert.alert(
      '✅ Confirmar Asistencia',
      userType === 'client' ? 
        'Confirmas que asistirás a esta cita? El proveedor será notificado inmediatamente.' :
        'Confirmas que el cliente asistió a esta cita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            try {
              console.log('✅ Starting attendance confirmation for reservation:', reservation.id);
              
              if (!updateAppointment) {
                throw new Error('updateAppointment function not available');
              }
              
              // Play sound alert for provider notification
              if (Platform.OS !== 'web') {
                try {
                  const { sound } = await Audio.Sound.createAsync(
                    { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
                    { shouldPlay: true, volume: 0.8 }
                  );
                  setTimeout(() => {
                    sound.unloadAsync();
                  }, 3000);
                } catch (soundError) {
                  console.log('Sound notification failed:', soundError);
                }
              }
              
              await updateAppointment(reservation.id, { 
                status: 'confirmed',
                notes: (reservation.notes || '') + ` [Asistencia confirmada por ${userType} el ${new Date().toLocaleString('es-ES')}]`
              });
              
              console.log('✅ Attendance confirmed successfully');
              Alert.alert(
                '✅ Asistencia Confirmada', 
                userType === 'client' ? 
                  'Tu asistencia ha sido confirmada. El proveedor ha sido notificado.' :
                  'La asistencia del cliente ha sido confirmada.'
              );
              onClose?.();
            } catch (error) {
              console.error('❌ Error confirming attendance:', error);
              Alert.alert('Error', `No se pudo confirmar la asistencia: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
          }
        }
      ]
    );
  };

  const handleChatContact = async () => {
    console.log('💬 Chat button pressed for reservation:', reservation);
    console.log('Chat functions available:', { createChat: !!createChat, sendMessage: !!sendMessage });
    
    if (!reservation?.id) {
      console.error('❌ No reservation ID found');
      Alert.alert('Error', 'No se pudo identificar la reserva.');
      return;
    }
    
    try {
      if (!createChat) {
        throw new Error('createChat function not available');
      }
      
      const providerId = reservation.providerId || 'provider_' + reservation.id;
      const providerName = reservation.providerName || reservation.clientName;
      console.log('Creating chat with:', { providerId, providerName });
      
      const chatId = await createChat(providerId, providerName);
      console.log('Chat created with ID:', chatId);
      
      onClose?.();
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('❌ Error opening chat:', error);
      Alert.alert('Error', `No se pudo abrir el chat: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Detalles de Reserva</Text>
        </View>
      )}
      
      <ScrollView style={styles.content}>
        {/* Reservation Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información de la Reserva</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha:</Text>
            <Text style={styles.detailValue}>
              {new Date(reservation.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hora:</Text>
            <Text style={styles.detailValue}>{reservation.time}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duración:</Text>
            <Text style={styles.detailValue}>{reservation.duration} minutos</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Servicio:</Text>
            <Text style={styles.detailValue}>{reservation.service}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {userType === 'client' ? 'Proveedor:' : 'Cliente:'}
            </Text>
            <Text style={styles.detailValue}>{reservation.clientName}</Text>
          </View>
          
          {reservation.clientPhone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Teléfono:</Text>
              <Text style={styles.detailValue}>{reservation.clientPhone}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estado:</Text>
            <View style={[
              styles.statusBadge,
              reservation.status === 'confirmed' && styles.statusConfirmed,
              reservation.status === 'pending' && styles.statusPending,
              reservation.status === 'cancelled' && styles.statusCancelled
            ]}>
              <Text style={styles.statusText}>
                {reservation.status === 'confirmed' ? 'Confirmada' :
                 reservation.status === 'pending' ? 'Pendiente' : 'Cancelada'}
              </Text>
            </View>
          </View>
          
          {reservation.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notas:</Text>
              <Text style={styles.detailValue}>{reservation.notes}</Text>
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Administrar Reserva</Text>
          
          {/* Confirm Attendance Action */}
          {reservation.status !== 'cancelled' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.confirmAttendanceButton]}
              onPress={handleConfirmAttendance}
              activeOpacity={0.7}
            >
              <CheckCircle size={20} color="white" />
              <Text style={styles.actionButtonText}>Confirmar asistencia</Text>
            </TouchableOpacity>
          )}
          
          {/* Reschedule Action */}
          {reservation.status !== 'cancelled' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={handleReschedule}
              activeOpacity={0.7}
            >
              <Calendar size={20} color="white" />
              <Text style={styles.actionButtonText}>Reprogramar</Text>
            </TouchableOpacity>
          )}
          
          {/* Cancel Action */}
          {reservation.status !== 'cancelled' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelReservation}
              activeOpacity={0.7}
            >
              <XCircle size={20} color="white" />
              <Text style={styles.actionButtonText}>Cancelar Reserva</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          
          <View style={styles.contactButtonsRow}>
            <TouchableOpacity 
              style={[styles.contactButton, styles.kompa2goButton]}
              onPress={handleChatContact}
              activeOpacity={0.7}
            >
              <MessageCircle size={18} color="white" />
              <Text style={styles.contactButtonText}>Chat Kompa2Go</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reprogramar Cita</Text>
              <TouchableOpacity 
                onPress={() => setShowRescheduleModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSectionTitle}>Selecciona una fecha:</Text>
              <View style={styles.dateGrid}>
                {getNextSevenDays().map((date) => {
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
                  const dayNumber = date.getDate();
                  const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
                  
                  return (
                    <TouchableOpacity
                      key={date.toISOString()}
                      style={[
                        styles.dateCard,
                        isSelected && styles.dateCardSelected
                      ]}
                      onPress={() => {
                        setSelectedDate(date);
                        setSelectedTime(null); // Reset time when date changes
                      }}
                    >
                      <Text style={[
                        styles.dateCardDay,
                        isSelected && styles.dateCardTextSelected
                      ]}>{dayName}</Text>
                      <Text style={[
                        styles.dateCardNumber,
                        isSelected && styles.dateCardTextSelected
                      ]}>{dayNumber}</Text>
                      <Text style={[
                        styles.dateCardMonth,
                        isSelected && styles.dateCardTextSelected
                      ]}>{monthName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {selectedDate && (
                <>
                  <Text style={styles.modalSectionTitle}>Horarios disponibles:</Text>
                  <View style={styles.timeGrid}>
                    {getAvailableTimeSlots(selectedDate).length > 0 ? (
                      getAvailableTimeSlots(selectedDate).map((time) => {
                        const isSelected = selectedTime === time;
                        return (
                          <TouchableOpacity
                            key={time}
                            style={[
                              styles.timeSlot,
                              isSelected && styles.timeSlotSelected
                            ]}
                            onPress={() => setSelectedTime(time)}
                          >
                            <Clock size={16} color={isSelected ? 'white' : '#666'} />
                            <Text style={[
                              styles.timeSlotText,
                              isSelected && styles.timeSlotTextSelected
                            ]}>{time}</Text>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={styles.noSlotsText}>No hay horarios disponibles para esta fecha</Text>
                    )}
                  </View>
                </>
              )}
              
              {selectedDate && selectedTime && (
                <View style={styles.selectedSummary}>
                  <Text style={styles.summaryTitle}>Resumen de la reprogramación:</Text>
                  <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Fecha: </Text>
                    {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Hora: </Text>
                    {selectedTime}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Servicio: </Text>
                    {reservation.service}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Duración: </Text>
                    {reservation.duration} minutos
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.finalizarButton}
                    onPress={handleFinishReschedule}
                    activeOpacity={0.7}
                  >
                    <CheckCircle size={20} color="white" />
                    <Text style={styles.finalizarButtonText}>Finalizar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowRescheduleModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' && {
      wordWrap: 'break-word' as any,
      overflowWrap: 'break-word' as any,
    }),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' && {
      wordWrap: 'break-word' as any,
      overflowWrap: 'break-word' as any,
    }),
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
    textTransform: 'capitalize',
    flexWrap: 'wrap',
    ...(Platform.OS === 'web' && {
      wordWrap: 'break-word' as any,
      overflowWrap: 'break-word' as any,
    }),
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusConfirmed: {
    backgroundColor: '#4CAF50',
  },
  statusPending: {
    backgroundColor: '#FF9800',
  },
  statusCancelled: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  confirmAttendanceButton: {
    backgroundColor: '#4CAF50',
  },
  rescheduleButton: {
    backgroundColor: '#2196F3',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  contactSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 20,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  kompa2goButton: {
    backgroundColor: '#D81B60',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  dateCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  dateCardDay: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  dateCardNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  dateCardMonth: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  dateCardTextSelected: {
    color: 'white',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeSlotSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    color: 'white',
  },
  noSlotsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  selectedSummary: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  finalizarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  finalizarButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  summaryLabel: {
    fontWeight: '600',
    color: '#1976D2',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    textAlign: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#BBDEFB',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F5F5F5',
  },
  modalButtonConfirm: {
    backgroundColor: '#2196F3',
  },
  modalButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});