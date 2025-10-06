import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { X, Shield, AlertTriangle, CheckCircle, Phone } from 'lucide-react-native';
import { securityVerificationService } from '@/src/modules/alerts/services/security-verification-service';
import { alertTrackingService } from '@/src/modules/alerts/services/alert-tracking-service';
import type { SecurityQuestion } from '@/src/shared/types/alert-types';

interface SecurityVerificationModalProps {
  visible: boolean;
  alertId: string;
  driverId: string;
  driverName: string;
  onClose: () => void;
  onVerificationComplete: (action: 'tracking_enabled' | '911_called' | 'dismissed') => void;
}

type VerificationStep = 'initial' | 'first_question' | 'second_question' | 'completed';

export default function SecurityVerificationModal({
  visible,
  alertId,
  driverId,
  driverName,
  onClose,
  onVerificationComplete
}: SecurityVerificationModalProps) {
  const [step, setStep] = useState<VerificationStep>('initial');
  const [currentQuestion, setCurrentQuestion] = useState<SecurityQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartVerification = async () => {
    try {
      setLoading(true);
      const firstQuestion = await securityVerificationService.startVerification(alertId, 'admin');
      setCurrentQuestion(firstQuestion);
      setStep('first_question');
      setAnswer('');
    } catch (error) {
      console.error('Error starting verification:', error);
      Alert.alert('Error', 'No se pudo iniciar la verificación. El conductor debe configurar sus preguntas de seguridad primero.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFirstQuestion = async () => {
    if (!answer.trim()) {
      Alert.alert('Error', 'Por favor ingresa una respuesta');
      return;
    }

    try {
      setLoading(true);
      const result = await securityVerificationService.verifyFirstQuestion(alertId, answer);
      
      if (result.correct && result.nextQuestion) {
        setCurrentQuestion(result.nextQuestion);
        setStep('second_question');
        setAnswer('');
        
        await alertTrackingService.startTracking(alertId, driverId);
        
        Alert.alert(
          '✅ Primera Verificación Correcta',
          'Seguimiento en tiempo real activado.\n\nProcediendo con segunda pregunta de verificación.'
        );
      } else {
        Alert.alert(
          '❌ Verificación Fallida',
          'La respuesta es incorrecta. La alerta ha sido descartada.',
          [
            {
              text: 'Entendido',
              onPress: () => {
                onVerificationComplete('dismissed');
                handleClose();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error verifying first question:', error);
      Alert.alert('Error', 'No se pudo verificar la respuesta');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySecondQuestion = async () => {
    if (!answer.trim()) {
      Alert.alert('Error', 'Por favor ingresa una respuesta');
      return;
    }

    try {
      setLoading(true);
      const result = await securityVerificationService.verifySecondQuestion(alertId, answer);
      
      if (result.correct && result.action === 'call_911') {
        const call911Id = await alertTrackingService.call911(
          alertId,
          driverId,
          'admin',
          {
            name: driverName,
            phone: 'Ver en sistema',
            vehicleInfo: 'Ver en sistema'
          }
        );
        
        Alert.alert(
          '🚨 Protocolo 911 Activado',
          `Verificación completada exitosamente.\n\nSeguimiento en tiempo real: ACTIVO\nLlamada al 911: INICIADA\n\nCódigo de despacho: ${call911Id.substring(0, 8)}\n\nLas autoridades han sido notificadas con la ubicación en tiempo real del conductor.`,
          [
            {
              text: 'Entendido',
              onPress: () => {
                onVerificationComplete('911_called');
                handleClose();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          '❌ Verificación Fallida',
          'La respuesta es incorrecta. La alerta ha sido descartada.',
          [
            {
              text: 'Entendido',
              onPress: () => {
                onVerificationComplete('dismissed');
                handleClose();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error verifying second question:', error);
      Alert.alert('Error', 'No se pudo verificar la respuesta');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('initial');
    setCurrentQuestion(null);
    setAnswer('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Shield size={24} color="#FF3B30" />
            </View>
            <Text style={styles.title}>Verificación de Seguridad</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.driverInfo}>
            <Text style={styles.driverLabel}>Conductor:</Text>
            <Text style={styles.driverName}>{driverName}</Text>
            <Text style={styles.driverId}>ID: {driverId}</Text>
          </View>

          {step === 'initial' && (
            <View style={styles.content}>
              <View style={styles.infoBox}>
                <AlertTriangle size={20} color="#FF9500" />
                <Text style={styles.infoText}>
                  Este proceso verificará la identidad del conductor mediante preguntas de seguridad personalizadas.
                </Text>
              </View>

              <View style={styles.stepsContainer}>
                <Text style={styles.stepsTitle}>Proceso de Verificación:</Text>
                <View style={styles.stepItem}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.stepText}>
                    Primera pregunta (código encriptado){'\n'}
                    Si es correcta → Activa seguimiento en tiempo real
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={styles.stepText}>
                    Segunda pregunta (contexto costarricense){'\n'}
                    Si es correcta → Llama al 911
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.startButton, loading && styles.buttonDisabled]}
                onPress={handleStartVerification}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Shield size={20} color="#fff" />
                    <Text style={styles.startButtonText}>Iniciar Verificación</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {(step === 'first_question' || step === 'second_question') && currentQuestion && (
            <View style={styles.content}>
              <View style={styles.questionBox}>
                <Text style={styles.questionLabel}>
                  {step === 'first_question' ? 'Primera Pregunta' : 'Segunda Pregunta'}
                </Text>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
              </View>

              <View style={styles.answerSection}>
                <Text style={styles.answerLabel}>Respuesta del conductor:</Text>
                <TextInput
                  style={styles.input}
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder="Ingresa la respuesta (Sí/No)"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.verifyButton, loading && styles.buttonDisabled]}
                onPress={step === 'first_question' ? handleVerifyFirstQuestion : handleVerifySecondQuestion}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <CheckCircle size={20} color="#fff" />
                    <Text style={styles.verifyButtonText}>Verificar Respuesta</Text>
                  </>
                )}
              </TouchableOpacity>

              {step === 'first_question' && (
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>
                    💡 Si la respuesta es correcta, se activará el seguimiento en tiempo real automáticamente.
                  </Text>
                </View>
              )}

              {step === 'second_question' && (
                <View style={styles.warningBox}>
                  <Phone size={20} color="#FF3B30" />
                  <Text style={styles.warningText}>
                    ⚠️ Si la respuesta es correcta, se iniciará el protocolo de emergencia 911.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf4e6',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  closeButton: {
    padding: 4,
  },
  driverInfo: {
    backgroundColor: '#f8fff4',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf4e6',
  },
  driverLabel: {
    fontSize: 12,
    color: '#6b9e47',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 4,
  },
  driverId: {
    fontSize: 14,
    color: '#6b9e47',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#131c0d',
    lineHeight: 20,
  },
  stepsContainer: {
    gap: 12,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#65ea06',
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
    textAlign: 'center',
    lineHeight: 28,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#131c0d',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#65ea06',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  questionBox: {
    backgroundColor: '#f8fff4',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#65ea06',
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6b9e47',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#131c0d',
    lineHeight: 26,
  },
  answerSection: {
    gap: 8,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b9e47',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#131c0d',
    borderWidth: 2,
    borderColor: '#d4e8cc',
  },
  verifyButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  hintBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#131c0d',
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFE5E5',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#131c0d',
    fontWeight: '600' as const,
    lineHeight: 20,
  },
});
