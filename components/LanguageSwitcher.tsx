import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Globe } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';

type Language = 'es' | 'en' | 'pt';

interface LanguageOption {
  code: Language;
  flag: string;
  name: string;
}

const languages: LanguageOption[] = [
  { code: 'es', flag: '🇨🇷', name: 'spanish' },
  { code: 'en', flag: '🇺🇸', name: 'english' },
  { code: 'pt', flag: '🇧🇷', name: 'portuguese' },
];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setModalVisible(false);
  };

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <>
      <TouchableOpacity
        style={styles.languageButton}
        onPress={() => setModalVisible(true)}
        testID="language-switcher-button"
      >
        <Globe size={20} color="#D81B60" />
        <Text style={styles.languageText}>
          {currentLanguage?.flag} {t(currentLanguage?.name || 'spanish')}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('language')}</Text>
            
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.selectedLanguage
                ]}
                onPress={() => handleLanguageChange(lang.code)}
                testID={`language-option-${lang.code}`}
              >
                <Text style={styles.flagText}>{lang.flag}</Text>
                <Text style={[
                  styles.languageOptionText,
                  language === lang.code && styles.selectedLanguageText
                ]}>
                  {t(lang.name)}
                </Text>
                {language === lang.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D81B60',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  languageText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#D81B60',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  selectedLanguage: {
    backgroundColor: '#F8E7F0',
  },
  flagText: {
    fontSize: 24,
    marginRight: 15,
  },
  languageOptionText: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  selectedLanguageText: {
    fontWeight: 'bold' as const,
    color: '#D81B60',
  },
  checkmark: {
    fontSize: 18,
    color: '#D81B60',
    fontWeight: 'bold' as const,
  },
  closeButton: {
    backgroundColor: '#D81B60',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
});