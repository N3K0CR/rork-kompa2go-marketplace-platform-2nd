// ID: ReservationDetailCard_v6_fixed
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { XCircle, MessageCircle, Calendar, CheckCircle, Bell, TimerOff, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments, Appointment, ConfirmationState } from '@/contexts/AppointmentsContext';
import { useChat } from '@/contexts/ChatContext';
import { router } from 'expo-router';

interface ReservationDetailCardProps {
  reservation: Appointment;
  onClose?: () => void;
  showHeader?: boolean;
}

export default function ReservationDetailCard({ reservation, onClose, showHeader = true }: ReservationDetailCardProps) {
  const { user } = useAuth();
  const { updateAppointment, getConfirmationState } = useAppointments();
  const { createChat } = useChat();
  const userType = user?.userType || 'client';

  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);

  useEffect(() => {
    if (reservation) {
      const state = getConfirmationState(reservation);
      setConfirmationState(state);
    }
  }, [reservation, getConfirmationState]);

  const executeCancellation = async () => {
    try {
      await updateAppointment(reservation.id, {
        status: 'cancelled',
        notes: `${reservation.notes || ''} [Cancelada por ${userType}]`
      });
      onClose?.();
      Alert.alert('Reserva Cancelada', 'La reserva ha sido cancelada exitosamente.');
    } catch (error) {
      console.error('Error al cancelar reserva:', error);
      Alert.alert('Error', 'No se pudo cancelar la reserva. Intenta de nuevo.');
    }
  };

  const handleCancelReservation = () => {
    Alert.alert('Confirmar Cancelacion', 'Estas seguro de que deseas cancelar esta reserva?', [
      { text: 'No', style: 'cancel' },
      { text: 'Si', onPress: executeCancellation }
    ]);
  };

  const handleConfirm = async () => {
    try {
      await updateAppointment(reservation.id, { status: 'confirmed' });
      onClose?.();
      Alert.alert('Confirmado!', 'Tu cita ha sido confirmada exitosamente.');
    } catch (error) {
      console.error('Error al confirmar cita:', error);
      Alert.alert('Error', 'No se pudo confirmar la cita. Intenta de nuevo.');
    }
  };

  const handlePostpone = async () => {
    if (!confirmationState?.postponeDuration) return;

    const newPostponeCount = (reservation.confirmationPostpones || 0) + 1;
    const postponeHours = confirmationState.postponeDuration;

    let warningMessage = "";
    if (postponeHours === 5) {
        warningMessage = "\n\nEste es tu ultimo aplazamiento. La proxima notificacion te pedira una accion final.";
    }

    Alert.alert(
      `Posponer ${postponeHours} horas`,
      `Recibiras otro recordatorio en ${postponeHours} horas.${warningMessage}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Si, Posponer",
          onPress: async () => {
            try {
              await updateAppointment(reservation.id, {
                confirmationPostpones: newPostponeCount
              });
              onClose?.();
              Alert.alert(
                "Confirmacion Pospuesta",
                `Te recordaremos de nuevo en ${postponeHours} horas.`
              );
            } catch (error) {
              Alert.alert("Error", "No se pudo posponer la confirmacion.");
            }
          },
        },
      ]
    );
  };

  const handleReschedule = () => {
    // Implementar funcionalidad de reagendar
    Alert.alert(
      "Reagendar Cita", 
      "¿Deseas reagendar esta cita?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Si, Reagendar", 
          onPress: () => {
            // Aquí puedes implementar la navegación a una pantalla de reagendamiento
            // o abrir un modal para seleccionar nueva fecha/hora
            console.log('Reagendar cita:', reservation.id);
            onClose?.();
            // Ejemplo: router.push(`/reschedule/${reservation.id}`);
            Alert.alert("En desarrollo", "Esta función estará disponible pronto.");
          }
        }
      ]
    );
  };

  const handleChatContact = async () => {
    try {
      const providerId = reservation.providerId || 'provider_' + reservation.id;
      const providerName = reservation.providerName || reservation.clientName;
      const chatId = await createChat(providerId, providerName);
      onClose?.();
      router.push(`/chat/${chatId}`);
    } catch {
      Alert.alert('Error', 'No se pudo abrir el chat.');
    }
  };

  const renderActionButtons = () => {
    if (!confirmationState) return null;

    if (reservation.status === 'cancelled') {
        return <Text style={styles.actionMessage}>Esta reserva fue cancelada.</Text>;
    }

    if (userType === 'client') {
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
              <Text style={styles.actionButtonText}>Confirmar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]} onPress={handleReschedule}>
              <Calendar size={20} color="white" />
              <Text style={styles.actionButtonText}>Reagendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelReservation}>
              <XCircle size={20} color="white" />
              <Text style={styles.actionButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        );
      }
    }

    return (
        <>
            <Text style={styles.defaultMessage}>{confirmationState.message}</Text>
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
          <Text style={styles.sectionTitle}>Informacion de la Reserva</Text>

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
            <Text style={styles.detailLabel}>Duracion:</Text>
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

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Administrar Reserva</Text>
          {renderActionButtons()}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contacto</Text>

          <TouchableOpacity
            style={[styles.contactButton, styles.kompa2goButton]}
            onPress={handleChatContact}
          >
            <MessageCircle size={20} color="white" />
            <Text style={styles.contactButtonText}>Chat Kompa2Go</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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