import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Coins, Info } from 'lucide-react-native';
import { useOKoins } from '@/contexts/OKoinsContext';
import OKoinsProgramInfo from './OKoinsProgramInfo';
import OKoinsHistory from './OKoinsHistory';

interface OKoinsBalanceDisplayProps {
  showInfo?: boolean;
  showHistory?: boolean;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

export default function OKoinsBalanceDisplay({ 
  showInfo = true, 
  showHistory = true, 
  size = 'medium',
  onPress 
}: OKoinsBalanceDisplayProps) {
  const { balance, isLoading } = useOKoins();
  const [showProgramInfo, setShowProgramInfo] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          balance: styles.balanceSmall,
          label: styles.labelSmall,
          icon: 16,
        };
      case 'large':
        return {
          container: styles.containerLarge,
          balance: styles.balanceLarge,
          label: styles.labelLarge,
          icon: 28,
        };
      default:
        return {
          container: styles.containerMedium,
          balance: styles.balanceMedium,
          label: styles.labelMedium,
          icon: 20,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (showHistory) {
      setShowHistoryModal(true);
    }
  };

  const handleInfoPress = (e: any) => {
    e.stopPropagation();
    setShowProgramInfo(true);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, sizeStyles.container]}>
        <Coins size={sizeStyles.icon} color="#dee2e6" />
        <Text style={[styles.balance, sizeStyles.balance, { color: '#dee2e6' }]}>
          ---
        </Text>
        <Text style={[styles.label, sizeStyles.label]}>OKoins</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity 
        style={[styles.container, sizeStyles.container]} 
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <Coins size={sizeStyles.icon} color="#FFD700" />
          <View style={styles.textContainer}>
            <Text style={[styles.balance, sizeStyles.balance]}>
              {balance.toLocaleString()}
            </Text>
            <Text style={[styles.label, sizeStyles.label]}>OKoins</Text>
          </View>
        </View>
        
        {showInfo && (
          <TouchableOpacity 
            style={styles.infoButton} 
            onPress={handleInfoPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Info size={14} color="#6c757d" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Program Info Modal */}
      <Modal
        visible={showProgramInfo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProgramInfo(false)}
      >
        <OKoinsProgramInfo onClose={() => setShowProgramInfo(false)} />
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <OKoinsHistory onClose={() => setShowHistoryModal(false)} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerSmall: {
    padding: 8,
    minWidth: 80,
  },
  containerMedium: {
    padding: 12,
    minWidth: 120,
  },
  containerLarge: {
    padding: 16,
    minWidth: 160,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 8,
    alignItems: 'flex-start',
  },
  balance: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  balanceSmall: {
    fontSize: 14,
  },
  balanceMedium: {
    fontSize: 16,
  },
  balanceLarge: {
    fontSize: 20,
  },
  label: {
    color: '#6c757d',
    marginTop: 1,
  },
  labelSmall: {
    fontSize: 10,
  },
  labelMedium: {
    fontSize: 12,
  },
  labelLarge: {
    fontSize: 14,
  },
  infoButton: {
    padding: 4,
    marginLeft: 8,
  },
});