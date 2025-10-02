import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Share,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gift, Users, TrendingUp, Copy, Share2, CheckCircle } from 'lucide-react-native';
import { AccessibleText } from '@/components/AccessibleText';

import { useAccessibility } from '@/contexts/AccessibilityContext';
import { ReferralService } from '../backend/trpc/routes/referrals/referral-service';
import type { ReferralStats, ReferralData } from '@/src/shared/types';
import * as Clipboard from 'expo-clipboard';

export default function ReferralsScreen() {
  const insets = useSafeAreaInsets();

  const { settings, speak } = useAccessibility();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const userId = 'current-user-id';
      
      const code = await ReferralService.generateReferralCode(userId);
      setReferralCode(code);

      const referralStats = await ReferralService.getReferralStats(userId);
      setStats(referralStats);
    } catch (error) {
      console.error('Error loading referral data:', error);
      Alert.alert('Error', 'No se pudo cargar la información de referidos');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    
    if (settings.ttsEnabled) {
      speak('Código copiado al portapapeles');
    }

    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `¡Únete a Kompa2Go con mi código de referido ${referralCode} y gana ₡10,000 después de completar 25 viajes! Yo también ganaré ₡20,000 cuando completes 20 viajes. 🚗💰`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString('es-CR')}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Programa de Referidos', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Programa de Referidos', headerShown: true }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Gift size={48} color="#007AFF" />
          <AccessibleText text="Gana Dinero Refiriendo" style={styles.headerTitle} />
          <AccessibleText
            text="Invita a tus amigos y gana hasta ₡20,000 por cada referido"
            style={styles.headerSubtitle}
          />
        </View>

        <View style={styles.codeCard}>
          <AccessibleText text="Tu Código de Referido" style={styles.codeLabel} />
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <View style={styles.codeActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleCopyCode}
                accessibilityLabel="Copiar código"
              >
                {copied ? (
                  <CheckCircle size={24} color="#34C759" />
                ) : (
                  <Copy size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleShareCode}
                accessibilityLabel="Compartir código"
              >
                <Share2 size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.howItWorksCard}>
          <AccessibleText text="¿Cómo Funciona?" style={styles.sectionTitle} />
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Comparte tu código</Text>
              <Text style={styles.stepDescription}>
                Invita a tus amigos a registrarse con tu código de referido
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Ellos completan viajes</Text>
              <Text style={styles.stepDescription}>
                Tu referido debe completar 20 viajes para que ganes ₡20,000
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Ambos ganan</Text>
              <Text style={styles.stepDescription}>
                Tú ganas ₡20,000 y tu referido gana ₡10,000 al completar 25 viajes
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Users size={32} color="#007AFF" />
            <Text style={styles.statValue}>{stats?.totalReferrals || 0}</Text>
            <Text style={styles.statLabel}>Total Referidos</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={32} color="#34C759" />
            <Text style={styles.statValue}>{stats?.activeReferrals || 0}</Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>

          <View style={styles.statCard}>
            <Gift size={32} color="#FF9500" />
            <Text style={styles.statValue}>{formatCurrency(stats?.totalEarnings || 0)}</Text>
            <Text style={styles.statLabel}>Ganado</Text>
          </View>
        </View>

        {stats && stats.pendingEarnings > 0 && (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingTitle}>Ganancias Pendientes</Text>
            <Text style={styles.pendingAmount}>{formatCurrency(stats.pendingEarnings)}</Text>
            <Text style={styles.pendingDescription}>
              Se liberarán cuando tus referidos completen los viajes requeridos
            </Text>
          </View>
        )}

        {stats && stats.referrals.length > 0 && (
          <View style={styles.referralsList}>
            <AccessibleText text="Mis Referidos" style={styles.sectionTitle} />
            {stats.referrals.map((referral: ReferralData) => (
              <View key={referral.id} style={styles.referralItem}>
                <View style={styles.referralInfo}>
                  <Text style={styles.referralId}>
                    Referido #{referral.id.substring(0, 8)}
                  </Text>
                  <Text style={styles.referralStatus}>
                    {referral.referredTripsCompleted} viajes completados
                  </Text>
                </View>
                <View style={styles.referralBadge}>
                  <Text style={styles.referralBadgeText}>
                    {referral.status === 'completed' ? 'Completado' : 'En progreso'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.termsCard}>
          <Text style={styles.termsTitle}>Términos y Condiciones</Text>
          <Text style={styles.termsText}>
            • Los viajes deben ser completados exitosamente (no cancelados){'\n'}
            • Sistema anti-fraude valida cada viaje{'\n'}
            • Las recompensas se procesan automáticamente{'\n'}
            • Límite de 5 referidos por día para prevenir fraude{'\n'}
            • Los pagos se realizan dentro de 48 horas después de cumplir requisitos
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginTop: 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  codeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 2,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  howItWorksCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  pendingCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  pendingAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 8,
  },
  pendingDescription: {
    fontSize: 14,
    color: '#856404',
  },
  referralsList: {
    marginBottom: 20,
  },
  referralItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referralInfo: {
    flex: 1,
  },
  referralId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  referralStatus: {
    fontSize: 14,
    color: '#666',
  },
  referralBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  referralBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  termsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
