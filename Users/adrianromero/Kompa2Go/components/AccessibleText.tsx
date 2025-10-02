import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export interface AccessibleTextProps {
  text: string;
  speakOnPress?: boolean;
  style?: any;
}

export function AccessibleText({ 
  text, 
  speakOnPress = true, 
  style
}: AccessibleTextProps) {
  const { settings, speak } = useAccessibility();

  const textContent = text;

  const handlePress = () => {
    if (speakOnPress && settings.ttsEnabled && textContent) {
      speak(textContent);
    }
  };

  const textStyle = [
    style,
    settings.largeText && styles.largeText,
    settings.highContrast && styles.highContrast,
  ];

  if (speakOnPress && settings.ttsEnabled) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Text 
          style={textStyle}
          accessibilityLabel={textContent}
          accessibilityRole="text"
        >
          {text}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Text 
      style={textStyle}
      accessibilityLabel={textContent}
      accessibilityRole="text"
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  largeText: {
    fontSize: 20,
  },
  highContrast: {
    color: '#000000',
    fontWeight: '700',
  },
});
