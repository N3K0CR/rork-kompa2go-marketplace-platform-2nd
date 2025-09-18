import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Car, Users, Plus } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/context-package/design-system';
import { 
  MapView, 
  DriverCard, 
  TripStatus, 
  RouteCard, 
  TransportModeSelector,
  CommuteModal,
  CommuteButton,
  type CommuteRoute,
  type TransportMode,
  type Trip
} from '@/components/commute';

// Mock data for demonstration
const mockTransportModes: TransportMode[] = [
  {
    id: 'walking',
    name: 'Caminar',
    icon: '🚶',
    color: Colors.success[500],
    carbonFactor: 0,
    costFactor: 0,
    speedFactor: 0.3,
    available: true
  },
  {
    id: 'cycling',
    name: 'Bicicleta',
    icon: '🚴',
    color: Colors.primary[500],
    carbonFactor: 0,
    costFactor: 0.1,
    speedFactor: 0.8,
    available: true
  },
  {
    id: 'driving',
    name: 'Automóvil',
    icon: '🚗',
    color: Colors.warning[500],
    carbonFactor: 1.0,
    costFactor: 1.5,
    speedFactor: 2.0,
    available: true
  },
  {
    id: 'public_transport',
    name: 'Transporte Público',
    icon: '🚌',
    color: Colors.secondary[500],
    carbonFactor: 0.3,
    costFactor: 0.5,
    speedFactor: 1.2,
    available: true
  }
];

