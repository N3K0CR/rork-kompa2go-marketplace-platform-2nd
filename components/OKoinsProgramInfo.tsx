import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Coins, Gift, Star, Users, Calendar, ShoppingBag, Ticket, Crown } from 'lucide-react-native';
import { OKOINS_PROGRAM_INFO, CATEGORY_COLORS, CATEGORY_LABELS } from '@/constants/okoins';
import { useOKoins } from '@/contexts/OKoinsContext';

interface OKoinsProgramInfoProps {
  onClose?: () => void;
}

export default function OKoinsProgramInfo({ onClose }: OKoinsProgramInfoProps) {
  const { balance, getLastDailyBonusDate, awardDailyBonus } = useOKoins();

  const getEarningIcon = (method: string) => {
    switch (method) {
      case 'Bono de Bienvenida':
        return <Gift size={24} color={CATEGORY_COLORS.welcome} />;
      case 'Completar Servicios':
        return <ShoppingBag size={24} color={CATEGORY_COLORS.service} />;
      case 'Calificar Proveedores':
        return <Star size={24} color={CATEGORY_COLORS.rating} />;
      case 'Referir Amigos':
        return <Users size={24} color={CATEGORY_COLORS.referral} />;
      case 'Bono Diario':
        return <Calendar size={24} color={CATEGORY_COLORS.daily} />;
      case 'Comprar Pases de Reserva':
        return <Ticket size={24} color={CATEGORY_COLORS.reservation_pass} />;
      default:
        return <Coins size={24} color="#FFD700" />;
    }
  };

  const getSpendingIcon = (option: string) => {
    switch (option) {
      case 'Descuentos en Servicios':
        return <ShoppingBag size={24} color={CATEGORY_COLORS.discount} />;
      case 'Servicios Premium':
        return <Crown size={24} color={CATEGORY_COLORS.premium_access} />;
      case 'Kraffles (Rifas)':
        return <Ticket size={24} color={CATEGORY_COLORS.kraffle} />;
      default:
        return <Coins size={24} color="#FFD700" />;
    }
  };

  const handleClaimDailyBonus = async () => {
    const claimed = await awardDailyBonus();
    if (claimed) {
      console.log('Daily bonus claimed successfully!');
    } else {
      console.log('Daily bonus already claimed today');
    }
  };

  const canClaimDailyBonus = () => {
    const lastClaimed = getLastDailyBonusDate();
    if (!lastClaimed) return true;
    
    const today = new Date().toDateString();
    return lastClaimed.toDateString() !== today;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Coins size={32} color="#FFD700" />
          <Text style={styles.title}>{OKOINS_PROGRAM_INFO.name}</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Current Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Tu Balance Actual</Text>
        <Text style={styles.balanceAmount}>{balance.toLocaleString()} OKoins</Text>
      </View>

      {/* Daily Bonus Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bono Diario</Text>
        <View style={styles.dailyBonusCard}>
          <View style={styles.dailyBonusContent}>
            <Calendar size={24} color={CATEGORY_COLORS.daily} />
            <View style={styles.dailyBonusText}>
              <Text style={styles.dailyBonusTitle}>Reclama tu bono diario</Text>
              <Text style={styles.dailyBonusDescription}>
                +5 OKoins por iniciar sesión cada día
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.dailyBonusButton,
              !canClaimDailyBonus() && styles.dailyBonusButtonDisabled
            ]}
            onPress={handleClaimDailyBonus}
            disabled={!canClaimDailyBonus()}
          >
            <Text style={[
              styles.dailyBonusButtonText,
              !canClaimDailyBonus() && styles.dailyBonusButtonTextDisabled
            ]}>
              {canClaimDailyBonus() ? 'Reclamar' : 'Ya reclamado'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Program Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>¿Qué son los OKoins?</Text>
        <Text style={styles.description}>{OKOINS_PROGRAM_INFO.description}</Text>
        
        <View style={styles.benefitsList}>
          {OKOINS_PROGRAM_INFO.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Text style={styles.benefitBullet}>•</Text>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* How to Earn */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>¿Cómo Ganar OKoins?</Text>
        {OKOINS_PROGRAM_INFO.earningMethods.map((method, index) => (
          <View key={index} style={styles.methodCard}>
            <View style={styles.methodIcon}>
              {getEarningIcon(method.method)}
            </View>
            <View style={styles.methodContent}>
              <View style={styles.methodHeader}>
                <Text style={styles.methodTitle}>{method.method}</Text>
                <Text style={styles.methodAmount}>+{method.amount} OKoins</Text>
              </View>
              <Text style={styles.methodDescription}>{method.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* How to Spend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>¿Cómo Usar tus OKoins?</Text>
        {OKOINS_PROGRAM_INFO.spendingOptions.map((option, index) => (
          <View key={index} style={styles.methodCard}>
            <View style={styles.methodIcon}>
              {getSpendingIcon(option.option)}
            </View>
            <View style={styles.methodContent}>
              <Text style={styles.methodTitle}>{option.option}</Text>
              <Text style={styles.methodDescription}>{option.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ¡Empieza a acumular OKoins hoy y disfruta de todos los beneficios exclusivos de Kompa2Go!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    marginBottom: 16,
  },
  benefitsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  benefitBullet: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  benefitText: {
    fontSize: 16,
    color: '#495057',
    flex: 1,
  },
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  methodIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  methodContent: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  methodAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
    backgroundColor: '#d4edda',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  methodDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  dailyBonusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dailyBonusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dailyBonusText: {
    marginLeft: 12,
    flex: 1,
  },
  dailyBonusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  dailyBonusDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  dailyBonusButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dailyBonusButtonDisabled: {
    backgroundColor: '#e9ecef',
  },
  dailyBonusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dailyBonusButtonTextDisabled: {
    color: '#6c757d',
  },
  footer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
});