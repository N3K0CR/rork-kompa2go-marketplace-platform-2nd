import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Calendar, CreditCard, MapPin, MessageSquare, Wallet, Star } from 'lucide-react-native';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments } from '@/contexts/AppointmentsContext';

const mockProvider = {
  id: 1,
  name: 'María González',
  service: 'Limpieza Residencial',
  price: '₡8,000/hora',
  image: '👩‍💼',
  location: 'San José Centro',
};

// Time slots will be dynamically generated based on availability

export default function BookingScreen() {
  const { providerId } = useLocalSearchParams();
  const { user } = useAuth();
  const { walletBalance, bookingPasses, purchaseBookingPass, useBookingPass } = useWallet();
  const { getAvailableTimeSlotsForDate, addAppointment } = useAppointments();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<string>('2');
  const [notes, setNotes] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'pass'>('wallet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  
  const availablePasses = bookingPasses.filter(p => !p.isUsed).length;
  const hasWalletBalance = walletBalance >= 500;
  const canBook = hasWalletBalance || availablePasses > 0;

  const processBookingWithWallet = async () => {
    const passId = await purchaseBookingPass();
    return passId;
  };

  const processBookingWithPass = async () => {
    const availablePass = bookingPasses.find(p => !p.isUsed);
    if (!availablePass) {
      throw new Error('No hay pases disponibles');
    }
    return availablePass.id;
  };

  const finalizeBooking = async (passId: string) => {
    await useBookingPass(passId, providerId as string, 'service_1');
    
    // Add the appointment to the provider's calendar
    await addAppointment({
      date: selectedDate,
      time: selectedTime.replace(' AM', ':00').replace(' PM', ':00').replace('1:00', '13:00').replace('2:00', '14:00').replace('3:00', '15:00').replace('4:00', '16:00').replace('5:00', '17:00'),
      duration: parseInt(duration) * 60,
      clientName: user?.name || 'Cliente',
      clientPhone: user?.phone,
      service: mockProvider.service,
      type: 'kompa2go',
      status: 'confirmed',
      notes: notes || undefined,
      providerId: providerId as string
    });
    
    console.log('New Kompa2Go booking added to provider calendar - real-time update triggered');
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !address) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos.');
      return;
    }

    if (!canBook) {
      Alert.alert(
        'Saldo Insuficiente',
        'Necesitas tener al menos ₡500 en tu billetera o un pase de reserva disponible para confirmar la reserva.',
        [
          {
            text: 'Recargar Billetera',
            onPress: () => router.push('/(tabs)')
          },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
      return;
    }

    setIsProcessing(true);
    
    try {
      let passId: string;
      
      if (paymentMethod === 'wallet') {
        passId = await processBookingWithWallet();
      } else {
        passId = await processBookingWithPass();
      }
      
      await finalizeBooking(passId);

      Alert.alert(
        'Reserva Confirmada',
        `¡Perfecto! Tu reserva con ${mockProvider.name} ha sido confirmada para el ${new Date(selectedDate).toLocaleDateString('es-ES')} a las ${selectedTime}.\n\nRecibirás los datos de contacto del proveedor en breve. El pago del servicio (₡${totalPrice.toLocaleString()}) se realiza directamente al proveedor.\n\n✅ El calendario del proveedor se actualizará automáticamente.`,
        [
          {
            text: 'Ver Mis Reservas',
            onPress: () => router.push('/(tabs)')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo procesar la reserva. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPrice = parseInt(duration) * 8000;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.providerCard}>
        <Text style={styles.providerImage}>{mockProvider.image}</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{mockProvider.name}</Text>
          <Text style={styles.providerService}>{mockProvider.service}</Text>
          <View style={styles.location}>
            <MapPin size={14} color="#666" />
            <Text style={styles.locationText}>{mockProvider.location}</Text>
          </View>
        </View>
        <Text style={styles.priceText}>{mockProvider.price}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha y Hora</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha * (Solo horarios disponibles)</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => {
                // Here you would implement a date picker
                // For now, let's set tomorrow as an example
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateString = tomorrow.toISOString().split('T')[0];
                setSelectedDate(dateString);
                
                // Get available time slots for the selected date
                const slots = getAvailableTimeSlotsForDate(dateString, providerId as string);
                setAvailableTimeSlots(slots);
                console.log('Available time slots for client:', slots);
              }}
            >
              <Calendar size={20} color="#666" />
              <Text style={[styles.input, { color: selectedDate ? '#333' : '#999' }]}>
                {selectedDate ? new Date(selectedDate).toLocaleDateString('es-ES') : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hora *</Text>
            <View style={styles.timeSlots}>
              {selectedDate ? (
                availableTimeSlots.length > 0 ? (
                  availableTimeSlots.map((time) => {
                    // Convert 24h format to 12h format for display
                    const hour = parseInt(time.split(':')[0]);
                    const displayTime = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;
                    
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeSlot,
                          selectedTime === displayTime && styles.timeSlotSelected
                        ]}
                        onPress={() => setSelectedTime(displayTime)}
                      >
                        <Text style={[
                          styles.timeSlotText,
                          selectedTime === displayTime && styles.timeSlotTextSelected
                        ]}>
                          {displayTime}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.noSlotsContainer}>
                    <Text style={styles.noSlotsText}>No hay horarios disponibles para esta fecha</Text>
                    <Text style={styles.noSlotsSubtext}>Por favor selecciona otra fecha</Text>
                  </View>
                )
              ) : (
                <View style={styles.selectDateContainer}>
                  <Text style={styles.selectDateText}>Selecciona una fecha para ver horarios disponibles</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duración (horas)</Text>
            <View style={styles.durationContainer}>
              <TouchableOpacity 
                style={styles.durationButton}
                onPress={() => setDuration(Math.max(1, parseInt(duration) - 1).toString())}
              >
                <Text style={styles.durationButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.durationText}>{duration} horas</Text>
              <TouchableOpacity 
                style={styles.durationButton}
                onPress={() => setDuration((parseInt(duration) + 1).toString())}
              >
                <Text style={styles.durationButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles del Servicio</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección *</Text>
            <View style={styles.addressInput}>
              <MapPin size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu dirección completa"
                value={address}
                onChangeText={setAddress}
                placeholderTextColor="#999"
                multiline
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notas adicionales</Text>
            <View style={styles.notesInput}>
              <MessageSquare size={20} color="#666" />
              <TextInput
                style={[styles.input, styles.notesTextInput]}
                placeholder="Instrucciones especiales, acceso, etc."
                value={notes}
                onChangeText={setNotes}
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de Pago</Text>
          
          <View style={styles.paymentSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Servicio ({duration} horas)</Text>
              <Text style={styles.summaryValue}>₡{totalPrice.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Comisión de plataforma</Text>
              <Text style={styles.summaryValue}>₡500</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total a pagar ahora</Text>
              <Text style={styles.totalValue}>₡500</Text>
            </View>
            <Text style={styles.paymentNote}>
              El pago del servicio (₡{totalPrice.toLocaleString()}) se realiza directamente al proveedor.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={handleBooking}
        >
          <CreditCard size={20} color="white" />
          <Text style={styles.bookButtonText}>Confirmar Reserva - ₡500</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  providerCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  providerImage: {
    fontSize: 40,
    width: 60,
    height: 60,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  providerService: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D81B60',
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  timeSlotSelected: {
    backgroundColor: '#D81B60',
    borderColor: '#D81B60',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
  },
  timeSlotTextSelected: {
    color: 'white',
  },
  noSlotsContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
    textAlign: 'center',
    marginBottom: 4,
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: '#FF8F00',
    textAlign: 'center',
  },
  selectDateContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  selectDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    textAlign: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  durationButton: {
    backgroundColor: '#F5F5F5',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  durationText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addressInput: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  notesInput: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  notesTextInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  paymentSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D81B60',
  },
  paymentNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    fontStyle: 'italic',
  },
  actionButtons: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D81B60',
    paddingVertical: 16,
    borderRadius: 12,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});