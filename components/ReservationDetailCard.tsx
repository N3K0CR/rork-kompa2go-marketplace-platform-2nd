import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { CheckCircle, XCircle, RotateCcw, MessageCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useChat } from '@/contexts/ChatContext';
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
  const userType = user?.userType || 'client';

  const handleConfirmReservation = async () => {
    console.log('🔵 Confirm button pressed for reservation:', reservation.id);
    Alert.alert(
      'Confirmar Reserva',
      `¿Confirmas tu reserva para el ${new Date(reservation.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${reservation.time}?\n\nServicio: ${reservation.service}\n${userType === 'client' ? `Proveedor: ${reservation.clientName}` : `Cliente: ${reservation.clientName}`}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            try {
              console.log('✅ Confirming reservation:', reservation.id);
              await updateAppointment(reservation.id, { 
                status: 'confirmed',
                notes: (reservation.notes || '') + ` [Confirmada por ${userType} el ${new Date().toLocaleString('es-ES')}]`
              });
              Alert.alert('✅ Confirmada', 'Tu reserva ha sido confirmada exitosamente.');
              onClose?.();
            } catch (error) {
              console.error('Error confirming reservation:', error);
              Alert.alert('Error', 'No se pudo confirmar la reserva. Por favor intenta de nuevo.');
            }
          }
        }
      ]
    );
  };

  const handleReschedule = () => {
    console.log('🔄 Reschedule button pressed for reservation:', reservation.id);
    Alert.alert(
      'Reprogramar Cita',
      `Para reprogramar tu reserva del ${new Date(reservation.date).toLocaleDateString('es-ES')} necesitas coordinar directamente con ${userType === 'client' ? 'el proveedor' : 'el cliente'}.\n\n¿Cómo prefieres contactarlos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '💬 Chat Kompa2Go',
          style: 'default',
          onPress: async () => {
            try {
              console.log('💬 Opening chat for reschedule');
              const providerId = reservation.providerId || 'provider_' + reservation.id;
              const providerName = reservation.providerName || reservation.clientName;
              const chatId = await createChat(providerId, providerName);
              await sendMessage(chatId, `Hola, necesito reprogramar nuestra cita del ${new Date(reservation.date).toLocaleDateString('es-ES')} a las ${reservation.time} para ${reservation.service}. ¿Cuándo tienes disponibilidad?`);
              onClose?.();
              router.push(`/chat/${chatId}`);
            } catch (error) {
              console.error('Error opening chat:', error);
              Alert.alert('Error', 'No se pudo abrir el chat. Por favor intenta de nuevo.');
            }
          }
        },
        {
          text: '📞 Llamar',
          style: 'default',
          onPress: () => {
            console.log('📞 Initiating phone call');
            const phoneNumber = reservation.clientPhone || '+506 8888-0000';
            const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
            const telUrl = `tel:${cleanPhone}`;
            
            Alert.alert(
              'Realizar Llamada',
              `¿Deseas llamar a ${phoneNumber}?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Llamar',
                  onPress: () => {
                    Linking.openURL(telUrl).catch(() => {
                      Alert.alert('Error', 'No se pudo realizar la llamada.');
                    });
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleCancelReservation = () => {
    console.log('❌ Cancel button pressed for reservation:', reservation.id);
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
              console.log('🗑️ Cancelling reservation:', reservation.id);
              await updateAppointment(reservation.id, { 
                status: 'cancelled',
                notes: (reservation.notes || '') + ` [Cancelada por ${userType} el ${new Date().toLocaleString('es-ES')}${userType === 'client' ? ' - Comisión no reembolsable' : ''}]`
              });
              Alert.alert(
                '❌ Reserva Cancelada', 
                userType === 'client' ? 
                  'Tu reserva ha sido cancelada. La comisión no es reembolsable.' :
                  'La reserva ha sido cancelada y el cliente ha sido notificado.'
              );
              onClose?.();
            } catch (error) {
              console.error('Error cancelling reservation:', error);
              Alert.alert('Error', 'No se pudo cancelar la reserva. Por favor intenta de nuevo.');
            }
          }
        }
      ]
    );
  };

  const handleChatContact = async () => {
    console.log('💬 Chat button pressed for reservation:', reservation.id);
    try {
      const providerId = reservation.providerId || 'provider_' + reservation.id;
      const providerName = reservation.providerName || reservation.clientName;
      console.log('Creating chat with:', { providerId, providerName });
      const chatId = await createChat(providerId, providerName);
      console.log('Chat created with ID:', chatId);
      onClose?.();
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error opening chat:', error);
      Alert.alert('Error', 'No se pudo abrir el chat. Por favor intenta de nuevo.');
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
          
          {/* Confirmation Action */}
          {reservation.status === 'pending' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleConfirmReservation}
              activeOpacity={0.7}
            >
              <CheckCircle size={20} color="white" />
              <Text style={styles.actionButtonText}>Confirmar Reserva</Text>
            </TouchableOpacity>
          )}
          
          {/* Reschedule Action */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.rescheduleButton]}
            onPress={handleReschedule}
            activeOpacity={0.7}
          >
            <RotateCcw size={20} color="white" />
            <Text style={styles.actionButtonText}>Reprogramar</Text>
          </TouchableOpacity>
          
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
});