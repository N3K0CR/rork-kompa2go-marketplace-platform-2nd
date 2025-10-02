import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

export interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => Promise<void>;
  speak: (text: string, options?: SpeakOptions) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  language?: string;
}

const defaultSettings: AccessibilitySettings = {
  hasDisability: false,
  ttsEnabled: false,
  ttsSpeed: 'normal',
  highContrast: false,
  largeText: false,
  voiceNavigation: false,
  autoReadMessages: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEY = '@accessibility_settings';

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<AccessibilitySettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  }, [settings]);

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    if (!settings.ttsEnabled && !options) return;
    if (Platform.OS === 'web') {
      console.log('TTS not fully supported on web:', text);
      return;
    }

    const speedMap = {
      slow: 0.75,
      normal: 1.0,
      fast: 1.25,
    };

    const rate = options?.rate ?? speedMap[settings.ttsSpeed];
    const pitch = options?.pitch ?? 1.0;
    const language = options?.language ?? 'es-ES';

    setIsSpeaking(true);
    Speech.speak(text, {
      rate,
      pitch,
      language,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [settings]);

  const stopSpeaking = useCallback(() => {
    if (Platform.OS !== 'web') {
      Speech.stop();
    }
    setIsSpeaking(false);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      speak,
      stopSpeaking,
      isSpeaking,
    }),
    [settings, isSpeaking, speak, stopSpeaking, updateSettings]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
