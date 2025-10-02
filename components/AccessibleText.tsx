import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import type { AccessibleTextProps } from '@/src/shared/types/accessibility-types';

export function AccessibleText({
  text,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  ttsEnabled = true,
  style,
}: AccessibleTextProps) {
  const { speakText, preferences } = useAccessibility();

  const handleLongPress = async () => {
    if (ttsEnabled && preferences.ttsEnabled) {
      await speakText(text);
    }
  };

  const handlePress = () => {
    onPress?.();
  };

  const textStyle = [
    styles.text,
    preferences.largeText && styles.largeText,
    preferences.highContrast && styles.highContrast,
    style,
  ];

  if (onPress || (ttsEnabled && preferences.ttsEnabled)) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        accessible={true}
        accessibilityLabel={accessibilityLabel || text}
        accessibilityHint={accessibilityHint || (ttsEnabled ? 'Mantén presionado para escuchar' : undefined)}
        accessibilityRole="text"
      >
        <Text style={textStyle}>{text}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Text
      style={textStyle}
      accessible={true}
      accessibilityLabel={accessibilityLabel || text}
      accessibilityHint={accessibilityHint}
      accessibilityRole="text"
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#000',
  },
  largeText: {
    fontSize: 20,
  },
  highContrast: {
    color: '#000',
    fontWeight: '700' as const,
  },
});
