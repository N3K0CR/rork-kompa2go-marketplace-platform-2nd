import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Wallet, Upload, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useKommuteWallet } from '../contexts/KommuteWalletContext';

const RECHARGE_AMOUNTS = [5000, 7000, 10000, 20000] as const;

export default function KommuteWalletRechargeScreen() {
  const router = useRouter();
  const { createRecharge, stats, refreshStats } = useKommuteWallet();
  
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [sinpeReference, setSinpeReference] = useState<string>('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    if (numericValue) {
      setSelectedAmount(parseInt(numericValue, 10));
    } else {
      setSelectedAmount(null);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos acceso a tu galería para subir el comprobante.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[Recharge] Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleSubmit = async () => {
    if (!selectedAmount) {
      Alert.alert('Error', 'Por favor selecciona o ingresa un monto');
      return;
    }

    if (selectedAmount < 5000) {
      Alert.alert('Error', 'El monto mínimo es ₡5,000');
      return;
    }

    if (!receiptUri) {
      Alert.alert('Error', 'Por favor sube el comprobante de pago');
      return;
    }

    if (!sinpeReference.trim()) {
      Alert.alert('Error', 'Por favor ingresa la referencia SINPE');
      return;
    }

    try {
      setIsUploading(true);

      const fileName = `receipt_${Date.now()}.jpg`;
      
      await createRecharge(
        selectedAmount,
        receiptUri,
        fileName,
        sinpeReference.trim()
      );

      Alert.alert(
        'Recarga solicitada',
        'Tu solicitud de recarga ha sido enviada. Será revisada y aprobada en breve.',
        [
          {
            text: 'OK',
            onPress: () => {
              refreshStats();
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('[Recharge] Error submitting:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudo procesar la recarga'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Recargar Billetera Kommute',
          headerStyle: { backgroundColor: '#6366f1' },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Wallet size={48} color="#6366f1" />
          <Text style={styles.headerTitle}>Recargar Billetera</Text>
          <Text style={styles.headerSubtitle}>
            Agrega fondos a tu billetera Kommute
          </Text>
        </View>

        {stats && (
          <View style={styles.statsContainer}>
            {stats.noValidationTripsRemaining > 0 && (
              <View style={styles.infoCard}>
                <CheckCircle size={24} color="#3b82f6" />
                <View style={styles.infoText}>
                  <Text style={styles.infoTitle}>Viajes sin validación previa</Text>
                  <Text style={styles.infoCount}>
                    {stats.noValidationTripsRemaining} de 2 viajes restantes
                  </Text>
                  <Text style={styles.infoDescription}>
                    No requieren validación previa pero se cobran normalmente
                  </Text>
                </View>
              </View>
            )}
            
            {stats.bonusTripsAvailable > 0 && (
              <View style={styles.bonusCard}>
                <CheckCircle size={24} color="#10b981" />
                <View style={styles.bonusText}>
                  <Text style={styles.bonusTitle}>Viajes bonificados disponibles</Text>
                  <Text style={styles.bonusCount}>
                    {stats.bonusTripsAvailable} viaje{stats.bonusTripsAvailable > 1 ? 's' : ''} gratis
                  </Text>
                  <Text style={styles.bonusDescription}>
                    Ganados por completar {stats.totalTripsCompleted} viajes
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>Progreso hacia próximo viaje bonificado</Text>
              <Text style={styles.progressCount}>
                {stats.totalTripsCompleted % 20} / 20 viajes
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${((stats.totalTripsCompleted % 20) / 20) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecciona el monto</Text>
          <View style={styles.amountsGrid}>
            {RECHARGE_AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.amountButton,
                  selectedAmount === amount && styles.amountButtonSelected
                ]}
                onPress={() => handleSelectAmount(amount)}
              >
                <Text
                  style={[
                    styles.amountText,
                    selectedAmount === amount && styles.amountTextSelected
                  ]}
                >
                  ₡{amount.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.orText}>o ingresa un monto personalizado</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>₡</Text>
            <TextInput
              style={styles.customAmountInput}
              placeholder="Monto personalizado (mín. 5,000)"
              placeholderTextColor="#9ca3af"
              value={customAmount}
              onChangeText={handleCustomAmountChange}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de pago</Text>
          
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentInfoTitle}>Datos para SINPE Móvil:</Text>
            <Text style={styles.paymentInfoText}>Teléfono: 8888-8888</Text>
            <Text style={styles.paymentInfoText}>Nombre: Kompa2Go S.A.</Text>
            <Text style={styles.paymentInfoText}>Cédula: 3-101-123456</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Referencia SINPE (ej: 123456789)"
              placeholderTextColor="#9ca3af"
              value={sinpeReference}
              onChangeText={setSinpeReference}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comprobante de pago</Text>
          
          {receiptUri ? (
            <View style={styles.receiptPreview}>
              <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
              <TouchableOpacity
                style={styles.changeReceiptButton}
                onPress={pickImage}
              >
                <Text style={styles.changeReceiptText}>Cambiar imagen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Upload size={32} color="#6366f1" />
              <Text style={styles.uploadButtonText}>Subir comprobante</Text>
              <Text style={styles.uploadButtonSubtext}>
                Toca para seleccionar una imagen
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.warningCard}>
          <AlertCircle size={20} color="#f59e0b" />
          <Text style={styles.warningText}>
            Tu recarga será revisada y aprobada en un plazo máximo de 24 horas.
            Recibirás una notificación cuando esté disponible.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedAmount || !receiptUri || !sinpeReference.trim() || isUploading) &&
              styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!selectedAmount || !receiptUri || !sinpeReference.trim() || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Solicitar recarga</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e40af',
  },
  infoCount: {
    fontSize: 12,
    color: '#1e3a8a',
    marginTop: 2,
  },
  infoDescription: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 4,
  },
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#d1fae5',
    padding: 16,
    borderRadius: 12,
  },
  bonusText: {
    marginLeft: 12,
    flex: 1,
  },
  bonusTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#065f46',
  },
  bonusCount: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  bonusDescription: {
    fontSize: 11,
    color: '#10b981',
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  progressCount: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 12,
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  amountButtonSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  amountTextSelected: {
    color: '#6366f1',
  },
  orText: {
    textAlign: 'center',
    color: '#6b7280',
    marginVertical: 16,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginRight: 8,
  },
  customAmountInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111827',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#111827',
  },
  paymentInfo: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  paymentInfoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1e40af',
    marginBottom: 8,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#1e3a8a',
    marginBottom: 4,
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6366f1',
    marginTop: 12,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  receiptPreview: {
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  changeReceiptButton: {
    marginTop: 12,
    padding: 12,
  },
  changeReceiptText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    marginLeft: 12,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
