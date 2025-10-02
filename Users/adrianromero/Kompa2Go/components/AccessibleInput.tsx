import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps,
  TouchableOpacity
} from 'react-native';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Volume2 } from 'lucide-react-native';

export interface AccessibleInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export function AccessibleInput({
  label,
  error,
  required = false,
  value,
  onChangeText,
  ...props
}: AccessibleInputProps) {
  const { settings, speak } = useAccessibility();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    if (settings.ttsEnabled && settings.voiceNavigation) {
      const message = `${label}${required ? ', campo requerido' : ''}`;
      speak(message);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (error && settings.ttsEnabled) {
      speak(`Error: ${error}`);
    }
  };

  const speakLabel = () => {
    const message = `${label}${required ? ', campo requerido' : ''}${value ? `, valor actual: ${value}` : ''}`;
    speak(message);
  };

  const inputStyle = [
    styles.input,
    settings.largeText && styles.largeText,
    settings.highContrast && styles.highContrastInput,
    isFocused && styles.inputFocused,
    error && styles.inputError,
  ];

  const labelStyle = [
    styles.label,
    settings.largeText && styles.largeLabelText,
    settings.highContrast && styles.highContrastText,
  ];

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={labelStyle}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {settings.ttsEnabled && (
          <TouchableOpacity onPress={speakLabel} style={styles.speakButton}>
            <Volume2 size={20} color={settings.highContrast ? '#000' : '#666'} />
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        {...props}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={inputStyle}
        accessibilityLabel={label}
        accessibilityHint={error}
      />
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  largeLabelText: {
    fontSize: 18,
  },
  highContrastText: {
    color: '#000',
    fontWeight: '700',
  },
  required: {
    color: '#FF3B30',
  },
  speakButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFF',
    minHeight: 48,
  },
  largeText: {
    fontSize: 20,
    minHeight: 56,
  },
  highContrastInput: {
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#FFF',
  },
  inputFocused: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
});
