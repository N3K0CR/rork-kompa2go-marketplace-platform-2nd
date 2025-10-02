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
