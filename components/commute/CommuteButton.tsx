import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Car, Users, MapPin, Clock, Zap } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';

interface CommuteButtonProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  badge?: string | number;
  showStats?: boolean;
  stats?: {
    duration?: number;
    distance?: number;
    cost?: number;
    participants?: number;
    carbonSaved?: number;
  };
}

export default function CommuteButton({
  title,
  subtitle,
  icon,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  badge,
  showStats = false,
  stats
}: CommuteButtonProps) {

  const handlePress = () => {
    if (disabled || loading) return;
    if (!title?.trim()) return;
    console.log('🔘 CommuteButton: Button pressed:', title);
    onPress();
  };

  const renderStats = () => {
    if (!showStats || !stats) return null;
    
    return (
      <View style={styles.statsContainer}>
        {stats.duration && (
          <View style={styles.statItem}>
            <Clock size={12} color={Colors.neutral[500]} />
            <Text style={styles.statText}>{stats.duration} min</Text>
          </View>
        )}
        
        {stats.distance && (
          <View style={styles.statItem}>
            <MapPin size={12} color={Colors.neutral[500]} />
            <Text style={styles.statText}>{(stats.distance / 1000).toFixed(1)} km</Text>
          </View>
        )}
        
        {stats.cost && (
          <View style={styles.statItem}>
            <Text style={styles.costText}>₡{stats.cost}</Text>
          </View>
        )}
        
        {stats.participants && (
          <View style={styles.statItem}>
            <Users size={12} color={Colors.success[500]} />
            <Text style={styles.statText}>{stats.participants}</Text>
          </View>
        )}
        
        {stats.carbonSaved && (
          <View style={styles.statItem}>
            <Zap size={12} color={Colors.success[600]} />
            <Text style={styles.carbonText}>-{stats.carbonSaved.toFixed(1)} kg CO₂</Text>
          </View>
        )}
      </View>
    );
  };

  const renderIcon = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? 'white' : Colors.primary[500]} 
        />
      );
    }
    
    if (icon) {
      return icon;
    }
    
    // Default icon based on title
    if (title.toLowerCase().includes('conductor')) {
      return <Car size={20} color={variant === 'primary' ? 'white' : Colors.primary[500]} />;
    }
    
    return null;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        size === 'small' && styles.buttonSmall,
        size === 'large' && styles.buttonLarge,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'outline' && styles.buttonOutline,
        variant === 'ghost' && styles.buttonGhost,
        disabled && styles.buttonDisabled
      ]}
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled || loading}
    >
      <View style={styles.buttonContent}>
        <View style={styles.buttonMain}>
          {renderIcon()}
          
          <View style={styles.textContainer}>
            <Text style={[
              styles.buttonText,
              variant === 'secondary' && styles.buttonTextSecondary,
              variant === 'outline' && styles.buttonTextOutline,
              variant === 'ghost' && styles.buttonTextGhost,
              disabled && styles.buttonTextDisabled
            ]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitleText}>{subtitle}</Text>
            )}
          </View>
          
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        
        {renderStats()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.primary[500],
    ...Shadows.sm,
  },
  buttonSmall: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  buttonLarge: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
  },
  buttonSecondary: {
    backgroundColor: Colors.neutral[100],
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary[500],
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    backgroundColor: Colors.neutral[200],
    borderColor: Colors.neutral[200],
  },
  buttonContent: {
    gap: Spacing[2],
  },
  buttonMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  textContainer: {
    flex: 1,
  },
  buttonText: {
    ...Typography.textStyles.button,
    color: 'white',
  },
  buttonTextSecondary: {
    color: Colors.neutral[700],
  },
  buttonTextOutline: {
    color: Colors.primary[500],
  },
  buttonTextGhost: {
    color: Colors.primary[500],
  },
  buttonTextDisabled: {
    color: Colors.neutral[400],
  },
  subtitleText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  badge: {
    backgroundColor: Colors.error[500],
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[1],
  },
  badgeText: {
    ...Typography.textStyles.caption,
    color: 'white',
    fontWeight: Typography.fontWeight.bold,
    fontSize: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  statText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
  },
  costText: {
    ...Typography.textStyles.caption,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.bold,
  },
  carbonText: {
    ...Typography.textStyles.caption,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.medium,
  },
});