import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CheckSquare, Square } from 'lucide-react-native';
import { AccessibleText } from './AccessibleText';
import { AccessibleButton } from './AccessibleButton';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface TermsAcceptanceProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function TermsAcceptance({ onAccept, onDecline }: TermsAcceptanceProps) {
  const router = useRouter();
  const { settings, speak } = useAccessibility();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const handleTermsPress = () => {
    router.push('/terms-of-service');
  };

  const handlePrivacyPress = () => {
    router.push('/privacy-policy');
  };

  const handleAccept = () => {
    if (termsAccepted && privacyAccepted) {
      if (settings.ttsEnabled) {
        speak('Términos aceptados. Continuando con el registro.');
      }
      onAccept();
    }
  };

  const toggleTerms = () => {
    const newValue = !termsAccepted;
    setTermsAccepted(newValue);
    if (settings.ttsEnabled) {
      speak(newValue ? 'Términos de uso aceptados' : 'Términos de uso no aceptados');
    }
  };

  const togglePrivacy = () => {
    const newValue = !privacyAccepted;
    setPrivacyAccepted(newValue);
    if (settings.ttsEnabled) {
      speak(newValue ? 'Política de privacidad aceptada' : 'Política de privacidad no aceptada');
    }
  };

  const canContinue = termsAccepted && privacyAccepted;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AccessibleText text="Bienvenido a Kompa2Go" style={styles.title} />
        <AccessibleText 
          text="Antes de continuar, por favor lee y acepta nuestros términos y condiciones" 
          style={styles.subtitle} 
        />
      </View>

      <View style={styles.section}>
        <AccessibleText text="Documentos Legales" style={styles.sectionTitle} />
        
        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={toggleTerms}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termsAccepted }}
        >
          {termsAccepted ? (
            <CheckSquare size={24} color="#007AFF" />
          ) : (
            <Square size={24} color="#666" />
          )}
          <View style={styles.checkboxTextContainer}>
            <Text style={styles.checkboxText}>
              He leído y acepto los{' '}
              <Text 
                style={styles.link}
                onPress={handleTermsPress}
              >
                Términos y Condiciones de Uso
              </Text>
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={togglePrivacy}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: privacyAccepted }}
        >
          {privacyAccepted ? (
            <CheckSquare size={24} color="#007AFF" />
          ) : (
            <Square size={24} color="#666" />
          )}
          <View style={styles.checkboxTextContainer}>
            <Text style={styles.checkboxText}>
              He leído y acepto la{' '}
              <Text 
                style={styles.link}
                onPress={handlePrivacyPress}
              >
                Política de Privacidad
              </Text>
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <AccessibleText text="Información Importante" style={styles.infoTitle} />
        <Text style={styles.infoText}>
          • Tus datos personales serán protegidos según la Ley N° 8968 de Costa Rica
        </Text>
        <Text style={styles.infoText}>
          • Puedes ejercer tus derechos de acceso, rectificación y eliminación en cualquier momento
        </Text>
        <Text style={styles.infoText}>
          • Al aceptar, autorizas el procesamiento de tus datos para la prestación del servicio
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <AccessibleButton
          label="Rechazar"
          text="Rechazar"
          onPress={onDecline}
          style={[styles.button, styles.declineButton]}
        />
        <AccessibleButton
          label="Aceptar y Continuar"
          text="Aceptar y Continuar"
          onPress={handleAccept}
          disabled={!canContinue}
          style={[
            styles.button, 
            styles.acceptButton,
            !canContinue && styles.disabledButton
          ]}
        />
      </View>

      {!canContinue && (
        <Text style={styles.warningText}>
          Debes aceptar ambos documentos para continuar
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingVertical: 8,
  },
  checkboxTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  link: {
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
  },
  declineButton: {
    backgroundColor: '#6C757D',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  warningText: {
    fontSize: 14,
    color: '#DC3545',
    textAlign: 'center',
    fontWeight: '600',
  },
});
