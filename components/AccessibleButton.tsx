import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import type { AccessibleButtonProps } from '@/src/shared/types/accessibility-types';

export function AccessibleButton({
  text,
  label,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  ttsEnabled = true,
  disabled = false,
  style,
  children,
}: AccessibleButtonProps & { text?: string }) {
  const { speakText, preferences } = useAccessibility();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const buttonLabel = text || label;

  const handlePress = async () => {
    if (disabled || isProcessing) return;

    if (Platform.OS !== 'web' && preferences.hapticFeedback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (ttsEnabled && preferences.ttsEnabled) {
      await speakText(buttonLabel);
    }

    setIsProcessing(true);
    try {
      await onPress();
    } finally {
      setIsProcessing(false);
    }
  };

  const buttonStyle = [
    styles.button,
    preferences.largeText && styles.largeButton,
    preferences.highContrast && styles.highContrastButton,
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    preferences.largeText && styles.largeText,
    preferences.highContrast && styles.highContrastText,
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || isProcessing}
      accessible={true}
      accessibilityLabel={accessibilityLabel || buttonLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isProcessing }}
    >
      {isProcessing ? (
        <ActivityIndicator color={preferences.highContrast ? '#000' : '#fff'} />
      ) : (
        children || <Text style={textStyle}>{buttonLabel}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
  },
  highContrastButton: {
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#fff',
  },
  disabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  largeText: {
    fontSize: 20,
  },
  highContrastText: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  disabledText: {
    color: '#999',
  },
});
