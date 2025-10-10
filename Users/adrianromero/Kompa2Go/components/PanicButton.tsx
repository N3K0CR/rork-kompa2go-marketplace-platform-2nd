import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { useEmergency } from '@/contexts/EmergencyContext';

export function PanicButton() {
  const { triggerPanicButton, settings } = useEmergency();
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [activating, setActivating] = useState<boolean>(false);

  if (!settings?.panicButtonEnabled) {
    return null;
  }

  const handlePanicPress = () => {
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      setActivating(true);
      await triggerPanicButton('panic', 'Botón de pánico activado');
      setShowConfirm(false);
      Alert.alert(
        'Alerta Activada',
        'Se ha notificado a tus contactos de emergencia y a las autoridades.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error activating panic button:', error);
      Alert.alert('Error', 'No se pudo activar la alerta de emergencia');
    } finally {
      setActivating(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.panicButton}
        onPress={handlePanicPress}
        activeOpacity={0.8}
      >
        <AlertTriangle size={32} color="#FFFFFF" />
        <Text style={styles.panicButtonText}>SOS</Text>
      </TouchableOpacity>

      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <X size={24} color="#666" />
            </TouchableOpacity>

            <View style={styles.modalIcon}>
              <AlertTriangle size={64} color="#EF4444" />
            </View>

            <Text style={styles.modalTitle}>¿Activar Alerta de Emergencia?</Text>
            <Text style={styles.modalDescription}>
              Se notificará inmediatamente a tus contactos de emergencia y a las autoridades
              con tu ubicación actual.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
                disabled={activating}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, activating && styles.confirmButtonDisabled]}
                onPress={handleConfirm}
                disabled={activating}
              >
                <Text style={styles.confirmButtonText}>
                  {activating ? 'Activando...' : 'Activar SOS'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  panicButton: {
    position: 'absolute' as const,
    bottom: 24,
    right: 24,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  panicButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700' as const,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    padding: 8,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
