import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { XCircle, MessageCircle, Calendar, Clock, X, CheckCircle } from 'lucide-react-native';
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
  const { createChat } = useChat();
  const { businessHours } = useProvider();
  const userType = user?.userType || 'client';
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // --- FUNCIÓN DE CANCELACIÓN CORREGIDA ---
  // 1. Se crea una función separada para ejecutar la lógica de cancelación.
  const executeCancellation = async () => {
    try {
      console.log(`[executeCancellation] Iniciando cancelación para reserva ID: ${reservation.id}`);
      await updateAppointment(reservation.id, { 
        status: 'cancelled',
        notes: `${reservation.notes || ''} [Cancelada por ${userType} el ${new Date().toLocaleDateString()}]`
      });
      
      // 2. Se muestra la alerta de éxito DESPUÉS de que la actualización se ha completado.
      Alert.alert('Reserva Cancelada', 'La reserva ha sido cancelada exitosamente.');
      
      // 3. Se cierra el modal.
      if (onClose) {
        onClose();
      }
      console.log(`[executeCancellation] Cancelación completada y modal cerrado.`);
      
    } catch (error) {
      console.error("[executeCancellation] Error:", error);
      Alert.alert('Error', 'Ocurrió un problema al cancelar la reserva. Por favor, inténtalo de nuevo.');
    }
  };

  // 4. El manejador del botón ahora solo se encarga de mostrar la alerta de confirmación.
  const handleCancelReservation = () => {
    if (!reservation?.id) {
      Alert.alert('Error', 'No se pudo identificar la reserva.');
      return;
    }
    
    Alert.alert(
      '⚠️ Confirmar Cancelación',
      '¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer y la comisión de la plataforma no es reembolsable.',
      [
        { text: 'No, Mantener', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          // Llama a la función separada en lugar de poner la lógica aquí.
          onPress: executeCancellation 
        }
      ]
    );
  };

  const handleReschedule = () => {
    setShowRescheduleModal(true);
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

  const getNextSevenDays = () => {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const handleFinishReschedule = async () => {
    if (!selectedDate || !selectedTime || !reservation?.id) {
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


  const handleConfirmAttendance = async () => {
    // Tu lógica de confirmar asistencia aquí...
  };

  const handleChatContact = async () => {
    try {
      const providerId = reservation.providerId || 'provider_' + reservation.id;
      const providerName = reservation.providerName || reservation.clientName;
      const chatId = await createChat(providerId, providerName);
      onClose?.();
      router.push(`/chat/${chatId}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el chat.');
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
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información de la Reserva</Text>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Fecha:</Text><Text style={styles.detailValue}>{new Date(reservation.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Hora:</Text><Text style={styles.detailValue}>{reservation.time}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Duración:</Text><Text style={styles.detailValue}>{reservation.duration} minutos</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Servicio:</Text><Text style={styles.detailValue}>{reservation.service}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>{userType === 'client' ? 'Proveedor:' : 'Cliente:'}</Text><Text style={styles.detailValue}>{reservation.clientName}</Text></View>
          {reservation.clientPhone && <View style={styles.detailRow}><Text style={styles.detailLabel}>Teléfono:</Text><Text style={styles.detailValue}>{reservation.clientPhone}</Text></View>}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estado:</Text>
            <View style={[ styles.statusBadge, reservation.status === 'confirmed' ? styles.statusConfirmed : reservation.status === 'pending' ? styles.statusPending : styles.statusCancelled ]}>
              <Text style={styles.statusText}>{reservation.status}</Text>
            </View>
          </View>
          {reservation.notes && <View style={styles.detailRow}><Text style={styles.detailLabel}>Notas:</Text><Text style={styles.detailValue}>{reservation.notes}</Text></View>}
        </View>
        
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Administrar Reserva</Text>
          {reservation.status !== 'cancelled' && (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.confirmAttendanceButton]} onPress={handleConfirmAttendance} activeOpacity={0.7}>
                <CheckCircle size={20} color="white" />
                <Text style={styles.actionButtonText}>Confirmar asistencia</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]} onPress={handleReschedule} activeOpacity={0.7}>
                <Calendar size={20} color="white" />
                <Text style={styles.actionButtonText}>Reprogramar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelReservation} activeOpacity={0.7}>
                <XCircle size={20} color="white" />
                <Text style={styles.actionButtonText}>Cancelar Reserva</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          <View style={styles.contactButtonsRow}>
            <TouchableOpacity style={[styles.contactButton, styles.kompa2goButton]} onPress={handleChatContact} activeOpacity={0.7}>
              <MessageCircle size={18} color="white" />
              <Text style={styles.contactButtonText}>Chat Kompa2Go</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <Modal visible={showRescheduleModal} animationType="slide" transparent={true} onRequestClose={() => setShowRescheduleModal(false)}>
          {/* Tu modal de reagendamiento aquí... */}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { flex: 1, padding: 20 },
  infoSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  detailLabel: { fontSize: 14, color: '#666', fontWeight: '500', flex: 1 },
  detailValue: { fontSize: 14, color: '#333', fontWeight: '600', flex: 1.5, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusConfirmed: { backgroundColor: '#4CAF50' },
  statusPending: { backgroundColor: '#FF9800' },
  statusCancelled: { backgroundColor: '#F44336' },
  statusText: { color: 'white', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  actionsSection: { marginBottom: 24 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginBottom: 12, gap: 8 },
  confirmAttendanceButton: { backgroundColor: '#4CAF50' },
  rescheduleButton: { backgroundColor: '#2196F3' },
  cancelButton: { backgroundColor: '#F44336' },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  contactSection: { borderTopWidth: 1, borderTopColor: '#E5E5E5', paddingTop: 20 },
  contactButtonsRow: { flexDirection: 'row', gap: 12 },
  contactButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  kompa2goButton: { backgroundColor: '#D81B60' },
  contactButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
});