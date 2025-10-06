import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Shield, Check, ChevronRight, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  securityVerificationService,
  PREDEFINED_PRIMARY_QUESTIONS,
  PREDEFINED_SECONDARY_QUESTIONS
} from '@/src/modules/alerts/services/security-verification-service';
import type { SecurityQuestion } from '@/src/shared/types/alert-types';

export default function SecurityQuestionsSetup() {
  const insets = useSafeAreaInsets();
  const [kommuterId, setKommuterId] = useState('');
  const [selectedPrimaryQuestion, setSelectedPrimaryQuestion] = useState<typeof PREDEFINED_PRIMARY_QUESTIONS[0] | null>(null);
  const [primaryAnswer, setPrimaryAnswer] = useState('');
  const [selectedSecondaryQuestion, setSelectedSecondaryQuestion] = useState<typeof PREDEFINED_SECONDARY_QUESTIONS[0] | null>(null);
  const [secondaryAnswer, setSecondaryAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!kommuterId.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu ID de Kommuter');
      return;
    }

    if (!selectedPrimaryQuestion || !primaryAnswer.trim()) {
      Alert.alert('Error', 'Por favor selecciona y responde la primera pregunta de seguridad');
      return;
    }

    if (!selectedSecondaryQuestion || !secondaryAnswer.trim()) {
      Alert.alert('Error', 'Por favor selecciona y responde la segunda pregunta de seguridad');
      return;
    }

    try {
      setSaving(true);

      const primaryQ: Omit<SecurityQuestion, 'id'> = {
        question: selectedPrimaryQuestion.question,
        answer: primaryAnswer.trim(),
        category: 'primary',
        isCostaRicanContext: false
      };

      const secondaryQ: Omit<SecurityQuestion, 'id'> = {
        question: selectedSecondaryQuestion.question,
        answer: secondaryAnswer.trim(),
        category: 'secondary',
        isCostaRicanContext: selectedSecondaryQuestion.isCostaRicanContext
      };

      await securityVerificationService.saveKommuterSecuritySettings(
        kommuterId.trim(),
        primaryQ,
        secondaryQ
      );

      Alert.alert(
        '✅ Configuración Guardada',
        'Tus preguntas de seguridad han sido configuradas exitosamente.\n\nEstas preguntas se usarán para verificar alertas de emergencia.',
        [
          {
            text: 'Entendido',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving security questions:', error);
      Alert.alert('Error', 'No se pudieron guardar las preguntas de seguridad');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Preguntas de Seguridad',
          headerStyle: { backgroundColor: '#65ea06' },
          headerTintColor: '#131c0d',
          headerTitleStyle: { fontWeight: '700' as const },
        }} 
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Shield size={48} color="#65ea06" />
          </View>
          <Text style={styles.title}>Configuración de Seguridad</Text>
          <Text style={styles.subtitle}>
            Configura tus preguntas de seguridad para verificar alertas de emergencia.
            Estas preguntas serán usadas para confirmar situaciones de peligro.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ID de Kommuter</Text>
          <TextInput
            style={styles.input}
            value={kommuterId}
            onChangeText={setKommuterId}
            placeholder="Ej: 2KPAB123"
            placeholderTextColor="#999"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color="#FF3B30" />
            <Text style={styles.sectionTitle}>Primera Pregunta (Código Encriptado)</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Pregunta poco común que solo tú conoces. Si respondes "Sí", se activará el seguimiento en tiempo real.
          </Text>

          <View style={styles.questionsGrid}>
            {PREDEFINED_PRIMARY_QUESTIONS.map((q, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.questionCard,
                  selectedPrimaryQuestion?.question === q.question && styles.questionCardSelected
                ]}
                onPress={() => setSelectedPrimaryQuestion(q)}
              >
                <Text style={[
                  styles.questionText,
                  selectedPrimaryQuestion?.question === q.question && styles.questionTextSelected
                ]}>
                  {q.question}
                </Text>
                {selectedPrimaryQuestion?.question === q.question && (
                  <Check size={20} color="#65ea06" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedPrimaryQuestion && (
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Tu respuesta (Sí/No):</Text>
              <TextInput
                style={styles.input}
                value={primaryAnswer}
                onChangeText={setPrimaryAnswer}
                placeholder="Escribe Sí o No"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
              <Text style={styles.answerHint}>
                💡 Recuerda tu respuesta. Esta será la clave para activar el seguimiento.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color="#FF9500" />
            <Text style={styles.sectionTitle}>Segunda Pregunta (Contexto Costarricense)</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Pregunta familiar del ambiente costarricense. Si respondes "Sí", se llamará al 911.
          </Text>

          <View style={styles.questionsGrid}>
            {PREDEFINED_SECONDARY_QUESTIONS.map((q, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.questionCard,
                  selectedSecondaryQuestion?.question === q.question && styles.questionCardSelected
                ]}
                onPress={() => setSelectedSecondaryQuestion(q)}
              >
                <Text style={[
                  styles.questionText,
                  selectedSecondaryQuestion?.question === q.question && styles.questionTextSelected
                ]}>
                  {q.question}
                </Text>
                {selectedSecondaryQuestion?.question === q.question && (
                  <Check size={20} color="#65ea06" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedSecondaryQuestion && (
            <View style={styles.answerSection}>
              <Text style={styles.answerLabel}>Tu respuesta (Sí/No):</Text>
              <TextInput
                style={styles.input}
                value={secondaryAnswer}
                onChangeText={setSecondaryAnswer}
                placeholder="Escribe Sí o No"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
              <Text style={styles.answerHint}>
                💡 Esta respuesta activará el protocolo de emergencia 911.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Importante</Text>
          <Text style={styles.warningText}>
            • Memoriza tus respuestas{'\n'}
            • No compartas estas preguntas con nadie{'\n'}
            • Las respuestas son sensibles a mayúsculas/minúsculas{'\n'}
            • Estas preguntas se usarán en situaciones de emergencia
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Shield size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Text>
          <ChevronRight size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafcf8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 24,
  },
  headerSection: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f8fff4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#131c0d',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b9e47',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b9e47',
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#131c0d',
    borderWidth: 1,
    borderColor: '#d4e8cc',
  },
  questionsGrid: {
    gap: 12,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#d4e8cc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionCardSelected: {
    borderColor: '#65ea06',
    backgroundColor: '#f8fff4',
  },
  questionText: {
    fontSize: 15,
    color: '#131c0d',
    flex: 1,
  },
  questionTextSelected: {
    fontWeight: '600' as const,
    color: '#65ea06',
  },
  answerSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#d4e8cc',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b9e47',
  },
  answerHint: {
    fontSize: 13,
    color: '#FF9500',
    fontStyle: 'italic',
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#131c0d',
    lineHeight: 22,
  },
  saveButton: {
    backgroundColor: '#65ea06',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
