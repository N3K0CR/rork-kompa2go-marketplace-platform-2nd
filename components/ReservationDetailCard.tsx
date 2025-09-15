import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { XCircle, MessageCircle, Calendar, Clock, X, CheckCircle, Bell, TimerOff, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments, Appointment, ConfirmationState } from '@/contexts/AppointmentsContext';
import { useChat } from '@/contexts/ChatContext';
import { router } from 'expo-router';
import { useProvider } from '@/contexts/ProviderContext';

interface ReservationDetailCardProps {
  reservation: Appointment;
  onClose?: () => void;
  showHeader?: boolean;
}

export default function ReservationDetailCard({ reservation, onClose, showHeader = true }: ReservationDetailCardProps) {
  const { user } = useAuth();
  const { updateAppointment, getConfirmationState } = useAppointments();
  const { createChat } = useChat();
  const { businessHours } = useProvider();
  const userType = user?.userType || 'client';
  
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);

  useEffect(() => {
    if (reservation) {
      const state = getConfirmationState(reservation);
      setConfirmationState(state);
    }
  }, [reservation, getConfirmationState]);

  const handleConfirm = async () => {
    await updateAppointment(reservation.id, { status: 'confirmed' });
    Alert.alert("¡Confirmado!", "Tu cita ha sido confirmada.");
    onClose?.();
  };

  const handlePostpone = async () => {
    if (!confirmationState?.postponeDuration) return;
    const newPostponeCount = (reservation.confirmationPostpones || 0) + 1;
    await updateAppointment(reservation.id, { confirmationPostpones: newPostponeCount });
    Alert.alert("Confirmación Pospuesta", `Te lo recordaremos de nuevo más tarde.`);
    onClose?.();
  };

  const handleReschedule = () => {
    setShowRescheduleModal(true);
  };
  
  const handleFinishReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Error', 'Por favor selecciona una nueva fecha y hora.');
      return;
    }
    const newDate = selectedDate.toISOString().split('T')[0];
    try {
      await updateAppointment(reservation.id, { date: newDate, time: selectedTime });
      setShowRescheduleModal(false);
      onClose?.();
      Alert.alert('Éxito', 'La cita ha sido reprogramada.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo reprogramar la cita.');
    }
  };

  const handleCancelReservation = () => {
    Alert.alert(
      'Cancelar Reserva',
      '¿Estás seguro que deseas cancelar esta reserva? La comisión de la plataforma no es reembolsable.',
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: async () => {
            await updateAppointment(reservation.id, { status: 'cancelled' });
            Alert.alert('Reserva Cancelada', 'La reserva ha sido cancelada exitosamente.');
            onClose?.();
          }
        }
      ]
    );
  };

  const getNextSevenDays = () => {
      const days = [];
      for (let i = 1; i <= 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          days.push(date);
      }
      return days;
  };

  const getAvailableTimeSlots = (date: Date) => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const dayName = dayNames[date.getDay()];
    const dayHours = businessHours[dayName];
    if (!dayHours?.isOpen) return [];
    const slots: string[] = [];
    const [openHour] = dayHours.openTime.split(':').map(Number);
    const [closeHour] = dayHours.closeTime.split(':').map(Number);
    for (let hour = openHour; hour < closeHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };
  
  const handleChatContact = async () => {
    const providerId = reservation.providerId || 'provider_' + reservation.id;
    const providerName = reservation.providerName || reservation.clientName;
    const chatId = await createChat(providerId, providerName);
    onClose?.();
    router.push(`/chat/${chatId}`);
  };
  
  const renderActionButtons = () => {
    if (!confirmationState) return null;

    // Caso 1: Flujo de confirmación activo (Cliente)
    if (userType === 'client' && confirmationState.status !== 'default') {
      if (confirmationState.status === 'pending_confirmation') {
        return (
          <>
            <View style={styles.actionMessageContainer}>
              <Bell size={20} color="#FF9800" />
              <Text style={styles.actionMessage}>{confirmationState.message}</Text>
            </View>
            <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={handleConfirm}>
              <CheckCircle size={20} color="white" />
              <Text style={styles.actionButtonText}>Confirmar Asistencia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.postponeButton]} onPress={handlePostpone}>
              <TimerOff size={20} color="white" />
              <Text style={styles.actionButtonText}>Posponer {confirmationState.postponeDuration} hrs</Text>
            </TouchableOpacity>
          </>
        );
      }
      if (confirmationState.status === 'final_options') {
         return (
          <>
            <View style={[styles.actionMessageContainer, styles.actionMessageUrgent]}>
              <AlertTriangle size={20} color="#F44336" />
              <Text style={styles.actionMessage}>{confirmationState.message}</Text>
            </View>
            <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={handleConfirm}>
              <CheckCircle size={20} color="white" />
              <Text style={styles.actionButtonText}>Confirmar Asistencia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]} onPress={handleReschedule}>
              <Calendar size={20} color="white" />
              <Text style={styles.actionButtonText}>Reagendar</Text>
            </TouchableOpacity>
             <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelReservation}>
              <XCircle size={20} color="white" />
              <Text style={styles.actionButtonText}>Cancelar Reserva</Text>
            </TouchableOpacity>
          </>
        );
      }
    }

    if (reservation.status === 'confirmed' || reservation.status === 'pending') {
        return (
            <>
                <Text style={styles.defaultMessage}>
                  {reservation.status === 'pending'
                    ? 'Recibirás una notificación para confirmar 24 horas antes.'
                    : 'Recuerda llegar 10 minutos antes de tu cita.'}
                </Text>
                <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]} onPress={handleReschedule}>
                  <Calendar size={20} color="white" />
                  <Text style={styles.actionButtonText}>Reagendar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelReservation}>
                  <XCircle size={20} color="white" />
                  <Text style={styles.actionButtonText}>Cancelar Reserva</Text>
                </TouchableOpacity>
            </>
        );
    }
    
    if (reservation.status === 'cancelled') {
        return <Text style={styles.actionMessage}>Esta reserva ha sido cancelada.</Text>
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Detalles de Reserva</Text>
          <TouchableOpacity onPress={onClose}><X size={24} color="#666"/></TouchableOpacity>
        </View>
      )}
      
      <ScrollView style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información de la Reserva</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha:</Text>
            <Text style={styles.detailValue}>{new Date(reservation.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hora:</Text>
            <Text style={styles.detailValue}>{reservation.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Servicio:</Text>
            <Text style={styles.detailValue}>{reservation.service}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{userType === 'client' ? 'Proveedor:' : 'Cliente:'}</Text>
            <Text style={styles.detailValue}>{reservation.clientName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estado:</Text>
            <View style={[styles.statusBadge, reservation.status === 'confirmed' && styles.statusConfirmed, reservation.status === 'pending' && styles.statusPending, reservation.status === 'cancelled' && styles.statusCancelled]}>
              <Text style={styles.statusText}>{reservation.status}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Administrar Reserva</Text>
          {renderActionButtons()}
        </View>
        
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          <TouchableOpacity style={[styles.contactButton, styles.kompa2goButton]} onPress={handleChatContact} activeOpacity={0.7}>
            <MessageCircle size={18} color="white" />
            <Text style={styles.contactButtonText}>Chat Kompa2Go</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Reagendamiento */}
      <Modal visible={showRescheduleModal} animationType="slide" transparent={true} onRequestClose={() => setShowRescheduleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reprogramar Cita</Text>
              <TouchableOpacity onPress={() => setShowRescheduleModal(false)}>
                <X size={24} color="#666"/>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionTitle}>Selecciona una nueva fecha</Text>
              <View style={styles.dateGrid}>
                {getNextSevenDays().map((date, index) => {
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.dateOption, isSelected && styles.dateOptionSelected]}
                      onPress={() => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                      }}
                    >
                      <Text style={[styles.dateOptionDay, isSelected && styles.dateOptionDaySelected]}>
                        {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                      </Text>
                      <Text style={[styles.dateOptionNumber, isSelected && styles.dateOptionNumberSelected]}>
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {selectedDate && (
                <>
                  <Text style={styles.sectionTitle}>Selecciona una hora</Text>
                  <View style={styles.timeGrid}>
                    {getAvailableTimeSlots(selectedDate).map((time) => {
                      const isSelected = selectedTime === time;
                      return (
                        <TouchableOpacity
                          key={time}
                          style={[styles.timeOption, isSelected && styles.timeOptionSelected]}
                          onPress={() => setSelectedTime(time)}
                        >
                          <Text style={[styles.timeOptionText, isSelected && styles.timeOptionTextSelected]}>
                            {time}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
              
              {selectedDate && selectedTime && (
                <TouchableOpacity style={styles.finalizarButton} onPress={handleFinishReschedule}>
                  <CheckCircle size={20} color="white" />
                  <Text style={styles.finalizarButtonText}>Finalizar</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { backgroundColor: 'white', maxHeight: '90%', minHeight: '60%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    infoSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    detailLabel: { fontSize: 14, color: '#666', fontWeight: '500', flex: 1 },
    detailValue: { fontSize: 14, color: '#333', fontWeight: '600', flex: 1.5, textAlign: 'right' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusConfirmed: { backgroundColor: '#4CAF50' },
    statusPending: { backgroundColor: '#FF9800' },
    statusCancelled: { backgroundColor: '#F44336' },
    statusText: { color: 'white', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    actionsSection: { marginBottom: 24 },
    actionMessageContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, marginBottom: 16 },
    actionMessageUrgent: { backgroundColor: '#FFEBEE' },
    actionMessage: { fontSize: 14, color: '#666', lineHeight: 20, flex: 1 },
    defaultMessage: { fontSize: 14, color: '#666', textAlign: 'center', fontStyle: 'italic', marginBottom: 16 },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginBottom: 12, gap: 8, elevation: 2 },
    actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
    confirmButton: { backgroundColor: '#4CAF50' },
    postponeButton: { backgroundColor: '#FF9800' },
    rescheduleButton: { backgroundColor: '#2196F3' },
    cancelButton: { backgroundColor: '#F44336' },
    contactSection: { borderTopWidth: 1, borderTopColor: '#E5E5E5', paddingTop: 20 },
    contactButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
    kompa2goButton: { backgroundColor: '#D81B60' },
    contactButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
    // Modal styles
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalBody: { padding: 20 },
    dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    dateOption: { alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5E5', minWidth: 60 },
    dateOptionSelected: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
    dateOptionDay: { fontSize: 12, color: '#666', textTransform: 'capitalize' },
    dateOptionDaySelected: { color: 'white' },
    dateOptionNumber: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 4 },
    dateOptionNumberSelected: { color: 'white' },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    timeOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5' },
    timeOptionSelected: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
    timeOptionText: { fontSize: 14, color: '#333' },
    timeOptionTextSelected: { color: 'white' },
    finalizarButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', borderRadius: 10, paddingVertical: 14, marginTop: 16, gap: 8 },
    finalizarButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});