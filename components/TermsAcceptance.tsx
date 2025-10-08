import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';
import { AccessibleText } from './AccessibleText';
import { AccessibleButton } from './AccessibleButton';

interface TermsAcceptanceProps {
  onAccept: () => void;
  onDecline?: () => void;
}

export function TermsAcceptance({ onAccept, onDecline }: TermsAcceptanceProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const handleOpenTerms = () => {
    Linking.openURL('/terms-of-service');
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('/privacy-policy');
  };

  const canProceed = termsAccepted && privacyAccepted;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
        <AccessibleText 
          text="Bienvenido a Kompa2Go" 
          style={styles.title} 
        />
        
        <AccessibleText 
          text="Antes de continuar con tu registro, es importante que leas y aceptes nuestros términos y condiciones y política de privacidad." 
          style={styles.description} 
        />

        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>
            📋 Por favor, lee cuidadosamente los siguientes documentos:
          </Text>
        </View>

        <View style={styles.documentSection}>
          <AccessibleText 
            text="Términos y Condiciones de Uso" 
            style={styles.sectionTitle} 
          />
          <Text style={styles.sectionDescription}>
            Estos términos establecen las reglas y condiciones para el uso de la plataforma Kompa2Go, 
            incluyendo derechos, obligaciones, tarifas, cancelaciones y responsabilidades.
          </Text>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={handleOpenTerms}
          >
            <Text style={styles.linkText}>📄 Leer Términos y Condiciones</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setTermsAccepted(!termsAccepted)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
          >
            {termsAccepted ? (
              <CheckSquare size={24} color="#007AFF" />
            ) : (
              <Square size={24} color="#666" />
            )}
            <Text style={styles.checkboxLabel}>
              He leído y acepto los Términos y Condiciones de Uso
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.documentSection}>
          <AccessibleText 
            text="Política de Privacidad" 
            style={styles.sectionTitle} 
          />
          <Text style={styles.sectionDescription}>
            Nuestra política de privacidad explica cómo recopilamos, usamos, almacenamos y protegemos 
            tu información personal de acuerdo con la Ley N° 8968 de Costa Rica.
          </Text>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={handleOpenPrivacy}
          >
            <Text style={styles.linkText}>🔒 Leer Política de Privacidad</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setPrivacyAccepted(!privacyAccepted)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: privacyAccepted }}
          >
            {privacyAccepted ? (
              <CheckSquare size={24} color="#007AFF" />
            ) : (
              <Square size={24} color="#666" />
            )}
            <Text style={styles.checkboxLabel}>
              He leído y acepto la Política de Privacidad
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.importantBox}>
          <Text style={styles.importantTitle}>⚠️ Importante</Text>
          <Text style={styles.importantText}>
            Al aceptar estos documentos, confirmas que:
          </Text>
          <Text style={styles.bulletPoint}>• Eres mayor de 18 años</Text>
          <Text style={styles.bulletPoint}>• Has leído y comprendido los términos</Text>
          <Text style={styles.bulletPoint}>• Aceptas el procesamiento de tus datos personales</Text>
          <Text style={styles.bulletPoint}>• Te comprometes a cumplir con las políticas de la plataforma</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        {onDecline && (
          <AccessibleButton
            text="Cancelar"
            label="Cancelar registro"
            onPress={onDecline}
            style={[styles.button, styles.declineButton]}
          />
        )}
        <AccessibleButton
          text="Continuar"
          label="Continuar con el registro"
          onPress={onAccept}
          disabled={!canProceed}
          style={[
            styles.button, 
            styles.acceptButton,
            !canProceed && styles.disabledButton
          ]}
        />
      </View>
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
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  highlightBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  highlightText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  documentSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  linkButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  linkText: {
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '600',
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  importantBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  importantTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C62828',
    marginBottom: 8,
  },
  importantText: {
    fontSize: 14,
    color: '#C62828',
    marginBottom: 8,
    fontWeight: '600',
  },
  bulletPoint: {
    fontSize: 14,
    color: '#C62828',
    lineHeight: 22,
    marginLeft: 8,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
});