const mockRoutes: CommuteRoute[] = [
  {
    id: 'route_1',
    userId: 'user_1',
    name: 'Casa al Trabajo',
    points: [
      {
        id: 'point_1',
        latitude: 9.9281,
        longitude: -84.0907,
        address: 'San José Centro, Costa Rica',
        name: 'Casa',
        type: 'origin'
      },
      {
        id: 'point_2',
        latitude: 9.9350,
        longitude: -84.0850,
        address: 'Oficina Central, San José',
        name: 'Trabajo',
        type: 'destination'
      }
    ],
    transportModes: [mockTransportModes[2], mockTransportModes[3]],
    distance: 5000,
    duration: 25,
    estimatedCost: 1500,
    carbonFootprint: 2.5,
    status: 'active',
    isRecurring: true,
    recurringPattern: {
      type: 'weekly',
      daysOfWeek: [1, 2, 3, 4, 5],
      startDate: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockTrip: Trip = {
  id: 'trip_1',
  routeId: 'route_1',
  userId: 'user_1',
  startTime: new Date(Date.now() - 600000), // 10 minutes ago
  status: 'in_progress',
  trackingPoints: [],
  actualDuration: 10,
  actualDistance: 2000,
  actualCost: 800
};

const mockDriver = {
  id: 'driver_1',
  name: 'Carlos Rodríguez',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  rating: 4.8,
  reviewCount: 127,
  vehicle: {
    make: 'Toyota',
    model: 'Corolla',
    color: 'Blanco',
    licensePlate: 'SJO-123'
  },
  location: {
    latitude: 9.9281,
    longitude: -84.0907,
    address: 'Avenida Central, San José'
  },
  estimatedArrival: new Date(Date.now() + 300000), // 5 minutes from now
  availableSeats: 3,
  isVerified: true
};

export default function CommuteComponentsDemo() {
  const [selectedRoute, setSelectedRoute] = useState<CommuteRoute | null>(null);
  const [selectedTransportModes, setSelectedTransportModes] = useState<string[]>(['driving']);
  const [showModal, setShowModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>2Kommute Components</Text>
          <Text style={styles.subtitle}>Demostración de componentes UI</Text>
        </View>

        {/* CommuteButton Examples */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Botones de Transporte</Text>
          
          <CommuteButton
            title="Buscar Conductor"
            subtitle="Encuentra conductores cercanos"
            icon={<Car size={20} color="white" />}
            onPress={() => console.log('Buscar conductor')}
            showStats
            stats={{
              duration: 15,
              distance: 3500,
              cost: 1200,
              participants: 2
            }}
          />
          
          <CommuteButton
            title="Ofrecer Viaje"
            subtitle="Comparte tu ruta"
            variant="outline"
            icon={<Users size={20} color={Colors.primary[500]} />}
            onPress={() => console.log('Ofrecer viaje')}
            badge="3"
          />
          
          <CommuteButton
            title="Crear Nueva Ruta"
            variant="secondary"
            icon={<Plus size={20} color={Colors.primary[500]} />}
            onPress={() => setShowModal(true)}
          />
        </View>

        {/* MapView */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vista de Mapa</Text>
          <View style={styles.mapContainer}>
            <MapView
              routes={mockRoutes}
              selectedRoute={selectedRoute}
              onRouteSelect={setSelectedRoute}
              transportModes={mockTransportModes}
              userLocation={{ latitude: 9.9281, longitude: -84.0907 }}
              isLoading={false}
            />
          </View>
        </View>

        {/* DriverCard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarjetas de Conductor</Text>
          
          <DriverCard
            driver={mockDriver}
            onSelect={setSelectedDriver}
            onMessage={(driver) => console.log('Message driver:', driver.id)}
            onViewLocation={(driver) => console.log('View location:', driver.id)}
            isSelected={selectedDriver?.id === mockDriver.id}
          />
          
          <DriverCard
            driver={{
              ...mockDriver,
              id: 'driver_2',
              name: 'María González',
              rating: 4.9,
              reviewCount: 89,
              availableSeats: 2,
              vehicle: {
                make: 'Honda',
                model: 'Civic',
                color: 'Azul',
                licensePlate: 'SJO-456'
              }
            }}
            compact
            onSelect={setSelectedDriver}
          />
        </View>

        {/* RouteCard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarjetas de Ruta</Text>
          
          <RouteCard
            route={mockRoutes[0]}
            transportModes={mockTransportModes}
            onSelect={(route) => console.log('Route selected:', route.id)}
            onEdit={(route) => console.log('Edit route:', route.id)}
            isSelected={selectedRoute?.id === mockRoutes[0].id}
          />
          
          <RouteCard
            route={{
              ...mockRoutes[0],
              id: 'route_2',
              name: 'Ruta al Gimnasio',
              status: 'planned',
              isRecurring: false
            }}
            transportModes={mockTransportModes}
            compact
            onSelect={(route) => console.log('Route selected:', route.id)}
          />
        </View>

        {/* TripStatus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado del Viaje</Text>
          
          <TripStatus
            trip={mockTrip}
            userRole="driver"
            onStart={(trip) => console.log('Start trip:', trip.id)}
            onPause={(trip) => console.log('Pause trip:', trip.id)}
            onComplete={(trip) => console.log('Complete trip:', trip.id)}
            onEmergency={(trip) => console.log('Emergency:', trip.id)}
            onContactPassenger={(trip) => console.log('Contact passenger:', trip.id)}
          />
          
          <TripStatus
            trip={{
              ...mockTrip,
              id: 'trip_2',
              status: 'planned'
            }}
            userRole="passenger"
            compact
            onContactDriver={(trip) => console.log('Contact driver:', trip.id)}
          />
        </View>

        {/* TransportModeSelector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selector de Transporte</Text>
          
          <TransportModeSelector
            transportModes={mockTransportModes}
            selectedModes={selectedTransportModes}
            onSelectionChange={setSelectedTransportModes}
            maxSelection={3}
            horizontal
            compact
          />
        </View>
      </ScrollView>

      {/* CommuteModal */}
      <CommuteModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={(routeData) => {
          console.log('Save route:', routeData);
          setShowModal(false);
        }}
        transportModes={mockTransportModes}
        mode="create"
      />
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
  header: {
    backgroundColor: 'white',
    padding: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  title: {
    ...Typography.textStyles.h2,
    color: Colors.neutral[800],
    marginBottom: Spacing[2],
  },
  subtitle: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
  },
  section: {
    padding: Spacing[4],
    marginBottom: Spacing[2],
  },
  sectionTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginBottom: Spacing[4],
  },
  mapContainer: {
    height: 300,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});