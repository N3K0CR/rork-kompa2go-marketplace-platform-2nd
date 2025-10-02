import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import type { AccessibleInputProps } from '@/src/shared/types/accessibility-types';

export function AccessibleInput({
  label,
  value,
  onChangeText,
  accessibilityLabel,
  accessibilityHint,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize,
  required,
  error,
  ttsEnabled = true,
  style,
}: AccessibleInputProps & { 
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  required?: boolean;
  error?: string;
}) {
  const { speakText, preferences } = useAccessibility();
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const handleLabelPress = async () => {
    if (ttsEnabled && preferences.ttsEnabled) {
      await speakText(label);
    }
  };

  const handleFocus = async () => {
    setIsFocused(true);
    if (ttsEnabled && preferences.ttsEnabled) {
      await speakText(`Campo de ${label}`);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const containerStyle = [
    styles.container,
    isFocused && styles.focused,
    preferences.highContrast && styles.highContrastContainer,
    style,
  ];

  const labelStyle = [
    styles.label,
    preferences.largeText && styles.largeLabel,
    preferences.highContrast && styles.highContrastLabel,
  ];

  const inputStyle = [
    styles.input,
    preferences.largeText && styles.largeInput,
    preferences.highContrast && styles.highContrastInput,
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.labelContainer}>
        <Text
          style={labelStyle}
          accessible={true}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityRole="text"
        >
          {label}
        </Text>
        {ttsEnabled && preferences.ttsEnabled && (
          <TouchableOpacity
            onPress={handleLabelPress}
            accessible={true}
            accessibilityLabel={`Escuchar ${label}`}
            accessibilityRole="button"
            style={styles.speakerButton}
          >
            <Volume2 size={20} color={preferences.highContrast ? '#000' : '#666'} />
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={inputStyle}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={preferences.highContrast ? '#666' : '#999'}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={handleFocus}
        onBlur={handleBlur}
        accessible={true}
        accessibilityLabel={accessibilityLabel || `Campo de ${label}`}
        accessibilityHint={accessibilityHint || placeholder}
        accessibilityValue={{ text: value }}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  focused: {
    borderColor: '#007AFF',
  },
  highContrastContainer: {
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    padding: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    flex: 1,
  },
  largeLabel: {
    fontSize: 20,
  },
  highContrastLabel: {
    color: '#000',
    fontWeight: '700' as const,
  },
  speakerButton: {
    padding: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    minHeight: 48,
  },
  largeInput: {
    fontSize: 20,
    paddingVertical: 16,
    minHeight: 56,
  },
  highContrastInput: {
    borderWidth: 2,
    borderColor: '#000',
    color: '#000',
    fontWeight: '600' as const,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 4,
  },
});
