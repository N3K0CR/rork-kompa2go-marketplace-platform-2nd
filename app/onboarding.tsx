import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Search, Calendar, Star, ArrowRight } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';



export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useLanguage();

  const onboardingStepsTranslated = [
    {
      icon: Search,
      title: t('search'),
      description: 'Encuentra el servicio que necesitas cerca de ti',
      color: '#D81B60',
    },
    {
      icon: Calendar,
      title: 'Reserva',
      description: 'Agenda tu cita de forma rápida y segura',
      color: '#E91E63',
    },
    {
      icon: Star,
      title: 'Disfruta',
      description: 'Recibe un servicio de calidad y califica tu experiencia',
      color: '#F06292',
    },
  ];

  const nextStep = () => {
    if (currentStep < onboardingStepsTranslated.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/auth');
    }
  };

  const skip = () => {
    router.replace('/auth');
  };

  const step = onboardingStepsTranslated[currentStep];
  const IconComponent = step.icon;

  return (
    <LinearGradient
      colors={['#D81B60', '#E91E63']}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.languageSwitcherContainer}>
          <LanguageSwitcher />
        </View>
        <TouchableOpacity onPress={skip} style={styles.skipButton}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Kompa2Go</Text>
          <Text style={styles.slogan}>{t('slogan')}</Text>
        </View>
        
        <View style={styles.iconContainer}>
          <IconComponent size={80} color="white" />
        </View>
        
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingStepsTranslated.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
          <Text style={styles.nextButtonText}>
            {currentStep === onboardingStepsTranslated.length - 1 ? 'Comenzar' : t('next')}
          </Text>
          <ArrowRight size={20} color="#D81B60" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  languageSwitcherContainer: {
    marginTop: 10,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  slogan: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: 'white',
    width: 24,
  },
  nextButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#D81B60',
    fontSize: 18,
    fontWeight: '600',
  },
});