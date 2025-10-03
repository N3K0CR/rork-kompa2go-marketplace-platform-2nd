import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack, router } from 'expo-router';
import { Plus, MapPin, Clock, Users, Car, Zap, Settings } from 'lucide-react-native';
import { useCommute } from '@/src/modules/commute/context/CommuteContext';
import { CommuteButton, CommuteModal, RouteCard } from '@/components/commute';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';
import type { Route } from '@/src/modules/commute/types/core-types';

export default function CommuteHome() {
  const {
    routes,
    transportModes,
    trips,
    createRoute,
    updateRoute,
    deleteRoute,
    startTrip,
  } = useCommute();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const activeTrips = trips.filter(trip => trip.status === 'in_progress' || trip.status === 'planned');

  console.log('🏠 CommuteHome: Rendered with', routes.length, 'routes');
  console.log('🏠 CommuteHome: Active trips:', activeTrips.length);
  console.log('🏠 CommuteHome: Transport modes:', transportModes.length);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Refreshing data...');
    } catch (error) {
      console.error('❌ CommuteHome: Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateRoute = async (routeData: Partial<Route>) => {
    try {
      console.log('➕ CommuteHome: Creating new route:', routeData.name);
      if (routeData.userId && routeData.name && routeData.points && routeData.transportModes) {
        await createRoute(routeData as Omit<Route, 'id' | 'createdAt' | 'updatedAt'>);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('❌ CommuteHome: Error creating route:', error);
    }
  };

  const handleEditRoute = async (routeData: Partial<Route>) => {
    if (!editingRoute) return;
    
    try {
      console.log('✏️ CommuteHome: Updating route:', editingRoute.id);
      await updateRoute(editingRoute.id, routeData);
      setEditingRoute(null);
    } catch (error) {
      console.error('❌ CommuteHome: Error updating route:', error);
    }
  };

  const handleStartTrip = async (route: Route) => {
    try {
      console.log('🚀 CommuteHome: Starting trip for route:', route.id);
      await startTrip(route.id);
      console.log('✅ Trip started successfully');
    } catch (error) {
      console.error('❌ CommuteHome: Error starting trip:', error);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    try {
      console.log('🗑️ CommuteHome: Deleting route:', routeId);
      await deleteRoute(routeId);
    } catch (error) {
      console.error('❌ CommuteHome: Error deleting route:', error);
    }
  };

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.actionButtons}>
        <CommuteButton
          title="Buscar Viaje"
          subtitle="Encuentra conductores"
          icon={<Users size={20} color="white" />}
          onPress={() => router.push('/commute/search')}
          variant="primary"
          size="medium"
        />
        
        <CommuteButton
          title="Ser Conductor"
          subtitle="Ofrece tu vehículo"
          icon={<Car size={20} color={Colors.primary[500]} />}
          onPress={() => router.push('/commute/driver')}
          variant="outline"
          size="medium"
        />
      </View>
      
      <View style={styles.validationSection}>
        <CommuteButton
          title="Validar Sistema"
          subtitle="Verificar estado de Kommute"
          icon={<Settings size={16} color={Colors.neutral[600]} />}
          onPress={() => router.push('/kommute-validation')}
          variant="ghost"
          size="small"
        />
      </View>
    </View>
  );

  const renderActiveTrips = () => {
    if (activeTrips.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Viajes Activos</Text>
        {activeTrips.map((trip) => {
          const route = routes.find(r => r.id === trip.routeId);
          return (
            <TouchableOpacity
              key={trip.id}
              style={styles.activeTripCard}
              onPress={() => router.push(`/commute/trip/${trip.id}`)}
            >
              <View style={styles.tripHeader}>
                <View style={styles.tripStatus}>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: trip.status === 'in_progress' ? Colors.success[500] : Colors.warning[500] }
                  ]} />
                  <Text style={styles.tripStatusText}>
                    {trip.status === 'in_progress' ? 'En Progreso' : 'Esperando'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.tripRouteName}>{route?.name || 'Ruta sin nombre'}</Text>
              
              <View style={styles.tripDetails}>
                <View style={styles.tripDetail}>
                  <Clock size={14} color={Colors.neutral[500]} />
                  <Text style={styles.tripDetailText}>
                    {trip.actualDuration ? `${Math.round(trip.actualDuration / 60000)} min` : 'Calculando...'}
                  </Text>
                </View>
                
                <View style={styles.tripDetail}>
                  <MapPin size={14} color={Colors.neutral[500]} />
                  <Text style={styles.tripDetailText}>
                    {trip.actualDistance ? `${(trip.actualDistance / 1000).toFixed(1)} km` : 'Calculando...'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderMyRoutes = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mis Rutas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color={Colors.primary[500]} />
          <Text style={styles.addButtonText}>Nueva</Text>
        </TouchableOpacity>
      </View>
      
      {routes.length === 0 ? (
        <View style={styles.emptyState}>
          <MapPin size={48} color={Colors.neutral[400]} />
          <Text style={styles.emptyStateTitle}>No tienes rutas guardadas</Text>
          <Text style={styles.emptyStateText}>
            Crea tu primera ruta para comenzar a usar Kommute
          </Text>
          <TouchableOpacity
            style={styles.createFirstRouteButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createFirstRouteButtonText}>Crear Primera Ruta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        routes.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            transportModes={transportModes}
            onEdit={() => setEditingRoute(route)}
            onDelete={() => handleDeleteRoute(route.id)}
            showActions
          />
        ))
      )}
    </View>
  );

  const renderStats = () => {
    const totalRoutes = routes.length;
    const totalTrips = activeTrips.length;
    const carbonSaved = routes.reduce((acc, route) => acc + (route.carbonFootprint || 0), 0);
    
    return (
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MapPin size={24} color={Colors.primary[500]} />
            <Text style={styles.statNumber}>{totalRoutes}</Text>
            <Text style={styles.statLabel}>Rutas</Text>
          </View>
          
          <View style={styles.statCard}>
            <Car size={24} color={Colors.success[500]} />
            <Text style={styles.statNumber}>{totalTrips}</Text>
            <Text style={styles.statLabel}>Viajes</Text>
          </View>
          
          <View style={styles.statCard}>
            <Zap size={24} color={Colors.success[600]} />
            <Text style={styles.statNumber}>{carbonSaved.toFixed(1)}</Text>
            <Text style={styles.statLabel}>kg CO₂ ahorrado</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: '2Kommute',
          headerStyle: { backgroundColor: Colors.primary[500] },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
          />
        }
      >
        {renderQuickActions()}
        {renderActiveTrips()}
        {renderMyRoutes()}
        {renderStats()}
      </ScrollView>

      <CommuteModal
        visible={showCreateModal || editingRoute !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingRoute(null);
        }}
        onSave={editingRoute ? handleEditRoute : handleCreateRoute}
        transportModes={transportModes}
        initialRoute={editingRoute}
        mode={editingRoute ? 'edit' : 'create'}
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
  quickActions: {
    padding: Spacing[5],
    backgroundColor: 'white',
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginBottom: Spacing[4],
    fontSize: 18,
    lineHeight: 26,
    fontWeight: Typography.fontWeight.bold,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing[4],
  },
  section: {
    padding: Spacing[5],
    backgroundColor: 'white',
    marginBottom: Spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[300],
  },
  addButtonText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing[8],
  },
  emptyStateTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[600],
    marginTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  emptyStateText: {
    ...Typography.textStyles.body,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginBottom: Spacing[6],
    paddingHorizontal: Spacing[4],
  },
  createFirstRouteButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
  },
  createFirstRouteButtonText: {
    ...Typography.textStyles.button,
    color: 'white',
  },
  activeTripCard: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
    ...Shadows.sm,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  tripStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tripStatusText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
  },
  tripRouteName: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginBottom: Spacing[3],
    fontSize: 16,
    lineHeight: 24,
  },
  tripDetails: {
    flexDirection: 'row',
    gap: Spacing[5],
  },
  tripDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  tripDetailText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    fontSize: 13,
    lineHeight: 18,
  },
  statsSection: {
    padding: Spacing[5],
    backgroundColor: 'white',
    marginBottom: Spacing[3],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing[4],
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[5],
    alignItems: 'center',
    gap: Spacing[3],
  },
  statNumber: {
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  statLabel: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
  validationSection: {
    marginTop: Spacing[3],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
});
