// ============================================================================
// TRIP CHAINING DEMO SCREEN
// ============================================================================
// Demo screen showcasing the trip chaining system functionality

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { 
  Car, 
  MapPin, 
  Clock, 
  Users, 
  Zap, 
  TrendingUp,
  RefreshCw,
  Plus
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { DriverDashboard } from '@/components/commute/DriverDashboard';
import { TripChainingStatus } from '@/components/commute/TripChainingStatus';

export default function TripChainingDemoScreen() {
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 9.9281,
    longitude: -84.0907, // San José, Costa Rica
  });
  const [currentTripId] = useState<string | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const [demoMode, setDemoMode] = useState<'driver' | 'passenger'>('driver');
  const insets = useSafeAreaInsets();

  // Queries
  const tripChainingStatsQuery = trpc.commute.getTripChainingStats.useQuery();
  const driverChainsQuery = trpc.commute.getDriverChains.useQuery();
  
  // Mutations
  const createTripChainMutation = trpc.commute.createTripChain.useMutation();
  const addTripToQueueMutation = trpc.commute.addTripToQueue.useMutation();
  const updateTripMutation = trpc.commute.updateTrip.useMutation();

  // Simulate location updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLocation(prev => ({
        latitude: prev.latitude + (Math.random() - 0.5) * 0.001,
        longitude: prev.longitude + (Math.random() - 0.5) * 0.001,
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        tripChainingStatsQuery.refetch(),
        driverChainsQuery.refetch(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateDemoChain = async () => {
    try {
      // Create a demo trip chain
      const chainResult = await createTripChainMutation.mutateAsync({
        driverId: 'demo-driver',
        initialTripId: 'demo-trip-1',
      });

      console.log('Demo chain created:', chainResult);
      
      // Refresh data
      await handleRefresh();
    } catch (error) {
      console.error('Error creating demo chain:', error);
    }
  };

  const handleAddDemoTrip = async () => {
    try {
      // Add a demo trip to the queue
      const queueResult = await addTripToQueueMutation.mutateAsync({
        tripId: `demo-trip-${Date.now()}`,
        routeId: 'demo-route-1',
        requestedTime: new Date(),
        pickupLocation: {
          latitude: currentLocation.latitude + 0.01,
          longitude: currentLocation.longitude + 0.01,
          address: 'Centro Comercial San Pedro',
        },
        dropoffLocation: {
          latitude: currentLocation.latitude - 0.01,
          longitude: currentLocation.longitude - 0.01,
          address: 'Aeropuerto Juan Santamaría',
        },
        priority: Math.floor(Math.random() * 10) + 1,
        maxWaitTime: 300,
        proximityRadius: 2000,
      });

      console.log('Demo trip added to queue:', queueResult);
      
      // Refresh data
      await handleRefresh();
    } catch (error) {
      console.error('Error adding demo trip:', error);
    }
  };

  const handleSimulateCompletingTrip = async () => {
    if (!currentTripId) return;

    try {
      // Update trip to completing status
      await updateTripMutation.mutateAsync({
        tripId: currentTripId,
        status: 'completing',
        canAcceptNextTrip: true,
        estimatedCompletionTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      });

      console.log('Trip updated to completing status');
      
      // Refresh data
      await handleRefresh();
    } catch (error) {
      console.error('Error updating trip:', error);
    }
  };

  const renderStatsCards = () => {
    const stats = tripChainingStatsQuery.data;
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Users size={20} color="#2196F3" />
          </View>
          <Text style={styles.statValue}>{stats.activeChains}</Text>
          <Text style={styles.statLabel}>Cadenas Activas</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Clock size={20} color="#FF9800" />
          </View>
          <Text style={styles.statValue}>{stats.totalQueued}</Text>
          <Text style={styles.statLabel}>En Cola</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Zap size={20} color="#4CAF50" />
          </View>
          <Text style={styles.statValue}>{stats.totalMatched}</Text>
          <Text style={styles.statLabel}>Emparejados</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <TrendingUp size={20} color="#9C27B0" />
          </View>
          <Text style={styles.statValue}>{stats.totalExpired}</Text>
          <Text style={styles.statLabel}>Expirados</Text>
        </View>
      </View>
    );
  };

  const renderDemoControls = () => {
    return (
      <View style={styles.demoControls}>
        <Text style={styles.demoTitle}>Controles de Demo</Text>
        
        <View style={styles.demoButtonsRow}>
          <TouchableOpacity
            style={[styles.demoButton, styles.primaryButton]}
            onPress={handleCreateDemoChain}
            disabled={createTripChainMutation.isPending}
          >
            <Plus size={16} color="#fff" />
            <Text style={styles.demoButtonText}>Crear Cadena</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.demoButton, styles.secondaryButton]}
            onPress={handleAddDemoTrip}
            disabled={addTripToQueueMutation.isPending}
          >
            <MapPin size={16} color="#2196F3" />
            <Text style={[styles.demoButtonText, { color: '#2196F3' }]}>Agregar Viaje</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.demoButton, styles.warningButton]}
          onPress={handleSimulateCompletingTrip}
          disabled={!currentTripId || updateTripMutation.isPending}
        >
          <Clock size={16} color="#FF9800" />
          <Text style={[styles.demoButtonText, { color: '#FF9800' }]}>
            Simular Finalización
          </Text>
        </TouchableOpacity>

        <View style={styles.modeSelector}>
          <Text style={styles.modeSelectorLabel}>Modo de Vista:</Text>
          <View style={styles.modeSelectorButtons}>
            <TouchableOpacity
              style={[
                styles.modeSelectorButton,
                demoMode === 'driver' && styles.modeSelectorButtonActive
              ]}
              onPress={() => setDemoMode('driver')}
            >
              <Car size={14} color={demoMode === 'driver' ? '#fff' : '#666'} />
              <Text style={[
                styles.modeSelectorButtonText,
                demoMode === 'driver' && styles.modeSelectorButtonTextActive
              ]}>
                Conductor
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modeSelectorButton,
                demoMode === 'passenger' && styles.modeSelectorButtonActive
              ]}
              onPress={() => setDemoMode('passenger')}
            >
              <Users size={14} color={demoMode === 'passenger' ? '#fff' : '#666'} />
              <Text style={[
                styles.modeSelectorButtonText,
                demoMode === 'passenger' && styles.modeSelectorButtonTextActive
              ]}>
                Pasajero
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderTripChainingExamples = () => {
    return (
      <View style={styles.examplesSection}>
        <Text style={styles.sectionTitle}>Estados de Trip Chaining</Text>
        
        <TripChainingStatus
          status="in_progress"
          chainPosition={1}
          totalTripsInChain={3}
          testID="example-in-progress"
        />
        
        <TripChainingStatus
          status="completing"
          canAcceptNextTrip={true}
          estimatedCompletionTime={new Date(Date.now() + 5 * 60 * 1000)}
          nearbyTripsCount={3}
          chainPosition={2}
          totalTripsInChain={3}
          testID="example-completing"
        />
        
        <TripChainingStatus
          status="completing"
          canAcceptNextTrip={true}
          nextTripId="trip_abc123"
          estimatedCompletionTime={new Date(Date.now() + 2 * 60 * 1000)}
          chainPosition={2}
          totalTripsInChain={3}
          testID="example-next-accepted"
        />
        
        <TripChainingStatus
          status="completed"
          nextTripId="trip_def456"
          chainPosition={3}
          totalTripsInChain={3}
          testID="example-completed-chain"
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{ 
          title: 'Trip Chaining Demo',
          headerRight: () => (
            <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
              <RefreshCw 
                size={20} 
                color={refreshing ? '#ccc' : '#2196F3'} 
                style={refreshing ? { transform: [{ rotate: '180deg' }] } : undefined}
              />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView
        style={styles.scrollView}
        testID="trip-chaining-demo-scroll"
      >
        {/* Stats Overview */}
        {renderStatsCards()}

        {/* Demo Controls */}
        {renderDemoControls()}

        {/* Trip Chaining Status Examples */}
        {renderTripChainingExamples()}

        {/* Driver Dashboard */}
        {demoMode === 'driver' && (
          <View style={styles.dashboardSection}>
            <Text style={styles.sectionTitle}>Dashboard del Conductor</Text>
            <DriverDashboard
              currentTripId={currentTripId}
              currentLocation={currentLocation}
            />
          </View>
        )}

        {/* Current Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>Ubicación Actual (Demo)</Text>
          <Text style={styles.locationText}>
            Lat: {currentLocation.latitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Lng: {currentLocation.longitude.toFixed(6)}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  demoControls: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  warningButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF9800',
    marginBottom: 16,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  modeSelector: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  modeSelectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  modeSelectorButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  modeSelectorButtonActive: {
    backgroundColor: '#2196F3',
  },
  modeSelectorButtonText: {
    fontSize: 12,
    color: '#666',
  },
  modeSelectorButtonTextActive: {
    color: '#fff',
  },
  examplesSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  locationInfo: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});