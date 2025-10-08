import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import * as Haptics from 'expo-haptics';

export interface AccessibleButtonProps {
  onPress: () => void;
  text: string;
  label?: string;
  style?: any;
  textStyle?: any;
  disabled?: boolean;
  hapticFeedback?: boolean;
}

export function AccessibleButton({
  onPress,
  text,
  label,
  style,
  textStyle,
  disabled = false,
  hapticFeedback = true,
}: AccessibleButtonProps) {
  const { settings, speak } = useAccessibility();

  const handlePress = () => {
    if (disabled) return;

    if (hapticFeedback && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (settings.ttsEnabled) {
      speak(text);
    }

    onPress();
  };

  const buttonStyle = [
    styles.button,
    style,
    settings.highContrast && styles.highContrastButton,
    disabled && styles.disabled,
  ];

  const buttonTextStyle = [
    styles.buttonText,
    textStyle,
    settings.largeText && styles.largeText,
    settings.highContrast && styles.highContrastText,
  ];

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={buttonStyle}
      disabled={disabled}
      accessibilityLabel={label || text}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={buttonTextStyle}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  largeText: {
    fontSize: 20,
  },
  highContrastButton: {
    backgroundColor: '#000000',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  highContrastText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
