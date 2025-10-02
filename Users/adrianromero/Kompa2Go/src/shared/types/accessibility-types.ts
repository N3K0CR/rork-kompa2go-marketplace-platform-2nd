import React from "react";

export interface AccessibilitySettings {
  hasDisability: boolean;
  disabilityType?: 'visual' | 'reading' | 'hearing' | 'motor' | 'other';
  ttsEnabled: boolean;
  ttsSpeed: 'slow' | 'normal' | 'fast';
  highContrast: boolean;
  largeText: boolean;
  voiceNavigation: boolean;
  autoReadMessages: boolean;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  language?: string;
}

export interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => Promise<void>;
  speak: (text: string, options?: SpeakOptions) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

export interface TTSOptions {
  text: string;
  language?: string;
  pitch?: number;
  rate?: number;
  voice?: string;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export interface AccessibleTextProps {
  text: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  onPress?: () => void;
  ttsEnabled?: boolean;
  style?: any;
}

export interface AccessibleButtonProps {
  label: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  onPress: () => void;
  ttsEnabled?: boolean;
  disabled?: boolean;
  style?: any;
  children?: React.ReactNode;
}

export interface AccessibleInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  ttsEnabled?: boolean;
  style?: any;
}

export interface ChatMessageTTSProps {
  message: string;
  autoPlay?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
}

export interface ScreenReaderAnnouncement {
  message: string;
  priority?: 'low' | 'normal' | 'high';
  delay?: number;
}
