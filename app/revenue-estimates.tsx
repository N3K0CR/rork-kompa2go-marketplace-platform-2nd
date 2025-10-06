import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { DollarSign, TrendingUp, Users, Calendar, Info, Percent } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateRevenueEstimates, formatCRC, PRICING_CONSTANTS } from '@/src/modules/commute/utils/pricing';

export default function RevenueEstimates() {
  const insets = useSafeAreaInsets();
  const [averageTripsPerDay, setAverageTripsPerDay] = useState('100');
  const [averageTripPrice, setAverageTripPrice] = useState('2500');

  const tripsPerDay = parseInt(averageTripsPerDay) || 0;
  const tripPrice = parseInt(averageTripPrice) || 0;

  const estimates = calculateRevenueEstimates(tripsPerDay, tripPrice);

  const commissionPercentage = PRICING_CONSTANTS.KOMPA2GO_COMMISSION * 100;
  const driverSharePercentage = PRICING_CONSTANTS.DRIVER_SHARE * 100;
  const ivaPercentage = PRICING_CONSTANTS.IVA_RATE * 100;

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Estimación de Ingresos',
          headerStyle: { backgroundColor: '#65ea06' },
          headerTintColor: '#131c0d',
          headerTitleStyle: { fontWeight: '700' as const },
        }} 
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <TrendingUp size={32} color="#65ea06" />
          </View>
          <Text style={styles.headerTitle}>Modelo de Comisiones Transparente</Text>
          <Text style={styles.headerSubtitle}>
            Sistema claro y justo para conductores y Kompa2Go
          </Text>
        </View>

        <View style={styles.commissionCard}>
          <Text style={styles.sectionTitle}>Estructura de Comisiones</Text>
          
          <View style={styles.commissionRow}>
            <View style={styles.commissionIcon}>
              <Percent size={20} color="#65ea06" />
            </View>
            <View style={styles.commissionInfo}>
              <Text style={styles.commissionLabel}>Comisión Kompa2Go</Text>
              <Text style={styles.commissionDescription}>Fija y transparente</Text>
            </View>
            <Text style={styles.commissionValue}>{commissionPercentage}%</Text>
          </View>

          <View style={styles.commissionRow}>
            <View style={styles.commissionIcon}>
              <Users size={20} color="#6b9e47" />
            </View>
            <View style={styles.commissionInfo}>
              <Text style={styles.commissionLabel}>Ganancia del Conductor</Text>
              <Text style={styles.commissionDescription}>Del precio sin IVA</Text>
            </View>
            <Text style={styles.commissionValueHighlight}>{driverSharePercentage}%</Text>
          </View>

          <View style={styles.commissionRow}>
            <View style={styles.commissionIcon}>
              <DollarSign size={20} color="#ff9800" />
            </View>
            <View style={styles.commissionInfo}>
              <Text style={styles.commissionLabel}>IVA (Hacienda)</Text>
              <Text style={styles.commissionDescription}>Incluido en precio final</Text>
            </View>
            <Text style={styles.commissionValueIVA}>{ivaPercentage}%</Text>
          </View>

          <View style={styles.infoBox}>
            <Info size={16} color="#6b9e47" />
            <Text style={styles.infoText}>
              El precio final incluye IVA para cumplir con obligaciones fiscales. 
              La comisión de Kompa2Go y las ganancias del conductor se calculan sobre el precio sin IVA.
            </Text>
          </View>
        </View>

        <View style={styles.calculatorCard}>
          <Text style={styles.sectionTitle}>Calculadora de Ingresos</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Viajes promedio por día</Text>
            <TextInput
              style={styles.input}
              value={averageTripsPerDay}
              onChangeText={setAverageTripsPerDay}
              keyboardType="numeric"
              placeholder="100"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Precio promedio por viaje (sin IVA)</Text>
            <View style={styles.inputWithPrefix}>
              <Text style={styles.inputPrefix}>₡</Text>
              <TextInput
                style={styles.inputWithPrefixField}
                value={averageTripPrice}
                onChangeText={setAverageTripPrice}
                keyboardType="numeric"
                placeholder="2500"
              />
            </View>
          </View>
        </View>

        <View style={styles.estimatesContainer}>
          <View style={styles.estimateCard}>
            <View style={styles.estimateHeader}>
              <Calendar size={20} color="#65ea06" />
              <Text style={styles.estimatePeriod}>Diario</Text>
            </View>
            <View style={styles.estimateStats}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Viajes</Text>
                <Text style={styles.statValue}>{estimates.daily.trips.toLocaleString('es-CR')}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Ingresos Kompa2Go</Text>
                <Text style={styles.statValueHighlight}>{formatCRC(estimates.daily.revenue)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Ganancias Conductores</Text>
                <Text style={styles.statValue}>{formatCRC(estimates.daily.driverEarnings)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>IVA Recaudado</Text>
                <Text style={styles.statValueIVA}>{formatCRC(estimates.daily.ivaCollected)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.estimateCard}>
            <View style={styles.estimateHeader}>
              <Calendar size={20} color="#65ea06" />
              <Text style={styles.estimatePeriod}>Semanal</Text>
            </View>
            <View style={styles.estimateStats}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Viajes</Text>
                <Text style={styles.statValue}>{estimates.weekly.trips.toLocaleString('es-CR')}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Ingresos Kompa2Go</Text>
                <Text style={styles.statValueHighlight}>{formatCRC(estimates.weekly.revenue)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Ganancias Conductores</Text>
                <Text style={styles.statValue}>{formatCRC(estimates.weekly.driverEarnings)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>IVA Recaudado</Text>
                <Text style={styles.statValueIVA}>{formatCRC(estimates.weekly.ivaCollected)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.estimateCard}>
            <View style={styles.estimateHeader}>
              <Calendar size={20} color="#65ea06" />
              <Text style={styles.estimatePeriod}>Mensual</Text>
            </View>
            <View style={styles.estimateStats}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Viajes</Text>
                <Text style={styles.statValue}>{estimates.monthly.trips.toLocaleString('es-CR')}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Ingresos Kompa2Go</Text>
                <Text style={styles.statValueHighlight}>{formatCRC(estimates.monthly.revenue)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Ganancias Conductores</Text>
                <Text style={styles.statValue}>{formatCRC(estimates.monthly.driverEarnings)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>IVA Recaudado</Text>
                <Text style={styles.statValueIVA}>{formatCRC(estimates.monthly.ivaCollected)}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.estimateCard, styles.estimateCardHighlight]}>
            <View style={styles.estimateHeader}>
              <TrendingUp size={24} color="#65ea06" />
              <Text style={styles.estimatePeriodHighlight}>Anual</Text>
            </View>
            <View style={styles.estimateStats}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Viajes</Text>
                <Text style={styles.statValue}>{estimates.annual.trips.toLocaleString('es-CR')}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Ingresos Kompa2Go</Text>
                <Text style={styles.statValueHighlightLarge}>{formatCRC(estimates.annual.revenue)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Ganancias Conductores</Text>
                <Text style={styles.statValue}>{formatCRC(estimates.annual.driverEarnings)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>IVA Recaudado</Text>
                <Text style={styles.statValueIVA}>{formatCRC(estimates.annual.ivaCollected)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.comparisonCard}>
          <Text style={styles.sectionTitle}>Ventaja Competitiva vs Uber</Text>
          
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Uber</Text>
              <Text style={styles.comparisonDescription}>Comisión variable y opaca</Text>
              <Text style={styles.comparisonValue}>~25-30%</Text>
            </View>
            
            <View style={styles.comparisonDivider} />
            
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabelHighlight}>Kompa2Go</Text>
              <Text style={styles.comparisonDescriptionHighlight}>Comisión fija y transparente</Text>
              <Text style={styles.comparisonValueHighlight}>{commissionPercentage}%</Text>
            </View>
          </View>

          <View style={styles.benefitsBox}>
            <Text style={styles.benefitsTitle}>Beneficios para Conductores:</Text>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>Mayor ganancia por viaje (85% vs 70-75%)</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>Transparencia total en comisiones</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>Precios competitivos para usuarios</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>IVA incluido para cumplimiento fiscal</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafcf8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e6f9e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#131c0d',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b9e47',
    textAlign: 'center',
  },
  commissionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 4,
  },
  commissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf4e6',
  },
  commissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecf4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commissionInfo: {
    flex: 1,
    gap: 2,
  },
  commissionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  commissionDescription: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#6b9e47',
  },
  commissionValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  commissionValueHighlight: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#65ea06',
  },
  commissionValueIVA: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#ff9800',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#f8fff4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6f9e0',
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#6b9e47',
    lineHeight: 18,
  },
  calculatorCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b9e47',
  },
  input: {
    backgroundColor: '#ecf4e6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#131c0d',
    borderWidth: 1,
    borderColor: '#d4e8cc',
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf4e6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d4e8cc',
    paddingLeft: 16,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#6b9e47',
    marginRight: 8,
  },
  inputWithPrefixField: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  estimatesContainer: {
    gap: 16,
  },
  estimateCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  estimateCardHighlight: {
    backgroundColor: '#f8fff4',
    borderWidth: 2,
    borderColor: '#65ea06',
  },
  estimateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf4e6',
  },
  estimatePeriod: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  estimatePeriodHighlight: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#65ea06',
  },
  estimateStats: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b9e47',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  statValueHighlight: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#65ea06',
  },
  statValueHighlightLarge: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#65ea06',
  },
  statValueIVA: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#ff9800',
  },
  comparisonCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#ecf4e6',
    borderRadius: 12,
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b9e47',
  },
  comparisonLabelHighlight: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#65ea06',
  },
  comparisonDescription: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#6b9e47',
    textAlign: 'center',
  },
  comparisonDescriptionHighlight: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#65ea06',
    textAlign: 'center',
  },
  comparisonValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  comparisonValueHighlight: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#65ea06',
  },
  comparisonDivider: {
    width: 2,
    backgroundColor: '#d4e8cc',
  },
  benefitsBox: {
    padding: 16,
    backgroundColor: '#f8fff4',
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 4,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#65ea06',
    marginTop: 6,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#6b9e47',
    lineHeight: 18,
  },
});
