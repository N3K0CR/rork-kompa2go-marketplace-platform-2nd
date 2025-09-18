import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, MapPin, Clock, Users, Settings, DollarSign, Star } from 'lucide-react-native';
import { useCommute } from '@/hooks/useCommute';
import { CommuteButton, TransportModeSelector, TripStatus } from '@/components/commute';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';
import { Route } from '@/backend/trpc/routes/commute/types';

export default function CommuteDriver() {
  const {
    routes,
    transportModes,
    activeTrips,
    updateDriverStatus,
    acceptRideRequest
  } = useCommute();

  const [isAvailable, setIsAvailable] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedTransportModes, setSelectedTransportModes] = useState<string[]>([]);
  const [pricePerKm, setPricePerKm] = useState(500); // CRC per km

  console.log('🚗 CommuteDriver: Rendered with availability:', isAvailable);
  console.log('🚗 CommuteDriver: Active trips as driver:', activeTrips.filter(t => t.role === 'driver').length);

  const handleToggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      console.log('🚗 CommuteDriver: Toggling availability to:', newStatus);
      
      await updateDriverStatus({
        isAvailable: newStatus,
        routeId: selectedRoute?.id,
        transportModeIds: selectedTransportModes,
        pricePerKm
      });
      
      setIsAvailable(newStatus);
    } catch (error) {
      console.error('❌ CommuteDriver: Error updating status:', error);
    }
  };

  const handleAcceptRide = async (requestId: string) => {
    try {
      console.log('✅ CommuteDriver: Accepting ride request:', requestId);
      const trip = await acceptRideRequest(requestId);
      router.push(`/commute/trip/${trip.id}`);
    } catch (error) {
      console.error('❌ CommuteDriver: Error accepting ride:', error);
    }
  };

  const renderAvailabilityToggle = () => (
    <View style={styles.section}>
      <View style={styles.availabilityHeader}>
        <View style={styles.availabilityInfo}>
          <Text style={styles.sectionTitle}>Estado del Conductor</Text>
          <Text style={styles.availabilitySubtitle}>
            {isAvailable ? 'Disponible para viajes' : 'No disponible'}
          </Text>
        </View>
        <View style={styles.availabilityToggle}>
          <Switch
            value={isAvailable}
            onValueChange={handleToggleAvailability}
            trackColor={{ false: Colors.neutral[300], true: Colors.success[300] }}
            thumbColor={isAvailable ? Colors.success[500] : Colors.neutral[500]}
          />
        </View>
      </View>
      
      {isAvailable && (
        <View style={styles.availabilityDetails}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: Colors.success[500] }]} />
            <Text style={styles.statusText}>Activo - Buscando pasajeros</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderRouteSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ruta de Servicio</Text>
      {routes.length === 0 ? (
        <View style={styles.emptyState}>
          <MapPin size={32} color={Colors.neutral[400]} />
          <Text style={styles.emptyStateText}>
            Necesitas crear una ruta para ofrecer servicios de conductor
          </Text>
          <TouchableOpacity
            style={styles.createRouteButton}
            onPress={() => router.back()}
          >
            <Text style={styles.createRouteButtonText}>Crear Ruta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.routeSelector}>
          {routes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={[
                styles.routeOption,
                selectedRoute?.id === route.id && styles.routeOptionSelected
              ]}
              onPress={() => setSelectedRoute(route)}
            >
              <View style={styles.routeOptionContent}>
                <Text style={[
                  styles.routeOptionTitle,
                  selectedRoute?.id === route.id && styles.routeOptionTitleSelected
                ]}>
                  {route.name}
                </Text>
                <View style={styles.routeOptionDetails}>
                  <View style={styles.routeOptionDetail}>
                    <MapPin size={12} color={Colors.neutral[500]} />
                    <Text style={styles.routeOptionDetailText}>
                      {route.points.length} paradas
                    </Text>
                  </View>
                </View>
              </View>
              {selectedRoute?.id === route.id && (
                <View style={styles.selectedIndicator}>
                  <View style={styles.selectedDot} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderTransportModes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vehículos Disponibles</Text>
      <TransportModeSelector
        transportModes={transportModes}
        selectedModes={selectedTransportModes}
        onSelectionChange={setSelectedTransportModes}
        maxSelection={2}
        showDetails
        compact={false}
      />
    </View>
  );

  const renderPricing = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Configuración de Precios</Text>
      <View style={styles.pricingCard}>
        <View style={styles.pricingHeader}>
          <DollarSign size={20} color={Colors.success[500]} />
          <Text style={styles.pricingTitle}>Precio por Kilómetro</Text>
        </View>
        <View style={styles.pricingControls}>
          <TouchableOpacity
            style={styles.pricingButton}
            onPress={() => setPricePerKm(Math.max(100, pricePerKm - 50))}
          >
            <Text style={styles.pricingButtonText}>-</Text>
          </TouchableOpacity>
          <View style={styles.pricingDisplay}>
            <Text style={styles.pricingAmount}>₡{pricePerKm}</Text>
            <Text style={styles.pricingUnit}>por km</Text>
          </View>
          <TouchableOpacity
            style={styles.pricingButton}
            onPress={() => setPricePerKm(Math.min(2000, pricePerKm + 50))}
          >
            <Text style={styles.pricingButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderActiveTrips = () => {
    const driverTrips = activeTrips.filter(trip => trip.role === 'driver');
    
    if (driverTrips.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Viajes como Conductor</Text>
        {driverTrips.map((trip) => (
          <TouchableOpacity
            key={trip.id}
            style={styles.tripCard}
            onPress={() => router.push(`/commute/trip/${trip.id}`)}
          >
            <TripStatus
              trip={trip}
              showPassengerInfo
              showActions
              onAccept={() => handleAcceptRide(trip.id)}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Estadísticas del Conductor</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Car size={24} color={Colors.primary[500]} />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Viajes Completados</Text>
        </View>
        
        <View style={styles.statCard}>
          <Star size={24} color={Colors.warning[500]} />
          <Text style={styles.statNumber}>5.0</Text>
          <Text style={styles.statLabel}>Calificación</Text>
        </View>
        
        <View style={styles.statCard}>
          <DollarSign size={24} color={Colors.success[500]} />
          <Text style={styles.statNumber}>₡0</Text>
          <Text style={styles.statLabel}>Ganancias</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{ 
          title: 'Modo Conductor',
          headerStyle: { backgroundColor: Colors.primary[500] },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        {renderAvailabilityToggle()}
        {renderRouteSelection()}
        {renderTransportModes()}
        {renderPricing()}
        {renderActiveTrips()}
        {renderStats()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: Spacing[4],
    backgroundColor: 'white',
    marginBottom: Spacing[2],
  },
  sectionTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginBottom: Spacing[3],
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilitySubtitle: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
    marginTop: Spacing[1],
  },
  availabilityToggle: {
    marginLeft: Spacing[4],
  },
  availabilityDetails: {
    backgroundColor: Colors.success[50],
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.success[700],
    fontWeight: Typography.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
  },
  emptyStateText: {
    ...Typography.textStyles.body,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: Spacing[2],
    marginBottom: Spacing[4],
    paddingHorizontal: Spacing[4],
  },
  createRouteButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
  },
  createRouteButtonText: {
    ...Typography.textStyles.button,
    color: 'white',
  },
  routeSelector: {
    gap: Spacing[2],
  },
  routeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  routeOptionSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  routeOptionContent: {
    flex: 1,
  },
  routeOptionTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginBottom: Spacing[1],
  },
  routeOptionTitleSelected: {
    color: Colors.primary[700],
  },
  routeOptionDetails: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  routeOptionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  routeOptionDetailText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
  },
  selectedIndicator: {
    marginLeft: Spacing[3],
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary[500],
  },
  pricingCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  pricingTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
  },
  pricingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[4],
  },
  pricingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pricingButtonText: {
    ...Typography.textStyles.h5,
    color: 'white',
    fontWeight: Typography.fontWeight.bold,
  },
  pricingDisplay: {
    alignItems: 'center',
    minWidth: 120,
  },
  pricingAmount: {
    ...Typography.textStyles.h4,
    color: Colors.success[600],
    fontWeight: Typography.fontWeight.bold,
  },
  pricingUnit: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
  },
  tripCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    ...Shadows.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    alignItems: 'center',
    gap: Spacing[2],
  },
  statNumber: {
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
  },
  statLabel: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
});