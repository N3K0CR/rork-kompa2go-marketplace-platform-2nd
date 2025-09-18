// ============================================================================
// SURGE PRICING DISPLAY COMPONENT
// ============================================================================
// Componente para mostrar información de precios dinámicos

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CloudRain,
  Calendar,
  AlertTriangle,
  Info,
  DollarSign,
  Zap,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';

// ============================================================================
// TYPES
// ============================================================================

interface SurgePricingCalculation {
  zoneId: string;
  basePrice: number;
  surgeMultiplier: number;
  finalPrice: number;
  factors: {
    demand: number;
    time: number;
    weather: number;
    event: number;
    saturation: number;
  };
  explanation: string[];
  validUntil: Date;
}

interface SurgePricingDisplayProps {
  zoneId: string;
  basePrice: number;
  calculation?: SurgePricingCalculation;
  onRefresh?: () => void;
  showDetails?: boolean;
  compact?: boolean;
  animated?: boolean;
}

interface SurgeFactorProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

// ============================================================================
// SURGE FACTOR COMPONENT
// ============================================================================

const SurgeFactor: React.FC<SurgeFactorProps> = React.memo(({
  label,
  value,
  icon,
  color,
  description,
}) => {
  const [animatedValue] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: Math.min((value - 1) * 2, 1), // Normalize to 0-1 for animation
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);
  
  const getValueColor = useCallback((val: number): string => {
    if (val >= 2.0) return Colors.error[500];
    if (val >= 1.5) return Colors.warning[500];
    if (val >= 1.1) return Colors.primary[500];
    if (val < 1.0) return Colors.success[500];
    return Colors.neutral[600];
  }, []);
  
  const formatMultiplier = useCallback((val: number): string => {
    if (val === 1.0) return '1.0x';
    return `${val.toFixed(1)}x`;
  }, []);
  
  return (
    <View style={styles.surgeFactorContainer}>
      <View style={styles.surgeFactorHeader}>
        <View style={[styles.surgeFactorIcon, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        <View style={styles.surgeFactorInfo}>
          <Text style={styles.surgeFactorLabel}>{label}</Text>
          <Text style={[styles.surgeFactorValue, { color: getValueColor(value) }]}>
            {formatMultiplier(value)}
          </Text>
        </View>
      </View>
      
      {/* Progress bar */}
      <View style={styles.surgeFactorProgress}>
        <View style={styles.progressBackground}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: getValueColor(value),
                width: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>
      
      {description && (
        <Text style={styles.surgeFactorDescription}>{description}</Text>
      )}
    </View>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SurgePricingDisplay: React.FC<SurgePricingDisplayProps> = React.memo(({
  zoneId,
  basePrice,
  calculation,
  onRefresh,
  showDetails = true,
  compact = false,
  animated = true,
}) => {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showFactors, setShowFactors] = useState<boolean>(false);
  
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);
  
  const getSurgeColor = useCallback((multiplier: number): string => {
    if (multiplier >= 3.0) return Colors.error[500];
    if (multiplier >= 2.0) return Colors.warning[500];
    if (multiplier >= 1.5) return Colors.primary[500];
    if (multiplier < 1.0) return Colors.success[500];
    return Colors.neutral[600];
  }, []);
  
  const getSurgeIcon = useCallback((multiplier: number) => {
    const color = getSurgeColor(multiplier);
    if (multiplier >= 2.0) return <TrendingUp size={20} color={color} />;
    if (multiplier >= 1.2) return <TrendingUp size={20} color={color} />;
    if (multiplier < 1.0) return <TrendingDown size={20} color={color} />;
    return <DollarSign size={20} color={color} />;
  }, [getSurgeColor]);
  
  const getSurgeStatus = useCallback((multiplier: number): string => {
    if (multiplier >= 3.0) return 'Surge Muy Alto';
    if (multiplier >= 2.0) return 'Surge Alto';
    if (multiplier >= 1.5) return 'Surge Moderado';
    if (multiplier >= 1.1) return 'Surge Bajo';
    if (multiplier < 1.0) return 'Precio Reducido';
    return 'Precio Normal';
  }, []);
  
  const formatTimeRemaining = useCallback((validUntil: Date): string => {
    const now = new Date();
    const diffMs = validUntil.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins <= 0) return 'Expirado';
    if (diffMins < 60) return `${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
  }, []);
  
  const surgeFactors = useMemo(() => {
    if (!calculation) return [];
    
    return [
      {
        label: 'Demanda',
        value: calculation.factors.demand,
        icon: <TrendingUp size={16} color={Colors.primary[500]} />,
        color: Colors.primary[500],
        description: 'Basado en ratio pasajeros/conductores',
      },
      {
        label: 'Hora',
        value: calculation.factors.time,
        icon: <Clock size={16} color={Colors.secondary[500]} />,
        color: Colors.secondary[500],
        description: 'Horas pico vs valle',
      },
      {
        label: 'Clima',
        value: calculation.factors.weather,
        icon: <CloudRain size={16} color={Colors.info[500]} />,
        color: Colors.info[500],
        description: 'Condiciones meteorológicas',
      },
      {
        label: 'Eventos',
        value: calculation.factors.event,
        icon: <Calendar size={16} color={Colors.warning[500]} />,
        color: Colors.warning[500],
        description: 'Eventos especiales o emergencias',
      },
      {
        label: 'Saturación',
        value: calculation.factors.saturation,
        icon: <AlertTriangle size={16} color={Colors.error[500]} />,
        color: Colors.error[500],
        description: 'Nivel de saturación de la zona',
      },
    ];
  }, [calculation]);
  
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <View style={styles.compactPriceInfo}>
            <Text style={styles.compactBasePrice}>
              ${basePrice.toFixed(2)}
            </Text>
            {calculation && calculation.surgeMultiplier !== 1.0 && (
              <View style={styles.compactSurgeInfo}>
                {getSurgeIcon(calculation.surgeMultiplier)}
                <Text style={[styles.compactSurgeText, { color: getSurgeColor(calculation.surgeMultiplier) }]}>
                  {calculation.surgeMultiplier.toFixed(1)}x
                </Text>
              </View>
            )}
          </View>
          
          {calculation && (
            <Text style={styles.compactFinalPrice}>
              ${calculation.finalPrice.toFixed(2)}
            </Text>
          )}
        </View>
        
        {calculation && calculation.surgeMultiplier > 1.0 && (
          <Text style={styles.compactStatus}>
            {getSurgeStatus(calculation.surgeMultiplier)}
          </Text>
        )}
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Precio Dinámico</Text>
          <Text style={styles.subtitle}>Zona: {zoneId}</Text>
        </View>
        
        {onRefresh && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
            testID="refresh-surge-pricing"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            ) : (
              <Zap size={20} color={Colors.primary[500]} />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {/* Price Display */}
      <View style={styles.priceContainer}>
        <View style={styles.priceRow}>
          <View style={styles.basePriceSection}>
            <Text style={styles.basePriceLabel}>Precio Base</Text>
            <Text style={styles.basePriceValue}>${basePrice.toFixed(2)}</Text>
          </View>
          
          {calculation && (
            <>
              <View style={styles.multiplierSection}>
                {getSurgeIcon(calculation.surgeMultiplier)}
                <Text style={[styles.multiplierValue, { color: getSurgeColor(calculation.surgeMultiplier) }]}>
                  {calculation.surgeMultiplier.toFixed(1)}x
                </Text>
              </View>
              
              <View style={styles.finalPriceSection}>
                <Text style={styles.finalPriceLabel}>Precio Final</Text>
                <Text style={[styles.finalPriceValue, { color: getSurgeColor(calculation.surgeMultiplier) }]}>
                  ${calculation.finalPrice.toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </View>
        
        {calculation && (
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: getSurgeColor(calculation.surgeMultiplier) }]}>
              {getSurgeStatus(calculation.surgeMultiplier)}
            </Text>
            <Text style={styles.validUntilText}>
              Válido por: {formatTimeRemaining(calculation.validUntil)}
            </Text>
          </View>
        )}
      </View>
      
      {/* Explanation */}
      {calculation && calculation.explanation.length > 0 && (
        <View style={styles.explanationContainer}>
          <Text style={styles.explanationTitle}>Factores de Precio</Text>
          {calculation.explanation.map((explanation, index) => (
            <View key={index} style={styles.explanationItem}>
              <Info size={14} color={Colors.neutral[600]} />
              <Text style={styles.explanationText}>{explanation}</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Detailed Factors */}
      {showDetails && calculation && (
        <View style={styles.detailsContainer}>
          <TouchableOpacity
            style={styles.detailsToggle}
            onPress={() => setShowFactors(!showFactors)}
            testID="toggle-surge-factors"
          >
            <Text style={styles.detailsToggleText}>
              {showFactors ? 'Ocultar Detalles' : 'Ver Detalles'}
            </Text>
            <TrendingUp 
              size={16} 
              color={Colors.primary[500]} 
              style={[styles.detailsToggleIcon, showFactors && styles.detailsToggleIconRotated]}
            />
          </TouchableOpacity>
          
          {showFactors && (
            <View style={styles.factorsContainer}>
              {surgeFactors.map((factor, index) => (
                <SurgeFactor
                  key={index}
                  label={factor.label}
                  value={factor.value}
                  icon={factor.icon}
                  color={factor.color}
                  description={factor.description}
                />
              ))}
            </View>
          )}
        </View>
      )}
      
      {/* No Data State */}
      {!calculation && (
        <View style={styles.noDataContainer}>
          <AlertTriangle size={48} color={Colors.neutral[400]} />
          <Text style={styles.noDataTitle}>Sin Datos de Surge</Text>
          <Text style={styles.noDataText}>
            No hay información de precios dinámicos disponible para esta zona.
          </Text>
          {onRefresh && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRefresh}
              testID="retry-surge-pricing"
            >
              <Text style={styles.retryButtonText}>Intentar de Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    margin: Spacing[4],
    ...Shadows.base,
  },
  compactContainer: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginVertical: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
  },
  titleSection: {
    flex: 1,
  },
  title: {
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
    marginBottom: Spacing[1],
  },
  subtitle: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
  },
  refreshButton: {
    padding: Spacing[2],
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral[100],
  },
  priceContainer: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  basePriceSection: {
    alignItems: 'center',
    flex: 1,
  },
  basePriceLabel: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    marginBottom: Spacing[1],
  },
  basePriceValue: {
    ...Typography.textStyles.h4,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
  },
  multiplierSection: {
    alignItems: 'center',
    flex: 1,
  },
  multiplierValue: {
    ...Typography.textStyles.h3,
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing[1],
  },
  finalPriceSection: {
    alignItems: 'center',
    flex: 1,
  },
  finalPriceLabel: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    marginBottom: Spacing[1],
  },
  finalPriceValue: {
    ...Typography.textStyles.h4,
    fontWeight: Typography.fontWeight.bold,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  statusText: {
    ...Typography.textStyles.body,
    fontWeight: Typography.fontWeight.semibold,
  },
  validUntilText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
  },
  explanationContainer: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    marginBottom: Spacing[4],
    ...Shadows.sm,
  },
  explanationTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginBottom: Spacing[3],
  },
  explanationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  explanationText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[700],
    marginLeft: Spacing[2],
    flex: 1,
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  detailsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  detailsToggleText: {
    ...Typography.textStyles.body,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.semibold,
  },
  detailsToggleIcon: {
    transform: [{ rotate: '90deg' }],
  },
  detailsToggleIconRotated: {
    transform: [{ rotate: '270deg' }],
  },
  factorsContainer: {
    padding: Spacing[4],
    gap: Spacing[4],
  },
  surgeFactorContainer: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
  },
  surgeFactorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  surgeFactorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  surgeFactorInfo: {
    flex: 1,
  },
  surgeFactorLabel: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.medium,
  },
  surgeFactorValue: {
    ...Typography.textStyles.body,
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing[1],
  },
  surgeFactorProgress: {
    marginBottom: Spacing[2],
  },
  progressBackground: {
    height: 4,
    backgroundColor: Colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  surgeFactorDescription: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    lineHeight: Typography.lineHeight.relaxed,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  compactPriceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactBasePrice: {
    ...Typography.textStyles.body,
    color: Colors.neutral[700],
    marginRight: Spacing[2],
  },
  compactSurgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning[100],
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
  },
  compactSurgeText: {
    ...Typography.textStyles.caption,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: Spacing[1],
  },
  compactFinalPrice: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
  },
  compactStatus: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: Spacing[6],
  },
  noDataTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[600],
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
  },
  noDataText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed,
    marginBottom: Spacing[4],
  },
  retryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.textStyles.bodySmall,
    color: 'white',
    fontWeight: Typography.fontWeight.semibold,
  },
});

export { SurgePricingDisplay };
export default SurgePricingDisplay;