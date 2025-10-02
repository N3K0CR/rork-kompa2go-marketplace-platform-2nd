import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Upload, CheckCircle, AlertCircle, Clock } from 'lucide-react-native';
import { AccessibleText } from '@/components/AccessibleText';

import { useAccessibility } from '@/contexts/AccessibilityContext';
import { BackgroundCheckService, type KommuterStatus, type BackgroundCheckData } from '../backend/trpc/routes/kommuters/background-check-service';

export default function BackgroundCheckScreen() {
  const insets = useSafeAreaInsets();
  const { settings, speak } = useAccessibility();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<KommuterStatus | null>(null);
  const [checkData, setCheckData] = useState<BackgroundCheckData | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadBackgroundCheckStatus();
  }, []);

  const loadBackgroundCheckStatus = async () => {
    try {
      setLoading(true);
      const kommuterId = 'current-kommuter-id';
      
      const kommuterStatus = await BackgroundCheckService.checkKommuterStatus(kommuterId);
      setStatus(kommuterStatus);

      if (kommuterStatus.backgroundCheckRequired) {
        const checkDetails = await BackgroundCheckService.getBackgroundCheckDetails(kommuterId);
        setCheckData(checkDetails);
      }
    } catch (error) {
      console.error('Error loading background check status:', error);
      Alert.alert('Error', 'No se pudo cargar el estado de verificación');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocuments = async () => {
    if (settings.ttsEnabled) {
      speak('Subiendo documentos de antecedentes penales');
    }

    setUploading(true);
    try {
      const kommuterId = 'current-kommuter-id';
      
      await BackgroundCheckService.submitBackgroundCheckDocuments(kommuterId, {
        criminalRecordUrl: 'https://example.com/criminal-record.pdf',
        identityVerificationUrl: 'https://example.com/identity.pdf',
      });

      Alert.alert(
        'Documentos Enviados',
        'Tus documentos han sido enviados exitosamente. Recibirás una notificación cuando sean revisados.',
        [{ text: 'OK', onPress: loadBackgroundCheckStatus }]
      );
    } catch (error) {
      console.error('Error uploading documents:', error);
      Alert.alert('Error', 'No se pudieron subir los documentos. Intenta nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = () => {
    if (!status?.backgroundCheckRequired) {
      return <CheckCircle size={48} color="#34C759" />;
    }

    switch (status.backgroundCheckStatus) {
      case 'pending':
        return <Clock size={48} color="#FF9500" />;
      case 'in_progress':
        return <Clock size={48} color="#007AFF" />;
      case 'approved':
        return <CheckCircle size={48} color="#34C759" />;
      case 'rejected':
        return <AlertCircle size={48} color="#FF3B30" />;
      default:
        return <FileText size={48} color="#666" />;
    }
  };

  const getStatusMessage = () => {
    if (!status?.backgroundCheckRequired) {
      return {
        title: 'Sin Verificación Requerida',
        message: `Has completado ${status?.tripsCompleted || 0} viajes. La verificación de antecedentes se requiere después de 20 viajes.`,
        color: '#34C759',
      };
    }

    switch (status.backgroundCheckStatus) {
      case 'pending':
        return {
          title: 'Verificación Pendiente',
          message: 'Has alcanzado 20 viajes. Por favor, sube tus documentos de antecedentes penales para continuar aceptando viajes.',
          color: '#FF9500',
        };
      case 'in_progress':
        return {
          title: 'En Revisión',
          message: 'Tus documentos están siendo revisados. Te notificaremos cuando el proceso esté completo.',
          color: '#007AFF',
        };
      case 'approved':
        return {
          title: 'Verificación Aprobada',
          message: '¡Felicidades! Tu verificación de antecedentes ha sido aprobada. Puedes continuar aceptando viajes.',
          color: '#34C759',
        };
      case 'rejected':
        return {
          title: 'Verificación Rechazada',
          message: 'Tu verificación de antecedentes no fue aprobada. Por favor, contacta con soporte para más información.',
          color: '#FF3B30',
        };
      default:
        return {
          title: 'Estado Desconocido',
          message: 'No se pudo determinar el estado de tu verificación.',
          color: '#666',
        };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Verificación de Antecedentes', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusMessage();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Verificación de Antecedentes', headerShown: true }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>{getStatusIcon()}</View>
          <AccessibleText text={statusInfo.title} style={[styles.statusTitle, { color: statusInfo.color }]} />
          <Text style={styles.statusMessage}>{statusInfo.message}</Text>
        </View>

        <View style={styles.infoCard}>
          <AccessibleText text="Información Importante" style={styles.sectionTitle} />
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📋</Text>
            <Text style={styles.infoText}>
              La verificación de antecedentes es obligatoria después de completar 20 viajes
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <Text style={styles.infoText}>
              El proceso de revisión toma entre 24-48 horas
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🚫</Text>
            <Text style={styles.infoText}>
              No podrás aceptar nuevos viajes hasta que la verificación sea aprobada
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>✅</Text>
            <Text style={styles.infoText}>
              Una vez aprobada, podrás continuar trabajando normalmente
            </Text>
          </View>
        </View>

        {status?.backgroundCheckRequired && status.backgroundCheckStatus === 'pending' && (
          <View style={styles.uploadCard}>
            <AccessibleText text="Documentos Requeridos" style={styles.sectionTitle} />
            
            <View style={styles.documentItem}>
              <FileText size={24} color="#007AFF" />
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>Certificado de Antecedentes Penales</Text>
                <Text style={styles.documentDescription}>
                  Documento oficial emitido por el Ministerio de Justicia
                </Text>
              </View>
            </View>

            <View style={styles.documentItem}>
              <FileText size={24} color="#007AFF" />
              <View style={styles.documentInfo}>
                <Text style={styles.documentTitle}>Verificación de Identidad</Text>
                <Text style={styles.documentDescription}>
                  Copia de cédula de identidad (ambos lados)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadDocuments}
              disabled={uploading}
            >
              <Upload size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.uploadButtonText}>
                {uploading ? 'Subiendo...' : 'Subir Documentos'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.uploadNote}>
              * Los documentos deben estar en formato PDF o imagen (JPG, PNG)
            </Text>
          </View>
        )}

        {checkData && (
          <View style={styles.detailsCard}>
            <AccessibleText text="Detalles de la Verificación" style={styles.sectionTitle} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fecha de Solicitud:</Text>
              <Text style={styles.detailValue}>
                {new Date(checkData.requestedAt).toLocaleDateString('es-CR')}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Viajes Completados:</Text>
              <Text style={styles.detailValue}>{checkData.tripsCompletedAtRequest}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estado:</Text>
              <Text style={[styles.detailValue, { color: statusInfo.color }]}>
                {checkData.status.toUpperCase()}
              </Text>
            </View>

            {checkData.completedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha de Completado:</Text>
                <Text style={styles.detailValue}>
                  {new Date(checkData.completedAt).toLocaleDateString('es-CR')}
                </Text>
              </View>
            )}

            {checkData.results?.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notas:</Text>
                <Text style={styles.notesText}>{checkData.results.notes}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>¿Necesitas Ayuda?</Text>
          <Text style={styles.helpText}>
            Si tienes preguntas sobre el proceso de verificación, contacta con nuestro equipo de soporte.
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>Contactar Soporte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  statusCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusIcon: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  uploadCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: '#666',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  uploadNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  helpCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
    marginBottom: 16,
  },
  helpButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
