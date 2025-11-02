import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, MapPin, DollarSign, Star } from 'lucide-react-native';
import { useCommute } from '@/hooks/useCommute';
import { TransportModeSelector, TripStatus } from '@/components/commute';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';


export default function CommuteDriver() {
  const commute = useCommute();

  const [isAvailable, setIsAvailable] = useState(false);
  const [selectedTransportModes, setSelectedTransportModes] = useState<string[]>([]);
  const [pricePerKm, setPricePerKm] = useState(500); // CRC per km
  const [destinationMode, setDestinationMode] = useState(false);
  const [destination, setDestination] = useState('');

  console.log('🚗 CommuteDriver: Rendered with availability:', isAvailable);
  console.log('🚗 CommuteDriver: Active trips as driver:', (commute.activeTrips || []).filter(t => t.role === 'driver').length);

  const handleToggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      console.log('🚗 CommuteDriver: Toggling availability to:', newStatus);
      
      await commute.updateDriverStatus({
        isAvailable: newStatus,
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
      const trip = await commute.acceptRideRequest(requestId);
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

  const renderZoneManagement = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Gestión de Zonas</Text>
      <View style={styles.zoneCard}>
        <View style={styles.zoneHeader}>
          <MapPin size={24} color={Colors.primary[500]} />
          <View style={styles.zoneInfo}>
            <Text style={styles.zoneTitle}>Zonas de Servicio</Text>
            <Text style={styles.zoneSubtitle}>
              Administra las zonas donde ofreces servicio
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.manageZonesButton}
          onPress={() => {
            console.log('🗺️ Navegando a gestión de zonas');
            // TODO: Navegar a pantalla de gestión de zonas
          }}
        >
          <Text style={styles.manageZonesButtonText}>Gestionar Zonas de Servicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDestinationMode = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Modo Destino</Text>
      <View style={styles.destinationCard}>
        <View style={styles.destinationHeader}>
          <MapPin size={24} color={Colors.success[500]} />
          <View style={styles.destinationInfo}>
            <Text style={styles.destinationTitle}>Viaje con Destino</Text>
            <Text style={styles.destinationSubtitle}>
              Acepta solo pasajeros que vayan hacia tu destino
            </Text>
          </View>
        </View>
        
        <View style={styles.destinationInputContainer}>
          <Text style={styles.destinationInputLabel}>Destino</Text>
          <TextInput
            style={styles.destinationInput}
            placeholder="Ingresa tu destino"
            placeholderTextColor={Colors.neutral[400]}
            value={destination}
            onChangeText={setDestination}
            editable={!destinationMode}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.activateDestinationButton,
            destinationMode && styles.activateDestinationButtonActive,
            !destination && !destinationMode && styles.activateDestinationButtonDisabled
          ]}
          onPress={async () => {
            if (!destinationMode && !destination) return;
            
            try {
              const newMode = !destinationMode;
              console.log('🎯 Toggling destination mode:', newMode);
              
              if (newMode) {
                await commute.setDestination(destination);
              } else {
                await commute.clearDestination();
              }
              
              setDestinationMode(newMode);
              if (!newMode) {
                setDestination('');
              }
            } catch (error) {
              console.error('❌ Error toggling destination mode:', error);
            }
          }}
          disabled={!destination && !destinationMode}
        >
          <Text style={styles.activateDestinationButtonText}>
            {destinationMode ? 'Desactivar Modo Destino' : 'Activar Modo Destino'}
          </Text>
        </TouchableOpacity>

        {destinationMode && (
          <View style={styles.destinationActiveIndicator}>
            <View style={styles.destinationActiveDot} />
            <Text style={styles.destinationActiveText}>
              Modo Destino activo: {destination}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderTransportModes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vehículos Disponibles</Text>
      <TransportModeSelector
        transportModes={commute.transportModes || []}
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
          <View style={{ marginHorizontal: 24 }}>
            <View style={styles.pricingDisplay}>
              <Text style={styles.pricingAmount}>₡{pricePerKm}</Text>
              <Text style={styles.pricingUnit}>por km</Text>
            </View>
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
    const driverTrips = (commute.activeTrips || []).filter(trip => trip.role === 'driver');
    
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
        {renderZoneManagement()}
        {renderDestinationMode()}
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
  zoneCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  zoneInfo: {
    flex: 1,
  },
  zoneTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
  },
  zoneSubtitle: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    marginTop: Spacing[1],
  },
  manageZonesButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    alignItems: 'center',
  },
  manageZonesButtonText: {
    ...Typography.textStyles.button,
    color: 'white',
  },
  destinationCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  destinationInfo: {
    flex: 1,
  },
  destinationTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
  },
  destinationSubtitle: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    marginTop: Spacing[1],
  },
  destinationInputContainer: {
    marginBottom: Spacing[4],
  },
  destinationInputLabel: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
    marginBottom: Spacing[2],
    fontWeight: Typography.fontWeight.medium,
  },
  destinationInput: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
  },
  activateDestinationButton: {
    backgroundColor: Colors.success[500],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    alignItems: 'center',
  },
  activateDestinationButtonActive: {
    backgroundColor: Colors.error[500],
  },
  activateDestinationButtonDisabled: {
    backgroundColor: Colors.neutral[300],
    opacity: 0.6,
  },
  activateDestinationButtonText: {
    ...Typography.textStyles.button,
    color: 'white',
  },
  destinationActiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[4],
    backgroundColor: Colors.success[50],
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
  },
  destinationActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success[500],
  },
  destinationActiveText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.success[700],
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
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
    flexDirection: 'column',
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