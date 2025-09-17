import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CreditCard, AlertCircle } from 'lucide-react-native';

interface CardPaymentCheckoutProps {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function CardPaymentCheckout({
  planId,
  planName,
  amount,
  currency,
  onSuccess,
  onError,
}: CardPaymentCheckoutProps) {
  const handlePayment = () => {
    // For now, show that this feature is in development
    onError('La integración con Lemon Squeezy está en desarrollo. Por favor, usa otro método de pago.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CreditCard size={24} color="#D81B60" />
        <Text style={styles.title}>Pago con Tarjeta</Text>
      </View>
      
      <View style={styles.planInfo}>
        <Text style={styles.planName}>{planName}</Text>
        <Text style={styles.amount}>
          {currency === 'USD' ? '$' : '₡'}{amount.toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.developmentNotice}>
        <AlertCircle size={20} color="#F59E0B" />
        <Text style={styles.developmentText}>
          La integración con Lemon Squeezy está en desarrollo.
          Por favor, selecciona otro método de pago por ahora.
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.paymentButton} 
        onPress={handlePayment}
        disabled={true}
      >
        <Text style={styles.paymentButtonText}>
          Procesar Pago (En Desarrollo)
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  planInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  planName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D81B60',
  },
  developmentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  developmentText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
    lineHeight: 20,
  },
  paymentButton: {
    backgroundColor: '#9CA3AF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    opacity: 0.6,
  },
  paymentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});