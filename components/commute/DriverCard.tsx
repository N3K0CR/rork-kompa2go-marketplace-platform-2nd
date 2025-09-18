import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Star, MapPin, Clock, Users, Car, MessageCircle } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';

interface Driver {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  vehicle?: {
    make: string;
    model: string;
    color: string;
    licensePlate: string;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  estimatedArrival: Date;
  availableSeats: number;
  isVerified: boolean;
}

interface DriverCardProps {
  driver: Driver;
  onSelect?: (driver: Driver) => void;
  onMessage?: (driver: Driver) => void;
  onViewLocation?: (driver: Driver) => void;
  isSelected?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export default function DriverCard({
  driver,
  onSelect,
  onMessage,
  onViewLocation,
  isSelected = false,
  showActions = true,
  compact = false
}: DriverCardProps) {
  
  const handleSelect = () => {
    if (!driver?.id?.trim()) return;
    console.log('🚗 DriverCard: Driver selected:', driver.id);
    onSelect?.(driver);
  };

  const handleMessage = () => {
    if (!driver?.id?.trim()) return;
    console.log('💬 DriverCard: Message driver:', driver.id);
    onMessage?.(driver);
  };

  const handleViewLocation = () => {
    if (!driver?.id?.trim()) return;
    console.log('📍 DriverCard: View location:', driver.id);
    onViewLocation?.(driver);
  };

  const renderRating = () => {
    const stars = [];
    const fullStars = Math.floor(driver.rating);
    const hasHalfStar = driver.rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            size={12}
            color={Colors.warning[500]}
            fill={Colors.warning[500]}
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            size={12}
            color={Colors.warning[500]}
            fill={Colors.warning[200]}
          />
        );
      } else {
        stars.push(
          <Star
            key={i}
            size={12}
            color={Colors.neutral[300]}
          />
        );
      }
    }
    
    return (
      <View style={styles.ratingContainer}>
        <View style={styles.starsContainer}>
          {stars}
        </View>
        <Text style={styles.ratingText}>
          {driver.rating.toFixed(1)} ({driver.reviewCount})
        </Text>
      </View>
    );
  };

  const renderAvatar = () => {
    if (driver.avatar) {
      return (
        <Image
          source={{ uri: driver.avatar }}
          style={styles.avatar}
          defaultSource={require('@/assets/images/icon.png')}
        />
      );
    }
    
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {driver.name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactCard,
          isSelected && styles.selectedCard
        ]}
        onPress={handleSelect}
        activeOpacity={0.8}
      >
        <View style={styles.compactHeader}>
          {renderAvatar()}
          <View style={styles.compactInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.driverName}>{driver.name}</Text>
              {driver.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>
            {renderRating()}
          </View>
          <View style={styles.compactStats}>
            <Text style={styles.etaText}>
              {new Date(driver.estimatedArrival).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            <Text style={styles.seatsText}>{driver.availableSeats} asientos</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.selectedCard
      ]}
      onPress={handleSelect}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        {renderAvatar()}
        <View style={styles.driverInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.driverName}>{driver.name}</Text>
            {driver.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>
          {renderRating()}
        </View>
        <View style={styles.statusIndicator}>
          <View style={styles.onlineIndicator} />
          <Text style={styles.statusText}>En línea</Text>
        </View>
      </View>

      {driver.vehicle && (
        <View style={styles.vehicleInfo}>
          <Car size={16} color={Colors.neutral[600]} />
          <Text style={styles.vehicleText}>
            {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}
          </Text>
          <Text style={styles.licensePlate}>
            {driver.vehicle.licensePlate}
          </Text>
        </View>
      )}

      <View style={styles.tripInfo}>
        <View style={styles.infoItem}>
          <Clock size={16} color={Colors.primary[500]} />
          <Text style={styles.infoText}>
            ETA: {new Date(driver.estimatedArrival).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Users size={16} color={Colors.success[500]} />
          <Text style={styles.infoText}>
            {driver.availableSeats} asientos disponibles
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <MapPin size={16} color={Colors.neutral[500]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {driver.location.address}
          </Text>
        </View>
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewLocation}
            activeOpacity={0.7}
          >
            <MapPin size={18} color={Colors.primary[500]} />
            <Text style={styles.actionButtonText}>Ubicación</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMessage}
            activeOpacity={0.7}
          >
            <MessageCircle size={18} color={Colors.primary[500]} />
            <Text style={styles.actionButtonText}>Mensaje</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={handleSelect}
            activeOpacity={0.7}
          >
            <Text style={styles.primaryActionText}>Seleccionar</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    ...Shadows.base,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: Colors.primary[500],
    ...Shadows.lg,
  },
  compactCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginBottom: Spacing[2],
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing[3],
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  avatarText: {
    ...Typography.textStyles.h6,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.bold,
  },
  driverInfo: {
    flex: 1,
  },
  compactInfo: {
    flex: 1,
    marginRight: Spacing[2],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  driverName: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginRight: Spacing[2],
  },
  verifiedBadge: {
    backgroundColor: Colors.success[500],
    borderRadius: BorderRadius.full,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: Typography.fontWeight.bold,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
  },
  statusIndicator: {
    alignItems: 'center',
    gap: Spacing[1],
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success[500],
  },
  statusText: {
    ...Typography.textStyles.caption,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.medium,
    fontSize: 10,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[3],
    gap: Spacing[2],
  },
  vehicleText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[700],
    flex: 1,
  },
  licensePlate: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    fontWeight: Typography.fontWeight.bold,
    backgroundColor: Colors.neutral[200],
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
  },
  tripInfo: {
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  infoText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.medium,
  },
  locationText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
    flex: 1,
  },
  compactStats: {
    alignItems: 'flex-end',
  },
  etaText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.bold,
  },
  seatsText: {
    ...Typography.textStyles.caption,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[2],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[300],
    gap: Spacing[1],
  },
  actionButtonText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
  },
  primaryAction: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  primaryActionText: {
    ...Typography.textStyles.bodySmall,
    color: 'white',
    fontWeight: Typography.fontWeight.semibold,
  },
});