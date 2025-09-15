import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { XCircle, MessageCircle, Calendar, Clock, X, CheckCircle, Bell, TimerOff } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments, Appointment, ConfirmationState } from '@/contexts/AppointmentsContext';

interface ReservationDetailCardProps {
  reservation: Appointment;
  onClose?: () => void;
  showHeader?: boolean;
}

export default function ReservationDetailCard({ reservation, onClose, showHeader = true }: ReservationDetailCardProps) {
  const { user } = useAuth();
  const { updateAppointment, getConfirmationState } = useAppointments();
  
  // El estado de confirmación se deriva y se almacena aquí
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);

  useEffect(() => {
    // Cada vez que la reserva cambie, calculamos su estado de confirmación
    if (reservation) {
      const state = getConfirmationState(reservation);
      setConfirmationState(state);
    }
  }, [reservation, getConfirmationState]);





  const handleConfirm = async () => {
    Alert.alert(
      "Confirmar Asistencia",
      "¿Estás seguro de que deseas confirmar tu asistencia a esta cita?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Confirmar",
          onPress: async () => {
            await updateAppointment(reservation.id, { status: 'confirmed' });
            Alert.alert("¡Confirmado!", "Tu cita ha sido confirmada. El proveedor ha sido notificado.");
            onClose?.();
          },
        },
      ]
    );
  };

  const handlePostpone = async () => {
    if (!confirmationState?.postponeDuration) return;
    
    const newPostponeCount = (reservation.confirmationPostpones || 0) + 1;
    let warningMessage = "";
    if (confirmationState.postponeDuration === 5) {
        warningMessage = "\n\nEste es tu último aplazamiento. La próxima notificación te pedirá una acción final.";
    }

    Alert.alert(
      `Posponer ${confirmationState.postponeDuration} horas`,
      `Recibirás otro recordatorio en ${confirmationState.postponeDuration} horas.${warningMessage}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Pospener",
          onPress: async () => {
            await updateAppointment(reservation.id, { confirmationPostpones: newPostponeCount });
            Alert.alert("Confirmación Pospuesta", `Te lo recordaremos de nuevo más tarde.`);
            onClose?.();
          },
        },
      ]
    );
  };

  const handleReschedule = () => {
    // Aquí iría tu lógica para abrir el modal de reagendamiento
    Alert.alert("Reagendar Cita", "Esta función abriría el selector de fecha y hora para reagendar.");
    // onClose?.();
  };

  const handleCancel = () => {
    // Aquí iría tu lógica de cancelación
    Alert.alert("Cancelar Reserva", "Esta función te guiará a través de la política de cancelación.", [
        { text: "Cerrar" }
    ]);
    // onClose?.();
  };
  
  const renderActionButtons = () => {
    if (!confirmationState) return null;

    if (confirmationState.status === 'pending_confirmation') {
      return (
        <>
          <Text style={styles.actionMessage}>{confirmationState.message}</Text>
          <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={handleConfirm}>
            <CheckCircle size={20} color="white" />
            <Text style={styles.actionButtonText}>Confirmar Asistencia</Text>
          </TouchableOpacity>
          {confirmationState.canPostpone && (
            <TouchableOpacity style={[styles.actionButton, styles.postponeButton]} onPress={handlePostpone}>
              <TimerOff size={20} color="white" />
              <Text style={styles.actionButtonText}>Posponer {confirmationState.postponeDuration} hrs</Text>
            </TouchableOpacity>
          )}
        </>
      );
    }
    
    if (confirmationState.status === 'final_options') {
       return (
        <>
          <Text style={styles.actionMessage}>{confirmationState.message}</Text>
          <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={handleConfirm}>
            <CheckCircle size={20} color="white" />
            <Text style={styles.actionButtonText}>Confirmar Asistencia</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]} onPress={handleReschedule}>
            <Calendar size={20} color="white" />
            <Text style={styles.actionButtonText}>Reagendar</Text>
          </TouchableOpacity>
           <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancel}>
            <XCircle size={20} color="white" />
            <Text style={styles.actionButtonText}>Cancelar Reserva</Text>
          </TouchableOpacity>
        </>
      );
    }

    // Si es una cita confirmada o fuera del período de confirmación, no muestra nada especial
    return <Text style={styles.actionMessage}>Recuerda llegar 10 minutos antes de tu cita para una mejor experiencia.</Text>;
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
        {/* ... (Sección de Información de la Reserva sin cambios) ... */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Administrar Reserva</Text>
          {renderActionButtons()}
        </View>
        {/* ... (Sección de Contacto sin cambios) ... */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', maxHeight: '90%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  actionsSection: { marginTop: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  actionMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginBottom: 12, gap: 8 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  confirmButton: { backgroundColor: '#4CAF50' },
  postponeButton: { backgroundColor: '#FF9800' },
  rescheduleButton: { backgroundColor: '#2196F3' },
  cancelButton: { backgroundColor: '#F44336' },
  // ... (El resto de tus estilos)
});