import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { Search, MapPin, Clock, Users, Filter, SlidersHorizontal } from 'lucide-react-native';
import { useCommute } from '@/hooks/useCommute';
import { CommuteButton, TransportModeSelector, DriverCard } from '@/components/commute';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';
import { Route, Driver } from '@/backend/trpc/routes/commute/types';

export default function CommuteSearch() {
  const {
    routes,
    transportModes,
    searchDrivers,
    requestRide
  } = useCommute();

  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedTransportModes, setSelectedTransportModes] = useState<string[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  console.log('🔍 CommuteSearch: Rendered with', routes.length, 'routes');
  console.log('🔍 CommuteSearch: Available drivers:', availableDrivers.length);

  const handleSearchDrivers = async () => {
    if (!selectedRoute) {
      console.log('❌ CommuteSearch: No route selected');
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 CommuteSearch: Searching drivers for route:', selectedRoute.id);
      const drivers = await searchDrivers({
        routeId: selectedRoute.id,
        transportModeIds: selectedTransportModes,
        maxDistance: 5000, // 5km radius
        departureTime: new Date()
      });
      setAvailableDrivers(drivers);
    } catch (error) {
      console.error('❌ CommuteSearch: Error searching drivers:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestRide = async (driver: Driver) => {
    if (!selectedRoute) return;

    try {
      console.log('🚗 CommuteSearch: Requesting ride from driver:', driver.id);
      const trip = await requestRide({
        routeId: selectedRoute.id,
        driverId: driver.id,
        pickupPoint: selectedRoute.points[0],
        dropoffPoint: selectedRoute.points[selectedRoute.points.length - 1]
      });
      
      router.push(`/commute/trip/${trip.id}`);
    } catch (error) {
      console.error('❌ CommuteSearch: Error requesting ride:', error);
    }
  };

  const renderRouteSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Selecciona tu Ruta</Text>
      {routes.length === 0 ? (
        <View style={styles.emptyState}>
          <MapPin size={32} color={Colors.neutral[400]} />
          <Text style={styles.emptyStateText}>
            No tienes rutas guardadas. Crea una ruta primero.
          </Text>
          <TouchableOpacity
            style={styles.createRouteButton}
            onPress={() => router.back()}
          >
            <Text style={styles.createRouteButtonText}>Crear Ruta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.routeCards}>
            {routes.map((route) => (
              <TouchableOpacity
                key={route.id}
                style={[
                  styles.routeCard,
                  selectedRoute?.id === route.id && styles.routeCardSelected
                ]}
                onPress={() => setSelectedRoute(route)}
              >
                <Text style={[
                  styles.routeCardTitle,
                  selectedRoute?.id === route.id && styles.routeCardTitleSelected
                ]}>
                  {route.name}
                </Text>
                <View style={styles.routeCardDetails}>
                  <View style={styles.routeCardDetail}>
                    <MapPin size={12} color={Colors.neutral[500]} />
                    <Text style={styles.routeCardDetailText}>
                      {route.points.length} paradas
                    </Text>
                  </View>
                  {route.estimatedDuration && (
                    <View style={styles.routeCardDetail}>
                      <Clock size={12} color={Colors.neutral[500]} />
                      <Text style={styles.routeCardDetailText}>
                        {route.estimatedDuration} min
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={styles.section}>
      <View style={styles.filtersHeader}>
        <Text style={styles.sectionTitle}>Filtros de Búsqueda</Text>
        <TouchableOpacity
          style={styles.toggleFiltersButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} color={Colors.primary[500]} />
          <Text style={styles.toggleFiltersText}>
            {showFilters ? 'Ocultar' : 'Mostrar'}
          </Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContent}>
          <Text style={styles.filterLabel}>Modos de Transporte</Text>
          <TransportModeSelector
            transportModes={transportModes}
            selectedModes={selectedTransportModes}
            onSelectionChange={setSelectedTransportModes}
            maxSelection={3}
            showDetails={false}
            compact
          />
        </View>
      )}
    </View>
  );

  const renderSearchButton = () => (
    <View style={styles.searchSection}>
      <CommuteButton
        title={isSearching ? 'Buscando...' : 'Buscar Conductores'}
        subtitle={selectedRoute ? `En ruta: ${selectedRoute.name}` : 'Selecciona una ruta'}
        icon={<Search size={20} color="white" />}
        onPress={handleSearchDrivers}
        disabled={!selectedRoute || isSearching}
        loading={isSearching}
        variant="primary"
        size="large"
      />
    </View>
  );

  const renderDriverResults = () => {
    if (availableDrivers.length === 0 && !isSearching) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Conductores Disponibles ({availableDrivers.length})
        </Text>
        
        {availableDrivers.length === 0 ? (
          <View style={styles.noResultsState}>
            <Users size={32} color={Colors.neutral[400]} />
            <Text style={styles.noResultsTitle}>No hay conductores disponibles</Text>
            <Text style={styles.noResultsText}>
              Intenta ajustar tus filtros o buscar en otro momento
            </Text>
          </View>
        ) : (
          availableDrivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onPress={() => handleRequestRide(driver)}
              showDistance
              showRating
              showVehicleInfo
            />
          ))
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Buscar Viaje',
          headerStyle: { backgroundColor: Colors.primary[500] },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        {renderRouteSelector()}
        {renderFilters()}
        {renderSearchButton()}
        {renderDriverResults()}
      </ScrollView>
    </View>
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
  routeCards: {
    flexDirection: 'row',
    gap: Spacing[3],
    paddingRight: Spacing[4],
  },
  routeCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 200,
    ...Shadows.sm,
  },
  routeCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  routeCardTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginBottom: Spacing[2],
  },
  routeCardTitleSelected: {
    color: Colors.primary[700],
  },
  routeCardDetails: {
    gap: Spacing[1],
  },
  routeCardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  routeCardDetailText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  toggleFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
  },
  toggleFiltersText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
  },
  filtersContent: {
    gap: Spacing[3],
  },
  filterLabel: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.semibold,
  },
  searchSection: {
    padding: Spacing[4],
    backgroundColor: 'white',
    marginBottom: Spacing[2],
  },
  noResultsState: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
  },
  noResultsTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[600],
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
  },
  noResultsText: {
    ...Typography.textStyles.body,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
});