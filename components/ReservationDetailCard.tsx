// ID: ReservationDetailCard_v8_working
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

  // Debug logging
  useEffect(() => {
    console.log('🔍 ReservationDetailCard - reservation:', reservation);
    console.log('🔍 ReservationDetailCard - user:', user);
    console.log('🔍 ReservationDetailCard - userType:', userType);
  }, [reservation, user, userType]);

  useEffect(() => {
    if (reservation && getConfirmationState) {
      try {
        const state = getConfirmationState(reservation);
        console.log('🔍 ReservationDetailCard - confirmationState:', state);
        setConfirmationState(state);
      } catch (error) {
        console.error('❌ Error getting confirmation state:', error);
      }
    }
  }, [reservation, getConfirmationState]);

  const executeCancellation = async () => {
    console.log('🔥 CANCELAR - Iniciando cancelación para reserva:', reservation.id);
    
    if (!updateAppointment) {
      console.error('❌ updateAppointment no está disponible');
      Alert.alert('Error', 'Función de actualización no disponible');
      return;
    }

    try {
      console.log('🔥 CANCELAR - Llamando updateAppointment...');
      
      const updates = {
        status: 'cancelled' as const,
        notes: `${reservation.notes || ''} [Cancelada por ${userType}]`
      };
      
      console.log('🔥 CANCELAR - Updates:', updates);
      
      await updateAppointment(reservation.id, updates);
      
      console.log('✅ CANCELAR - Actualización exitosa');
      
      onClose?.();
      Alert.alert('Reserva Cancelada', 'La reserva ha sido cancelada exitosamente.');
    } catch (error) {
      console.error('❌ Error al cancelar reserva:', error);
      Alert.alert('Error', `No se pudo cancelar la reserva: ${error}`);
    }
  };

  const handleCancelReservation = () => {
    console.log('🔥 CANCELAR - Botón presionado');
    
    // Simplified approach - execute directly for testing
    executeCancellation();
  };

  const handleConfirm = async () => {
    console.log('✅ CONFIRMAR - Botón presionado');
    
    if (!updateAppointment) {
      console.error('❌ updateAppointment no está disponible');
      Alert.alert('Error', 'Función de actualización no disponible');
      return;
    }

    try {
      console.log('✅ CONFIRMAR - Llamando updateAppointment...');
      await updateAppointment(reservation.id, { status: 'confirmed' });
      console.log('✅ CONFIRMAR - Actualización exitosa');
      
      onClose?.();
      Alert.alert('¡Confirmado!', 'Tu cita ha sido confirmada exitosamente.');
    } catch (error) {
      console.error('❌ Error al confirmar cita:', error);
      Alert.alert('Error', `No se pudo confirmar la cita: ${error}`);
    }
  };

  const handlePostpone = async () => {
    console.log('⏰ POSPONER - Botón presionado');
    console.log('⏰ POSPONER - confirmationState:', confirmationState);
    
    if (!confirmationState?.postponeDuration) {
      console.error('❌ No hay postponeDuration disponible');
      return;
    }

    if (!updateAppointment) {
      console.error('❌ updateAppointment no está disponible');
      return;
    }

    const newPostponeCount = (reservation.confirmationPostpones || 0) + 1;
    const postponeHours = confirmationState.postponeDuration;

    console.log('⏰ POSPONER - newPostponeCount:', newPostponeCount);
    console.log('⏰ POSPONER - postponeHours:', postponeHours);

    try {
      console.log('⏰ POSPONER - Ejecutando posposición...');
      
      await updateAppointment(reservation.id, {
        confirmationPostpones: newPostponeCount
      });
      
      console.log('✅ POSPONER - Actualización exitosa');
      
      onClose?.();
    } catch (error) {
      console.error('❌ Error al posponer:', error);
    }
  };

  const handleReschedule = () => {
    console.log('📅 REAGENDAR - Botón presionado');
    
    // Simplified approach - just log for now
    console.log('📅 REAGENDAR - Función ejecutada');
    onClose?.();
  };

  const handleChatContact = async () => {
    console.log('💬 CHAT - Botón presionado');
    
    if (!createChat) {
      console.error('❌ createChat no está disponible');
      Alert.alert('Error', 'Función de chat no disponible');
      return;
    }

    try {
      const providerId = reservation.providerId || 'provider_' + reservation.id;
      const providerName = reservation.providerName || reservation.clientName;
      
      console.log('💬 CHAT - providerId:', providerId);
      console.log('💬 CHAT - providerName:', providerName);
      
      const chatId = await createChat(providerId, providerName);
      
      console.log('💬 CHAT - chatId:', chatId);
      
      onClose?.();
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('❌ Error al abrir chat:', error);
      Alert.alert('Error', 'No se pudo abrir el chat.');
    }
  };

  const renderActionButtons = () => {
    console.log('🎨 RENDER - confirmationState:', confirmationState);
    console.log('🎨 RENDER - userType:', userType);
    console.log('🎨 RENDER - reservation.status:', reservation.status);
    
    if (!confirmationState) {
      console.log('🎨 RENDER - No confirmationState, returning null');
      return null;
    }

    if (reservation.status === 'cancelled') {
        console.log('🎨 RENDER - Reservation cancelled');
        return <Text style={styles.actionMessage}>Esta reserva fue cancelada.</Text>;
    }

    if (userType === 'client') {
      if (confirmationState.status === 'pending_confirmation') {
        console.log('🎨 RENDER - Showing pending_confirmation buttons');
        return (
          <>
            <View style={styles.actionMessageContainer}>
              <Bell size={20} color="#FF9800" />
              <Text style={styles.actionMessage}>{confirmationState.message}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.confirmButton]} 
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <CheckCircle size={20} color="white" />
              <Text style={styles.actionButtonText}>Confirmar Asistencia</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.postponeButton]} 
              onPress={handlePostpone}
              activeOpacity={0.7}
            >
              <TimerOff size={20} color="white" />
              <Text style={styles.actionButtonText}>Posponer {confirmationState.postponeDuration} hrs</Text>
            </TouchableOpacity>
          </>
        );
      }
      
      if (confirmationState.status === 'final_options') {
        console.log('🎨 RENDER - Showing final_options buttons');
         return (
          <>
            <View style={[styles.actionMessageContainer, styles.actionMessageUrgent]}>
              <AlertTriangle size={20} color="#F44336" />
              <Text style={styles.actionMessage}>{confirmationState.message}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.confirmButton]} 
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <CheckCircle size={20} color="white" />
              <Text style={styles.actionButtonText}>Confirmar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.rescheduleButton]} 
              onPress={handleReschedule}
              activeOpacity={0.7}
            >
              <Calendar size={20} color="white" />
              <Text style={styles.actionButtonText}>Reagendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]} 
              onPress={handleCancelReservation}
              activeOpacity={0.7}
            >
              <XCircle size={20} color="white" />
              <Text style={styles.actionButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        );
      }
    }

    console.log('🎨 RENDER - Showing default buttons');
    return (
        <>
            <Text style={styles.defaultMessage}>{confirmationState.message}</Text>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.rescheduleButton]} 
              onPress={handleReschedule}
              activeOpacity={0.7}
            >
              <Calendar size={20} color="white" />
              <Text style={styles.actionButtonText}>Reagendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]} 
              onPress={handleCancelReservation}
              activeOpacity={0.7}
            >
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
            activeOpacity={0.7}
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