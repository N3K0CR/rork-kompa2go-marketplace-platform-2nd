import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MapPin, Clock, DollarSign, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KommuterProfile {
  id: string;
  firstName: string;
  vehicleType: string;
  rating: number;
  totalTrips: number;
  achievements: string[];
  experienceYears: number;
  previousPlatforms: string[];
}

const MOCK_KOMMUTERS: KommuterProfile[] = [
  {
    id: 'k1',
    firstName: 'Carlos',
    vehicleType: 'Kommute 4',
    rating: 4.9,
    totalTrips: 1247,
    achievements: ['Top Driver', '500+ Viajes'],
    experienceYears: 3,
    previousPlatforms: ['Uber', 'Lyft'],
  },
  {
    id: 'k2',
    firstName: 'María',
    vehicleType: 'Kommute Large',
    rating: 4.8,
    totalTrips: 892,
    achievements: ['Conductor Seguro', '5 Estrellas'],
    experienceYears: 2,
    previousPlatforms: ['Uber', 'Didi'],
  },
];

export default function SearchingKommuter() {
  const params = useLocalSearchParams<{
    originAddress: string;
    destAddress: string;
    vehicleType: string;
    vehicleName: string;
    estimatedPrice: string;
    estimatedTime: string;
    distance: string;
  }>();

  const insets = useSafeAreaInsets();
  const [isSearching, setIsSearching] = useState(true);
  const [matchedKommuter, setMatchedKommuter] = useState<KommuterProfile | null>(null);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      const randomKommuter = MOCK_KOMMUTERS[Math.floor(Math.random() * MOCK_KOMMUTERS.length)];
      setMatchedKommuter(randomKommuter);
      setIsSearching(false);
    }, 3000);

    return () => clearTimeout(searchTimeout);
  }, []);

  const handleCancel = () => {
    Alert.alert(
      'Cancelar búsqueda',
      '¿Estás seguro de que deseas cancelar la búsqueda?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleAcceptTrip = () => {
    Alert.alert(
      'Viaje confirmado',
      `${matchedKommuter?.firstName} está en camino a tu ubicación`,
      [
        {
          text: 'Ver detalles',
          onPress: () => {
            router.replace('/commute/trip/active');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.mapPlaceholder}>
        <View style={styles.mapOverlay} />
      </View>

      <TouchableOpacity
        style={[styles.cancelButton, { top: insets.top + 16 }]}
        onPress={handleCancel}
      >
        <X size={24} color="#131c0d" />
      </TouchableOpacity>

      <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        {isSearching ? (
          <View style={styles.searchingCard}>
            <ActivityIndicator size="large" color="#65ea06" />
            <Text style={styles.searchingTitle}>Buscando Kommuters cercanos...</Text>
            <Text style={styles.searchingSubtitle}>
              Esto puede tomar unos segundos
            </Text>

            <View style={styles.tripInfoCompact}>
              <View style={styles.tripInfoRow}>
                <MapPin size={16} color="#6b9e47" />
                <Text style={styles.tripInfoText} numberOfLines={1}>
                  {params.distance} km
                </Text>
              </View>
              <View style={styles.tripInfoRow}>
                <Clock size={16} color="#6b9e47" />
                <Text style={styles.tripInfoText}>
                  {params.estimatedTime} min
                </Text>
              </View>
              <View style={styles.tripInfoRow}>
                <DollarSign size={16} color="#6b9e47" />
                <Text style={styles.tripInfoText}>
                  ₡{params.estimatedPrice}
                </Text>
              </View>
            </View>
          </View>
        ) : matchedKommuter ? (
          <View style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.matchTitle}>¡Kommuter encontrado!</Text>
              <Text style={styles.matchSubtitle}>
                {matchedKommuter.firstName} aceptó tu viaje
              </Text>
            </View>

            <View style={styles.kommuterInfo}>
              <View style={styles.kommuterAvatar}>
                <Text style={styles.kommuterInitial}>
                  {matchedKommuter.firstName.charAt(0)}
                </Text>
              </View>

              <View style={styles.kommuterDetails}>
                <Text style={styles.kommuterName}>{matchedKommuter.firstName}</Text>
                <Text style={styles.kommuterVehicle}>{matchedKommuter.vehicleType}</Text>

                <View style={styles.kommuterStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>⭐ {matchedKommuter.rating}</Text>
                    <Text style={styles.statLabel}>Calificación</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{matchedKommuter.totalTrips}</Text>
                    <Text style={styles.statLabel}>Viajes</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{matchedKommuter.experienceYears} años</Text>
                    <Text style={styles.statLabel}>Experiencia</Text>
                  </View>
                </View>

                {matchedKommuter.achievements.length > 0 && (
                  <View style={styles.achievements}>
                    {matchedKommuter.achievements.map((achievement, index) => (
                      <View key={index} style={styles.achievementBadge}>
                        <Text style={styles.achievementText}>{achievement}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {matchedKommuter.previousPlatforms.length > 0 && (
                  <View style={styles.experience}>
                    <Text style={styles.experienceLabel}>Experiencia previa:</Text>
                    <Text style={styles.experienceText}>
                      {matchedKommuter.previousPlatforms.join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.tripSummary}>
              <Text style={styles.tripSummaryTitle}>Detalles del viaje</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Origen</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {params.originAddress?.split(',')[0]}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Destino</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {params.destAddress?.split(',')[0]}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Distancia</Text>
                <Text style={styles.summaryValue}>{params.distance} km</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tiempo estimado</Text>
                <Text style={styles.summaryValue}>{params.estimatedTime} min</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Costo estimado</Text>
                <Text style={styles.summaryValueHighlight}>₡{params.estimatedPrice}</Text>
              </View>

              <Text style={styles.negotiableNote}>
                * Puedes negociar el precio con el conductor
              </Text>
            </View>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAcceptTrip}
            >
              <Text style={styles.acceptButtonText}>Aceptar y continuar</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafcf8',
  },
  mapPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: '#e8f5e9',
  },
  mapOverlay: {
    flex: 1,
    backgroundColor: 'rgba(250, 252, 248, 0.5)',
  },
  cancelButton: {
    position: 'absolute',
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  searchingCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  searchingTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#131c0d',
    textAlign: 'center',
  },
  searchingSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b9e47',
    textAlign: 'center',
  },
  tripInfoCompact: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
  },
  tripInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripInfoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#131c0d',
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  matchHeader: {
    alignItems: 'center',
    gap: 8,
  },
  checkmarkContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#65ea06',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 36,
    color: 'white',
    fontWeight: '700' as const,
  },
  matchTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  matchSubtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#6b9e47',
  },
  kommuterInfo: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    backgroundColor: '#f8fff4',
    borderRadius: 16,
  },
  kommuterAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#65ea06',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kommuterInitial: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: 'white',
  },
  kommuterDetails: {
    flex: 1,
    gap: 8,
  },
  kommuterName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  kommuterVehicle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b9e47',
  },
  kommuterStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  statItem: {
    gap: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#6b9e47',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#ecf4e6',
  },
  achievements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  achievementBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#e6f9e0',
    borderRadius: 12,
  },
  achievementText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#65ea06',
  },
  experience: {
    marginTop: 4,
    gap: 2,
  },
  experienceLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6b9e47',
  },
  experienceText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#131c0d',
  },
  tripSummary: {
    gap: 12,
  },
  tripSummaryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b9e47',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#131c0d',
    flex: 1,
    textAlign: 'right',
  },
  summaryValueHighlight: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#65ea06',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#ecf4e6',
    marginVertical: 4,
  },
  negotiableNote: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#9ca3af',
    fontStyle: 'italic' as const,
    marginTop: 4,
  },
  acceptButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#65ea06',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#65ea06',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#131c0d',
  },
});
