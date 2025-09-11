import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentBackend } from '@/contexts/PaymentBackendContext';
import { CreditCard, DollarSign, Globe, TrendingUp, RefreshCw } from 'lucide-react-native';

export default function PaymentBackendDemo() {
  const { user } = useAuth();
  const {
    selectedCountry,
    setSelectedCountry,
    supportedCountries,
    currentCountryConfig,
    isLoadingCountries,
    isCreatingPayment,
    createPayment,
    updatePaymentStatus,
    getUserPayments,
    getPaymentStats,
    calculateFees,
    formatAmount,
    isPaymentMethodSupported,
  } = usePaymentBackend();

  const [amount, setAmount] = useState('1000');
  const [description, setDescription] = useState('Test payment');
  const [selectedMethod, setSelectedMethod] = useState<string>('sinpe');

  const handleCreatePayment = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const payment = await createPayment({
        amount: parseFloat(amount),
        paymentMethod: selectedMethod as any,
        description,
        proofImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      });

      Alert.alert('Success', `Payment created: ${payment.id}`);
      setAmount('');
      setDescription('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const handleUpdatePaymentStatus = async (paymentId: string, status: string) => {
    if (user?.userType !== 'admin') {
      Alert.alert('Error', 'Admin access required');
      return;
    }

    try {
      await updatePaymentStatus(paymentId, status as any, 'Updated from demo');
      Alert.alert('Success', `Payment ${status}`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Update failed');
    }
  };

  const userPayments = getUserPayments();
  const paymentStats = getPaymentStats();
  const fees = amount ? calculateFees(parseFloat(amount) || 0, selectedMethod) : null;

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Payment Backend Demo',
          headerStyle: { backgroundColor: '#2563EB' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      
      <View style={styles.container}>
        <LinearGradient
          colors={['#2563EB', '#3B82F6']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Payment Backend</Text>
          <Text style={styles.headerSubtitle}>
            Multi-country payment processing system
          </Text>
        </LinearGradient>

        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            
            {/* Country Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Globe size={20} color="#2563EB" />
                <Text style={styles.sectionTitle}>Country Selection</Text>
              </View>
              
              {isLoadingCountries ? (
                <Text style={styles.loadingText}>Loading countries...</Text>
              ) : (
                <View style={styles.countryGrid}>
                  {supportedCountries.map((country) => (
                    <TouchableOpacity
                      key={country.code}
                      style={[
                        styles.countryCard,
                        selectedCountry === country.code && styles.selectedCountryCard
                      ]}
                      onPress={() => setSelectedCountry(country.code)}
                    >
                      <Text style={styles.countryCode}>{country.code}</Text>
                      <Text style={styles.countryName}>{country.name}</Text>
                      <Text style={styles.countryCurrency}>{country.symbol} {country.currency}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Payment Methods */}
            {currentCountryConfig && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <CreditCard size={20} color="#2563EB" />
                  <Text style={styles.sectionTitle}>Payment Methods</Text>
                </View>
                
                <View style={styles.methodGrid}>
                  {currentCountryConfig.supportedMethods.map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.methodCard,
                        selectedMethod === method && styles.selectedMethodCard
                      ]}
                      onPress={() => setSelectedMethod(method)}
                    >
                      <Text style={styles.methodName}>{method.toUpperCase()}</Text>
                      <Text style={styles.methodFee}>
                        Fee: {currentCountryConfig.processingFees[method] < 1 
                          ? `${(currentCountryConfig.processingFees[method] * 100).toFixed(1)}%`
                          : formatAmount(currentCountryConfig.processingFees[method])
                        }
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Create Payment */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <DollarSign size={20} color="#2563EB" />
                <Text style={styles.sectionTitle}>Create Payment</Text>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Amount</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Payment description"
                />
              </View>

              {fees && (
                <View style={styles.feeBreakdown}>
                  <Text style={styles.feeTitle}>Fee Breakdown:</Text>
                  <Text style={styles.feeItem}>Amount: {formatAmount(parseFloat(amount))}</Text>
                  <Text style={styles.feeItem}>Processing Fee: {formatAmount(fees.processingFee)}</Text>
                  <Text style={styles.feeItem}>Tax: {formatAmount(fees.taxAmount)}</Text>
                  <Text style={styles.feeTotalItem}>Total: {formatAmount(fees.totalAmount)}</Text>
                </View>
              )}
              
              <TouchableOpacity
                style={[styles.createButton, isCreatingPayment && styles.disabledButton]}
                onPress={handleCreatePayment}
                disabled={isCreatingPayment}
              >
                <Text style={styles.createButtonText}>
                  {isCreatingPayment ? 'Creating...' : 'Create Payment'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Payment Statistics (Admin Only) */}
            {user?.userType === 'admin' && paymentStats && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <TrendingUp size={20} color="#2563EB" />
                  <Text style={styles.sectionTitle}>Payment Statistics</Text>
                </View>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{paymentStats.total}</Text>
                    <Text style={styles.statLabel}>Total Payments</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{paymentStats.pending}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{paymentStats.completed}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{formatAmount(paymentStats.completedAmount)}</Text>
                    <Text style={styles.statLabel}>Revenue</Text>
                  </View>
                </View>
              </View>
            )}

            {/* User Payments */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <RefreshCw size={20} color="#2563EB" />
                <Text style={styles.sectionTitle}>Recent Payments</Text>
              </View>
              
              {userPayments.length === 0 ? (
                <Text style={styles.emptyText}>No payments found</Text>
              ) : (
                userPayments.slice(0, 5).map((payment) => (
                  <View key={payment.id} style={styles.paymentCard}>
                    <View style={styles.paymentHeader}>
                      <Text style={styles.paymentAmount}>{formatAmount(payment.totalAmount)}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                        <Text style={styles.statusText}>{payment.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.paymentDescription}>{payment.description}</Text>
                    <Text style={styles.paymentMethod}>{payment.paymentMethod.toUpperCase()}</Text>
                    
                    {user?.userType === 'admin' && payment.status === 'pending' && (
                      <View style={styles.adminActions}>
                        <TouchableOpacity
                          style={styles.approveButton}
                          onPress={() => handleUpdatePaymentStatus(payment.id, 'completed')}
                        >
                          <Text style={styles.approveButtonText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => handleUpdatePaymentStatus(payment.id, 'failed')}
                        >
                          <Text style={styles.rejectButtonText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return '#10B981';
    case 'pending': return '#F59E0B';
    case 'processing': return '#3B82F6';
    case 'failed': return '#EF4444';
    case 'cancelled': return '#6B7280';
    case 'refunded': return '#8B5CF6';
    default: return '#6B7280';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    padding: 20,
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  countryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 100,
    alignItems: 'center',
  },
  selectedCountryCard: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  countryName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  countryCurrency: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  methodCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedMethodCard: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  methodName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  methodFee: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  feeBreakdown: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  feeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  feeItem: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  feeTotalItem: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  createButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  paymentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  paymentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  approveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});