import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Star, Zap, Crown, TrendingUp } from 'lucide-react-native';
import FloatingKompi from '@/components/FloatingKompi';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Achievement {
  id: string;
  title: string;
  level: 'plus' | 'gold' | 'platinum' | 'ultra';
  icon: any;
  color: string;
  gradientColors: [string, string];
  requirements: {
    ratings: string;
    loyaltyCards?: string;
    certification?: string;
  };
  benefits: string[];
}

const achievements: Achievement[] = [
  {
    id: 'k2g_plus',
    title: 'K2G-Plus',
    level: 'plus',
    icon: Award,
    color: '#9C27B0',
    gradientColors: ['#9C27B0', '#E1BEE7'],
    requirements: {
      ratings: '500+ calificaciones positivas (promedio 4.8 estrellas)'
    },
    benefits: [
      'Capacidad para crear y gestionar Tarjetas de Lealtad de clientes'
    ]
  },
  {
    id: 'k2g_gold',
    title: 'K2G-Gold',
    level: 'gold',
    icon: Star,
    color: '#FFD700',
    gradientColors: ['#FFD700', '#FFF8DC'],
    requirements: {
      ratings: '600+ calificaciones positivas (promedio 4.8 estrellas)',
      loyaltyCards: 'Al menos 1 Tarjeta de Lealtad activa y completada'
    },
    benefits: [
      'Todos los beneficios de K2G-Plus',
      'Capacidad para crear Promociones hasta por 7 días',
      'Acceso a un Agente de IA simple para tu negocio'
    ]
  },
  {
    id: 'k2g_platinum',
    title: 'K2G-Platinum',
    level: 'platinum',
    icon: TrendingUp,
    color: '#E5E4E2',
    gradientColors: ['#E5E4E2', '#F8F8FF'],
    requirements: {
      ratings: '800+ calificaciones positivas (promedio 4.8 estrellas)',
      loyaltyCards: '5 Tarjetas de Lealtad activas y completadas'
    },
    benefits: [
      'Todos los beneficios de K2G-Gold',
      'Promociones hasta por 15 días, con carga de imágenes',
      'Comisión Compartida: Recibes una parte de la tarifa de reserva (100 CRC)',
      'Tamaño de galería de perfil aumentado a 20 imágenes',
      'Acceso a un Agente de IA de nivel medio'
    ]
  },
  {
    id: 'k2g_ultra',
    title: 'K2G-Ultra',
    level: 'ultra',
    icon: Crown,
    color: '#FF6B35',
    gradientColors: ['#FF6B35', '#FFE5DB'],
    requirements: {
      ratings: '1000+ calificaciones positivas (promedio 4.8 estrellas)',
      loyaltyCards: '20 Tarjetas de Lealtad activas y completadas',
      certification: 'Debe tener la certificación "Sakura Contigo" O mantener una calificación perfecta de 5 estrellas durante 3 meses consecutivos'
    },
    benefits: [
      'Todos los beneficios de K2G-Platinum',
      'Duración ilimitada para promociones, con ubicación destacada',
      'Comisión Compartida mejorada (Recibes 150 CRC)',
      'Acceso a un Agente de IA robusto y completo'
    ]
  }
];

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'plus': return '🥉';
      case 'gold': return '🥇';
      case 'platinum': return '🥈';
      case 'ultra': return '👑';
      default: return '🏆';
    }
  };

  const renderAchievementCard = (achievement: Achievement) => {
    const IconComponent = achievement.icon;
    
    return (
      <View key={achievement.id} style={styles.achievementCard}>
        <LinearGradient
          colors={achievement.gradientColors}
          style={styles.achievementHeader}
        >
          <View style={styles.achievementTitleContainer}>
            <View style={[styles.achievementIconContainer, { backgroundColor: achievement.color + '20' }]}>
              <IconComponent size={32} color={achievement.color} />
            </View>
            <View style={styles.achievementTitleInfo}>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <Text style={styles.achievementBadge}>{getLevelBadge(achievement.level)} Logro {achievement.level.charAt(0).toUpperCase() + achievement.level.slice(1)}</Text>
            </View>
          </View>
        </LinearGradient>
        
        <View style={styles.achievementContent}>
          <View style={styles.requirementsSection}>
            <Text style={styles.sectionTitle}>📋 Requisitos:</Text>
            <Text style={styles.requirementText}>• {achievement.requirements.ratings}</Text>
            {achievement.requirements.loyaltyCards && (
              <Text style={styles.requirementText}>• {achievement.requirements.loyaltyCards}</Text>
            )}
            {achievement.requirements.certification && (
              <Text style={styles.requirementText}>• {achievement.requirements.certification}</Text>
            )}
          </View>
          
          <View style={styles.benefitsSection}>
            <Text style={styles.sectionTitle}>🎁 Beneficios Desbloqueados:</Text>
            {achievement.benefits.map((benefit, benefitIndex) => (
              <Text key={`benefit-${achievement.id}-${benefitIndex}`} style={styles.benefitText}>• {benefit}</Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{
          title: 'Sistema de Logros',
          headerStyle: {
            backgroundColor: '#D81B60',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={['#D81B60', '#E91E63', '#F06292']}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Tu Camino al Éxito</Text>
            <Text style={styles.heroSubtitle}>Programa de Logros Kompa2Go</Text>
            <View style={styles.heroIconContainer}>
              <Award size={48} color="white" />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>🌟 ¿Qué son los Logros?</Text>
            <Text style={styles.introText}>
              El sistema de Logros de Kompa2Go está diseñado para recompensar la excelencia, 
              construir la confianza del cliente y mejorar tu visibilidad en las búsquedas. 
              Cada logro que alcances desbloquea nuevas funciones y beneficios que te ayudarán 
              a hacer crecer tu negocio.
            </Text>
          </View>

          <View style={styles.pathSection}>
            <Text style={styles.pathTitle}>🚀 Tu Ruta de Progreso</Text>
            <Text style={styles.pathDescription}>
              Avanza a través de cuatro niveles de logros, cada uno con beneficios únicos:
            </Text>
          </View>

          <View style={styles.achievementsContainer}>
            {achievements.map(renderAchievementCard)}
          </View>

          <View style={styles.motivationSection}>
            <LinearGradient
              colors={['#4CAF50', '#66BB6A']}
              style={styles.motivationCard}
            >
              <View style={styles.motivationContent}>
                <Zap size={32} color="white" />
                <Text style={styles.motivationTitle}>¡Comienza Tu Viaje Hoy!</Text>
                <Text style={styles.motivationText}>
                  Cada servicio excelente que brindes te acerca más a desbloquear 
                  increíbles beneficios. ¡Tu éxito es nuestro éxito!
                </Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Consejos para Alcanzar Logros</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>⭐ Mantén siempre un servicio de alta calidad</Text>
              <Text style={styles.tipItem}>📱 Responde rápidamente a los mensajes de clientes</Text>
              <Text style={styles.tipItem}>⏰ Sé puntual en todas tus citas</Text>
              <Text style={styles.tipItem}>🎯 Completa las Tarjetas de Lealtad para avanzar más rápido</Text>
              <Text style={styles.tipItem}>📸 Mantén tu perfil actualizado con fotos de tu trabajo</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <FloatingKompi isVisible={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  heroIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    padding: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  introSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  pathSection: {
    marginBottom: 24,
  },
  pathTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pathDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  achievementsContainer: {
    marginBottom: 24,
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  achievementHeader: {
    padding: 20,
  },
  achievementTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementTitleInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  achievementBadge: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  achievementContent: {
    padding: 20,
  },
  requirementsSection: {
    marginBottom: 20,
  },
  benefitsSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 15,
    color: '#E65100',
    marginBottom: 8,
    lineHeight: 22,
    paddingLeft: 8,
  },
  benefitText: {
    fontSize: 15,
    color: '#2E7D32',
    marginBottom: 8,
    lineHeight: 22,
    paddingLeft: 8,
  },
  motivationSection: {
    marginBottom: 24,
  },
  motivationCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  motivationContent: {
    alignItems: 'center',
  },
  motivationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  motivationText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  tipsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    paddingLeft: 8,
  },
});