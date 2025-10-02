import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Speech from 'expo-speech';
import { Platform, AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  AccessibilityPreferences, 
  TTSSpeed
} from '@/src/shared/types/registration-types';
import type { TTSOptions, ScreenReaderAnnouncement } from '@/src/shared/types/accessibility-types';

interface AccessibilityContextType {
  preferences: AccessibilityPreferences;
  updatePreferences: (updates: Partial<AccessibilityPreferences>) => Promise<void>;
  settings: AccessibilityPreferences;
  updateSettings: (updates: Partial<AccessibilityPreferences>) => Promise<void>;
  
  speak: (options: TTSOptions | string) => Promise<void>;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  
  announceForScreenReader: (announcement: ScreenReaderAnnouncement | string) => void;
  
  isScreenReaderEnabled: boolean;
  
  speakText: (text: string) => Promise<void>;
  speakChatMessage: (message: string) => Promise<void>;
}

const defaultPreferences: AccessibilityPreferences = {
  hasAccessibilityNeeds: false,
  needs: [],
  
  ttsEnabled: false,
  ttsAutoPlay: false,
  ttsSpeed: 'normal',
  
  chatTTSEnabled: false,
  chatAutoPlay: false,
  chatOnlyNoCall: false,
  
  descriptionLevel: 'intermediate',
  navigationMode: 'visual',
  
  highContrast: false,
  largeText: false,
  hapticFeedback: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEY = '@kompa2go:accessibility_preferences';

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultPreferences);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState<boolean>(false);

  useEffect(() => {
    loadPreferences();
    checkScreenReaderStatus();
    
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    return () => {
      subscription.remove();
      Speech.stop();
    };
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
        console.log('[AccessibilityContext] Preferences loaded');
      }
    } catch (error) {
      console.error('[AccessibilityContext] Error loading preferences:', error);
    }
  };

  const checkScreenReaderStatus = async () => {
    try {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(enabled);
      console.log('[AccessibilityContext] Screen reader enabled:', enabled);
    } catch (error) {
      console.error('[AccessibilityContext] Error checking screen reader:', error);
    }
  };

  const updatePreferences = useCallback(async (updates: Partial<AccessibilityPreferences>) => {
    try {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      console.log('[AccessibilityContext] Preferences updated');
    } catch (error) {
      console.error('[AccessibilityContext] Error updating preferences:', error);
      throw error;
    }
  }, [preferences]);

  const getTTSRate = useCallback((speed: TTSSpeed): number => {
    switch (speed) {
      case 'slow': return 0.7;
      case 'fast': return 1.3;
      default: return 1.0;
    }
  }, []);

  const speak = useCallback(async (options: TTSOptions | string) => {
    if (!preferences.ttsEnabled && !isScreenReaderEnabled) {
      return;
    }

    try {
      const opts: TTSOptions = typeof options === 'string' 
        ? { text: options } 
        : options;

      if (Platform.OS === 'web') {
        console.log('[AccessibilityContext] TTS not fully supported on web, logging:', opts.text);
        return;
      }

      await Speech.stop();
      
      setIsSpeaking(true);
      opts.onStart?.();

      await Speech.speak(opts.text, {
        language: opts.language || 'es-ES',
        pitch: opts.pitch || 1.0,
        rate: opts.rate || getTTSRate(preferences.ttsSpeed),
        voice: opts.voice,
        onDone: () => {
          setIsSpeaking(false);
          opts.onDone?.();
        },
        onError: (error) => {
          console.error('[AccessibilityContext] TTS error:', error);
          setIsSpeaking(false);
          opts.onError?.(new Error('Error al reproducir audio'));
        },
      });
    } catch (error) {
      console.error('[AccessibilityContext] Speak error:', error);
      setIsSpeaking(false);
      throw error;
    }
  }, [preferences.ttsEnabled, preferences.ttsSpeed, isScreenReaderEnabled, getTTSRate]);

  const stopSpeaking = useCallback(() => {
    if (Platform.OS !== 'web') {
      Speech.stop();
    }
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (preferences.ttsEnabled || isScreenReaderEnabled) {
      await speak(text);
    }
  }, [preferences.ttsEnabled, isScreenReaderEnabled, speak]);

  const speakChatMessage = useCallback(async (message: string) => {
    if (preferences.chatTTSEnabled || isScreenReaderEnabled) {
      await speak({
        text: message,
        pitch: 1.1,
        rate: getTTSRate(preferences.ttsSpeed),
      });
    }
  }, [preferences.chatTTSEnabled, preferences.ttsSpeed, isScreenReaderEnabled, speak, getTTSRate]);

  const announceForScreenReader = useCallback((announcement: ScreenReaderAnnouncement | string) => {
    const message = typeof announcement === 'string' 
      ? announcement 
      : announcement.message;

    if (Platform.OS !== 'web') {
      AccessibilityInfo.announceForAccessibility(message);
    }
    
    console.log('[AccessibilityContext] Screen reader announcement:', message);
  }, []);

  const value: AccessibilityContextType = {
    preferences,
    updatePreferences,
    settings: preferences,
    updateSettings: updatePreferences,
    speak,
    stopSpeaking,
    isSpeaking,
    announceForScreenReader,
    isScreenReaderEnabled,
    speakText,
    speakChatMessage,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

export default AccessibilityContext;
