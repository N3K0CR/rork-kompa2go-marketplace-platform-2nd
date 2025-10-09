import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { paymentService, PaymentMethod, PaymentMethodType } from '@/src/modules/commute/services/payment-service';
import { 
  ChevronLeft, 
  Plus, 
  CreditCard, 
  Smartphone, 
  Wallet, 
  DollarSign,
  Check,
  Trash2,
  X,
} from 'lucide-react-native';

export default function PaymentMethodsScreen() {
  const { user } = useAuth();
  const { firebaseUser } = useFirebaseAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<PaymentMethodType>('card');
  const [formData, setFormData] = useState({
    name: '',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    sinpePhone: '',
  });

  useEffect(() => {
    loadPaymentMethods();
  }, [firebaseUser]);

  const loadPaymentMethods = async () => {
    if (!firebaseUser?.uid) return;
    
    try {
      setLoading(true);
      const methods = await paymentService.getPaymentMethods(firebaseUser.uid);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert('Error', 'No se pudieron cargar los métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!firebaseUser?.uid) return;

    if (!formData.name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el método de pago');
      return;
    }

    if (selectedType === 'card') {
      if (!formData.cardNumber || !formData.cardHolder || !formData.expiryDate) {
        Alert.alert('Error', 'Por favor completa todos los campos de la tarjeta');
        return;
      }
    } else if (selectedType === 'sinpe') {
      if (!formData.sinpePhone) {
        Alert.alert('Error', 'Por favor ingresa el número de teléfono SINPE');
        return;
      }
    }

    try {
      const newMethod = await paymentService.addPaymentMethod(firebaseUser.uid, {
        type: selectedType,
        name: formData.name,
        isDefault: paymentMethods.length === 0,
        details: {
          cardNumber: selectedType === 'card' ? formData.cardNumber : undefined,
          cardHolder: selectedType === 'card' ? formData.cardHolder : undefined,
          expiryDate: selectedType === 'card' ? formData.expiryDate : undefined,
          sinpePhone: selectedType === 'sinpe' ? formData.sinpePhone : undefined,
        },
      });

      setPaymentMethods([...paymentMethods, newMethod]);
      setShowAddModal(false);
      resetForm();
      Alert.alert('Éxito', 'Método de pago agregado correctamente');
    } catch (error) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', 'No se pudo agregar el método de pago');
    }
  };

  const handleSetDefault = async (methodId: string) => {
    if (!firebaseUser?.uid) return;

    try {
      await paymentService.setDefaultPaymentMethod(firebaseUser.uid, methodId);
      await loadPaymentMethods();
      Alert.alert('Éxito', 'Método de pago predeterminado actualizado');
    } catch (error) {
      console.error('Error setting default payment method:', error);
      Alert.alert('Error', 'No se pudo actualizar el método de pago predeterminado');
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    if (!firebaseUser?.uid) return;

    Alert.alert(
      'Eliminar método de pago',
      '¿Estás seguro de que deseas eliminar este método de pago?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentService.deletePaymentMethod(firebaseUser.uid, methodId);
              await loadPaymentMethods();
              Alert.alert('Éxito', 'Método de pago eliminado');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el método de pago');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      sinpePhone: '',
    });
    setSelectedType('card');
  };

  const getPaymentMethodIcon = (type: PaymentMethodType) => {
    switch (type) {
      case 'cash':
        return <DollarSign size={24} color="#65ea06" />;
      case 'card':
        return <CreditCard size={24} color="#65ea06" />;
      case 'sinpe':
        return <Smartphone size={24} color="#65ea06" />;
      case 'wallet':
        return <Wallet size={24} color="#65ea06" />;
    }
  };

  if (user?.userType !== 'client') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Acceso Denegado' }} />
        <Text style={styles.errorText}>Esta función es solo para clientes</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Métodos de Pago',
          headerStyle: { backgroundColor: '#65ea06' },
          headerTintColor: '#131c0d',
          headerTitleStyle: { fontWeight: 'bold' as const },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#131c0d" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tus métodos de pago</Text>
          <Text style={styles.headerSubtitle}>
            Gestiona cómo pagas tus viajes en Kommute
          </Text>
        </View>

        {paymentMethods.map((method) => (
          <View key={method.id} style={styles.paymentMethodCard}>
            <View style={styles.methodHeader}>
              <View style={styles.methodIcon}>
                {getPaymentMethodIcon(method.type)}
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodType}>
                  {paymentService.getPaymentMethodLabel(method.type)}
                </Text>
                {method.details?.cardNumber && (
                  <Text style={styles.methodDetails}>
                    {paymentService.maskCardNumber(method.details.cardNumber)}
                  </Text>
                )}
                {method.details?.sinpePhone && (
                  <Text style={styles.methodDetails}>
                    {paymentService.maskSinpePhone(method.details.sinpePhone)}
                  </Text>
                )}
              </View>
              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <Check size={16} color="white" />
                  <Text style={styles.defaultBadgeText}>Predeterminado</Text>
                </View>
              )}
            </View>

            <View style={styles.methodActions}>
              {!method.isDefault && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetDefault(method.id)}
                >
                  <Text style={styles.actionButtonText}>Establecer como predeterminado</Text>
                </TouchableOpacity>
              )}
              {method.type !== 'cash' && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePaymentMethod(method.id)}
                >
                  <Trash2 size={18} color="#F44336" />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#131c0d" />
          <Text style={styles.addButtonText}>Agregar método de pago</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar método de pago</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <X size={24} color="#131c0d" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>Tipo de método</Text>
              <View style={styles.typeSelector}>
                {(['card', 'sinpe', 'wallet'] as PaymentMethodType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      selectedType === type && styles.typeOptionSelected,
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    {getPaymentMethodIcon(type)}
                    <Text
                      style={[
                        styles.typeOptionText,
                        selectedType === type && styles.typeOptionTextSelected,
                      ]}
                    >
                      {paymentService.getPaymentMethodLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Mi tarjeta principal"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              {selectedType === 'card' && (
                <>
                  <Text style={styles.sectionLabel}>Número de tarjeta</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChangeText={(text) => setFormData({ ...formData, cardNumber: text })}
                    keyboardType="numeric"
                    maxLength={19}
                  />

                  <Text style={styles.sectionLabel}>Titular de la tarjeta</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre completo"
                    value={formData.cardHolder}
                    onChangeText={(text) => setFormData({ ...formData, cardHolder: text })}
                    autoCapitalize="words"
                  />

                  <Text style={styles.sectionLabel}>Fecha de vencimiento</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/AA"
                    value={formData.expiryDate}
                    onChangeText={(text) => setFormData({ ...formData, expiryDate: text })}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </>
              )}

              {selectedType === 'sinpe' && (
                <>
                  <Text style={styles.sectionLabel}>Número de teléfono</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="8888-8888"
                    value={formData.sinpePhone}
                    onChangeText={(text) => setFormData({ ...formData, sinpePhone: text })}
                    keyboardType="phone-pad"
                  />
                </>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddPaymentMethod}
              >
                <Text style={styles.submitButtonText}>Agregar método</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafcf8',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b9e47',
  },
  paymentMethodCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fff4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 4,
  },
  methodType: {
    fontSize: 14,
    color: '#6b9e47',
    marginBottom: 2,
  },
  methodDetails: {
    fontSize: 12,
    color: '#9ca3af',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#65ea06',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'white',
  },
  methodActions: {
    gap: 8,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fff4',
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#65ea06',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F44336',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#65ea06',
    borderRadius: 16,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  errorText: {
    fontSize: 18,
    color: '#6b9e47',
    textAlign: 'center',
    marginTop: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b9e47',
    marginBottom: 8,
    marginTop: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#fafcf8',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    backgroundColor: '#f8fff4',
    borderColor: '#65ea06',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6b9e47',
  },
  typeOptionTextSelected: {
    color: '#65ea06',
  },
  input: {
    backgroundColor: '#fafcf8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#131c0d',
    borderWidth: 1,
    borderColor: '#ecf4e6',
  },
  submitButton: {
    backgroundColor: '#65ea06',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
});
