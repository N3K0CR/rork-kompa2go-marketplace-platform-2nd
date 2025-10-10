import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { DollarSign, TrendingDown, Camera, AlertCircle, CheckCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface PriceNegotiationCardProps {
  kommutePrice: number;
  onNegotiate: (uberPrice: number, screenshot?: string) => Promise<void>;
  tripNumber?: number;
  requiresScreenshot?: boolean;
}

export function PriceNegotiationCard({
  kommutePrice,
  onNegotiate,
  tripNumber = 1,
  requiresScreenshot = false,
}: PriceNegotiationCardProps) {
  const [uberPrice, setUberPrice] = useState('');
  const [screenshot, setScreenshot] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [negotiatedPrice, setNegotiatedPrice] = useState<number | null>(null);
  const [discount, setDiscount] = useState<number | null>(null);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Se necesita permiso para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setScreenshot(result.assets[0].base64);
        console.log('✅ Screenshot selected');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleNegotiate = async () => {
    const price = parseFloat(uberPrice);

    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Por favor ingresa un precio válido');
      return;
    }

    if (requiresScreenshot && !screenshot) {
      Alert.alert(
        'Captura Requerida',
        `A partir del viaje ${tripNumber}, necesitas subir una captura de pantalla del precio de Uber para negociar.`
      );
      return;
    }

    if (price >= kommutePrice) {
      Alert.alert(
        'Precio Alto',
        'El precio de Uber que ingresaste es mayor o igual al precio de Kommute. ¿Estás seguro?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => processNegotiation(price) },
        ]
      );
      return;
    }

    await processNegotiation(price);
  };

  const processNegotiation = async (price: number) => {
    setLoading(true);
    try {
      await onNegotiate(price, screenshot);

      const discountPercentage = Math.random() * (3 - 2) + 2;
      const newPrice = price * (1 - discountPercentage / 100);

      setNegotiatedPrice(newPrice);
      setDiscount(discountPercentage);

      console.log('✅ Price negotiation successful');
    } catch (error: any) {
      console.error('Error negotiating price:', error);
      Alert.alert('Error', error.message || 'No se pudo negociar el precio');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUberPrice('');
    setScreenshot(undefined);
    setNegotiatedPrice(null);
    setDiscount(null);
  };

  if (negotiatedPrice !== null && discount !== null) {
    return (
      <View style={styles.container}>
        <View style={styles.successHeader}>
          <CheckCircle size={24} color="#10b981" />
          <Text style={styles.successTitle}>¡Precio Negociado!</Text>
        </View>

        <View style={styles.priceComparison}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Precio Uber</Text>
            <Text style={styles.priceValue}>₡{parseFloat(uberPrice).toFixed(2)}</Text>
          </View>

          <TrendingDown size={24} color="#10b981" />

          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Precio Kommute</Text>
            <Text style={[styles.priceValue, styles.negotiatedPrice]}>
              ₡{negotiatedPrice.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>
            {discount.toFixed(1)}% más barato que Uber
          </Text>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Negociar Otro Precio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <DollarSign size={24} color="#3b82f6" />
        <Text style={styles.title}>Negociación de Precio</Text>
      </View>

      <Text style={styles.description}>
        Ingresa el precio actual de Uber para la misma ruta y te ofreceremos un precio 2-3% más bajo
      </Text>

      <View style={styles.currentPriceContainer}>
        <Text style={styles.currentPriceLabel}>Precio Kommute:</Text>
        <Text style={styles.currentPriceValue}>₡{kommutePrice.toFixed(2)}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Precio de Uber (₡)</Text>
        <TextInput
          style={styles.input}
          value={uberPrice}
          onChangeText={setUberPrice}
          placeholder="0.00"
          keyboardType="decimal-pad"
          placeholderTextColor="#999"
        />
      </View>

      {requiresScreenshot && (
        <View style={styles.screenshotSection}>
          <View style={styles.screenshotHeader}>
            <AlertCircle size={20} color="#f59e0b" />
            <Text style={styles.screenshotTitle}>
              Captura Requerida (Viaje #{tripNumber})
            </Text>
          </View>
          <Text style={styles.screenshotDescription}>
            A partir del viaje 11, necesitas subir una captura de pantalla del precio de Uber
          </Text>

          <TouchableOpacity
            style={[styles.screenshotButton, screenshot && styles.screenshotButtonSelected]}
            onPress={handlePickImage}
          >
            <Camera size={20} color={screenshot ? '#10b981' : '#3b82f6'} />
            <Text style={[styles.screenshotButtonText, screenshot && styles.screenshotButtonTextSelected]}>
              {screenshot ? 'Captura Seleccionada ✓' : 'Subir Captura de Uber'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!requiresScreenshot && tripNumber <= 10 && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Viajes sin captura: {11 - tripNumber} restantes
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.negotiateButton, loading && styles.negotiateButtonDisabled]}
        onPress={handleNegotiate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <TrendingDown size={20} color="white" />
            <Text style={styles.negotiateButtonText}>Negociar Precio</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        * Los precios se verifican periódicamente. El uso fraudulento resultará en bloqueo permanente.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  currentPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  currentPriceLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  currentPriceValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  screenshotSection: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  screenshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  screenshotTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#92400e',
  },
  screenshotDescription: {
    fontSize: 12,
    color: '#78350f',
    marginBottom: 12,
    lineHeight: 18,
  },
  screenshotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  screenshotButtonSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  screenshotButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3b82f6',
  },
  screenshotButtonTextSelected: {
    color: '#10b981',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    textAlign: 'center',
  },
  negotiateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  negotiateButtonDisabled: {
    opacity: 0.6,
  },
  negotiateButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'white',
  },
  disclaimer: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#10b981',
  },
  priceComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1f2937',
  },
  negotiatedPrice: {
    color: '#10b981',
  },
  discountBadge: {
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#065f46',
    textAlign: 'center',
  },
  resetButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
    textAlign: 'center',
  },
});
