import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check, Zap, DollarSign, Clock } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';
import { TransportMode } from '@/src/modules/commute/types/core-types';

interface TransportModeSelectorProps {
  transportModes: TransportMode[];
  selectedModes: string[];
  onSelectionChange: (selectedModes: string[]) => void;
  maxSelection?: number;
  showDetails?: boolean;
  horizontal?: boolean;
  compact?: boolean;
}

export default function TransportModeSelector({
  transportModes,
  selectedModes,
  onSelectionChange,
  maxSelection,
  showDetails = true,
  horizontal = false,
  compact = false
}: TransportModeSelectorProps) {

  const handleModeToggle = (modeId: string) => {
    if (!modeId?.trim()) return;
    
    const isSelected = selectedModes.includes(modeId);
    let newSelection: string[];
    
    if (isSelected) {
      newSelection = selectedModes.filter(id => id !== modeId);
    } else {
      if (maxSelection && selectedModes.length >= maxSelection) {
        // Replace the first selected mode if at max capacity
        newSelection = [...selectedModes.slice(1), modeId];
      } else {
        newSelection = [...selectedModes, modeId];
      }
    }
    
    console.log('🚌 TransportModeSelector: Selection changed:', newSelection);
    onSelectionChange(newSelection);
  };

  const getTransportModeIcon = (mode: TransportMode) => {
    return mode.icon || '🚗';
  };

  const renderModeCard = (mode: TransportMode) => {
    const isSelected = selectedModes.includes(mode.id);
    const isDisabled = !mode.available;
    
    return (
      <TouchableOpacity
        key={mode.id}
        style={[
          compact ? styles.compactModeCard : styles.modeCard,
          isSelected && styles.selectedModeCard,
          isDisabled && styles.disabledModeCard,
          horizontal && styles.horizontalModeCard
        ]}
        onPress={() => !isDisabled && handleModeToggle(mode.id)}
        activeOpacity={isDisabled ? 1 : 0.7}
        disabled={isDisabled}
      >
        <View style={styles.modeHeader}>
          <View style={styles.modeIconContainer}>
            <Text style={styles.modeIcon}>
              {getTransportModeIcon(mode)}
            </Text>
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Check size={12} color="white" />
              </View>
            )}
          </View>
          
          <View style={styles.modeInfo}>
            <Text style={[
              styles.modeName,
              isDisabled && styles.disabledText
            ]}>
              {mode.name}
            </Text>
            
            {!compact && showDetails && (
              <View style={styles.modeDetails}>
                <View style={styles.detailItem}>
                  <DollarSign size={12} color={Colors.success[500]} />
                  <Text style={styles.detailText}>
                    {mode.costFactor < 0.5 ? 'Económico' :
                     mode.costFactor < 1.5 ? 'Moderado' : 'Costoso'}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Clock size={12} color={Colors.primary[500]} />
                  <Text style={styles.detailText}>
                    {mode.speedFactor > 1.5 ? 'Rápido' :
                     mode.speedFactor > 0.8 ? 'Normal' : 'Lento'}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Zap size={12} color={Colors.success[600]} />
                  <Text style={styles.detailText}>
                    {mode.carbonFactor < 0.3 ? 'Eco' :
                     mode.carbonFactor < 0.7 ? 'Medio' : 'Alto CO₂'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
        
        {!isDisabled && (
          <View 
            style={[
              styles.modeColorIndicator,
              { backgroundColor: mode.color }
            ]} 
          />
        )}
      </TouchableOpacity>
    );
  };

  const availableModes = transportModes.filter(mode => mode.available);
  const unavailableModes = transportModes.filter(mode => !mode.available);

  if (horizontal) {
    return (
      <View style={styles.horizontalContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
        >
          {availableModes.map(renderModeCard)}
        </ScrollView>
        
        {maxSelection && (
          <Text style={styles.selectionCounter}>
            {selectedModes.length}/{maxSelection} seleccionados
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {maxSelection && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Modos de Transporte</Text>
          <Text style={styles.selectionCounter}>
            {selectedModes.length}/{maxSelection} seleccionados
          </Text>
        </View>
      )}
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.modesGrid}>
          {availableModes.map(renderModeCard)}
        </View>
        
        {unavailableModes.length > 0 && (
          <View style={styles.unavailableSection}>
            <Text style={styles.unavailableTitle}>No Disponibles</Text>
            <View style={styles.modesGrid}>
              {unavailableModes.map(renderModeCard)}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  horizontalContainer: {
    marginBottom: Spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  headerTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
  },
  selectionCounter: {
    ...Typography.textStyles.caption,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
  },
  scrollContainer: {
    flex: 1,
  },
  horizontalContent: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
  },
  modesGrid: {
    gap: Spacing[3],
  },
  modeCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    position: 'relative',
    ...Shadows.sm,
  },
  compactModeCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    position: 'relative',
    ...Shadows.sm,
  },
  horizontalModeCard: {
    minWidth: 120,
  },
  selectedModeCard: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
    ...Shadows.base,
  },
  disabledModeCard: {
    opacity: 0.5,
    backgroundColor: Colors.neutral[50],
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  modeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modeIcon: {
    fontSize: 28,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginBottom: Spacing[2],
    fontSize: 16,
    lineHeight: 24,
  },
  disabledText: {
    color: Colors.neutral[400],
  },
  modeDetails: {
    flexDirection: 'row',
    gap: Spacing[4],
    marginTop: Spacing[1],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  detailText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    fontSize: 12,
    lineHeight: 18,
  },
  modeColorIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  unavailableSection: {
    marginTop: Spacing[6],
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  unavailableTitle: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[500],
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[3],
  },
});