// ID: ReservationDetailCard_v8_FIX
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
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
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);

  useEffect(() => {
    if (reservation) {
      const state = getConfirmationState(reservation);
      setConfirmationState(state);
    }
  }, [reservation, getConfirmationState]);

  // --- LÓGICA DE ACCIONES REFACTORIZADA PARA MÁXIMA FIABILIDAD ---

  // 1. Lógica de EJECUCIÓN separada
  const executeCancellation = async () => {
    try {
      await updateAppointment(reservation.id, { 
        status: 'cancelled',
        notes: `${reservation.notes || ''} [Cancelada por ${userType}]`
      });
      onClose?.(); // Cierra el modal primero
      Alert.alert('Reserva Cancelada', 'La reserva ha sido cancelada exitosamente.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cancelar la reserva.');
    }
  };
  
  // El manejador del botón SÓLO muestra la alerta de confirmación
  const handleCancelReservation = () => {
    Alert.alert('⚠️ Confirmar Cancelación', '¿Estás seguro?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, Cancelar', style: 'destructive', onPress: executeCancellation }
    ]);
  };

  const executePostpone = async () => {
    if (!confirmationState?.postponeDuration) return;
    const newPostponeCount = (reservation.confirmationPostpones || 0) + 1;
    try {
        await updateAppointment(reservation.id, { confirmationPostpones: newPostponeCount });
        onClose?.(); // Cierra el modal primero
        Alert.alert("Confirmación Pospuesta", `Te lo recordaremos de nuevo más tarde.`);
    } catch (error) {
        Alert.alert('Error', 'No se pudo posponer la confirmación.');
    }
  };

  const handlePostpone = () => {
    if (!confirmationState?.postponeDuration) return;
    let warningMessage = confirmationState.postponeDuration === 5 ? "\n\nEste es tu último aplazamiento." : "";
    Alert.alert(`Posponer ${confirmationState.postponeDuration} horas`, `Recibirás otro recordatorio en ${confirmationState.postponeDuration} horas.${warningMessage}`,[
      { text: "Cancelar", style: "cancel" },
      { text: "Sí, Posponer", onPress: executePostpone }
    ]);
  };
  
  const executeConfirm = async () => {
    try {
        await updateAppointment(reservation.id, { status: 'confirmed' });
        onClose?.();
        Alert.alert("¡Confirmado!", "Tu cita ha sido confirmada.");
    } catch (error) {
        Alert.alert("Error", "No se pudo confirmar la cita.");
    }
  };

  const handleConfirm = () => {
      Alert.alert("Confirmar Asistencia", "¿Estás seguro?", [{ text: "Cancelar" }, { text: "Sí, Confirmar", onPress: executeConfirm }]);
  };

  const handleReschedule = () => Alert.alert("Reagendar Cita", "Esta función aún está en desarrollo.");
  const handleChatContact = async () => { /* Tu lógica de chat aquí */ };
  
  const renderActionButtons = () => {
    if (!confirmationState) return null;
    if (reservation.status === 'cancelled') return <Text style={styles.actionMessage}>Esta reserva fue cancelada.</Text>;

    // Flujo de confirmación (Cliente)
    if (userType === 'client' && confirmationState.status !== 'default') {
      return (
        <>
          <View style={[styles.actionMessageContainer, confirmationState.status === 'final_options' && styles.actionMessageUrgent]}>
            {confirmationState.status === 'final_options' ? <AlertTriangle size={20} color="#F44336" /> : <Bell size={20} color="#FF9800" />}
            <Text style={styles.actionMessage}>{confirmationState.message}</Text>
          </View>
          {confirmationState.canConfirm && <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={handleConfirm}><CheckCircle size={20} color="white" /><Text style={styles.actionButtonText}>Confirmar</Text></TouchableOpacity>}
          {confirmationState.canPostpone && <TouchableOpacity style={[styles.actionButton, styles.postponeButton]} onPress={handlePostpone}><TimerOff size={20} color="white" /><Text style={styles.actionButtonText}>Posponer {confirmationState.postponeDuration} hrs</Text></TouchableOpacity>}
          {confirmationState.canReschedule && <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]} onPress={handleReschedule}><Calendar size={20} color="white" /><Text style={styles.actionButtonText}>Reagendar</Text></TouchableOpacity>}
          {confirmationState.canCancel && <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelReservation}><XCircle size={20} color="white" /><Text style={styles.actionButtonText}>Cancelar</Text></TouchableOpacity>}
        </>
      );
    }

    // Botones estándar para citas fuera del flujo de confirmación
    return (
        <>
            <Text style={styles.defaultMessage}>{confirmationState.message}</Text>
            <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]} onPress={handleReschedule}><Calendar size={20} color="white" /><Text style={styles.actionButtonText}>Reagendar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelReservation}><XCircle size={20} color="white" /><Text style={styles.actionButtonText}>Cancelar Reserva</Text></TouchableOpacity>
        </>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información de la Reserva</Text>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Fecha:</Text><Text style={styles.detailValue}>{new Date(reservation.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Hora:</Text><Text style={styles.detailValue}>{reservation.time}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Servicio:</Text><Text style={styles.detailValue}>{reservation.service}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Estado:</Text>
            <View style={[styles.statusBadge, reservation.status === 'confirmed' ? styles.statusConfirmed : reservation.status === 'pending' ? styles.statusPending : styles.statusCancelled]}>
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
          <TouchableOpacity style={[styles.contactButton, styles.kompa2goButton]} onPress={handleChatContact}><MessageCircle size={18} color="white" /><Text style={styles.contactButtonText}>Chat Kompa2Go</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { backgroundColor: 'white', maxHeight: '90%', minHeight: '60%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
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
    defaultMessage: { fontSize: 14, color: '#666', textAlign: 'center', fontStyle: 'italic', marginBottom: 16, lineHeight: 20 },
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
});