import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Users, Car, Briefcase, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react-native';
import { useAdmin } from '@/contexts/AdminContext';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { metrics, isLoading, error, refreshMetrics } = useAdmin();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshMetrics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString('es-CR')}`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Dashboard Admin', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando métricas...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Dashboard Admin', headerShown: true }} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {metrics && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Usuarios</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Users size={24} color="#007AFF" />
                  <Text style={styles.statValue}>{metrics.totalUsers}</Text>
                  <Text style={styles.statLabel}>Total Usuarios</Text>
                </View>
                <View style={styles.statCard}>
                  <Car size={24} color="#34C759" />
                  <Text style={styles.statValue}>{metrics.totalKommuters}</Text>
                  <Text style={styles.statLabel}>Kommuters</Text>
                </View>
                <View style={styles.statCard}>
                  <Briefcase size={24} color="#FF9500" />
                  <Text style={styles.statValue}>{metrics.totalProviders}</Text>
                  <Text style={styles.statLabel}>Proveedores</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Viajes</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <TrendingUp size={24} color="#FF3B30" />
                  <Text style={styles.statValue}>{metrics.activeTrips}</Text>
                  <Text style={styles.statLabel}>Activos</Text>
                </View>
                <View style={styles.statCard}>
                  <CheckCircle size={24} color="#34C759" />
                  <Text style={styles.statValue}>{metrics.completedTripsToday}</Text>
                  <Text style={styles.statLabel}>Completados Hoy</Text>
                </View>
                <View style={styles.statCard}>
                  <DollarSign size={24} color="#5856D6" />
                  <Text style={styles.statValue}>
                    {formatCurrency(metrics.averageTripPrice)}
                  </Text>
                  <Text style={styles.statLabel}>Precio Promedio</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingresos</Text>
              <View style={styles.revenueCard}>
                <View style={styles.revenueItem}>
                  <Text style={styles.revenueLabel}>Hoy</Text>
                  <Text style={styles.revenueValue}>
                    {formatCurrency(metrics.totalRevenueToday)}
                  </Text>
                </View>
                <View style={styles.revenueDivider} />
                <View style={styles.revenueItem}>
                  <Text style={styles.revenueLabel}>Últimos 30 días</Text>
                  <Text style={styles.revenueValue}>
                    {formatCurrency(metrics.totalRevenue30Days)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pendientes</Text>
              <View style={styles.statsGrid}>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => router.push('/admin/recharge-approvals')}
                >
                  <Clock size={24} color="#FF9500" />
                  <Text style={styles.actionValue}>{metrics.pendingRecharges}</Text>
                  <Text style={styles.actionLabel}>Recargas</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => router.push('/admin/payment-distributions')}
                >
                  <DollarSign size={24} color="#34C759" />
                  <Text style={styles.actionValue}>{metrics.pendingDistributions}</Text>
                  <Text style={styles.actionLabel}>Distribuciones</Text>
                </TouchableOpacity>
              </View>
            </View>

            {metrics.topKommuters.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Top Kommuters</Text>
                {metrics.topKommuters.map((kommuter, index) => (
                  <View key={kommuter.id} style={styles.kommuterCard}>
                    <View style={styles.kommuterRank}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.kommuterInfo}>
                      <Text style={styles.kommuterName}>{kommuter.name}</Text>
                      <Text style={styles.kommuterStats}>
                        {kommuter.tripsCompleted} viajes • {formatCurrency(kommuter.earnings)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93'
  },
  scrollView: {
    flex: 1
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 12
  },
  errorText: {
    color: '#C62828',
    fontSize: 14
  },
  section: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 8
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center'
  },
  revenueCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  revenueItem: {
    flex: 1,
    alignItems: 'center'
  },
  revenueLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8
  },
  revenueValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759'
  },
  revenueDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  actionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF3B30',
    marginTop: 8
  },
  actionLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center'
  },
  kommuterCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  kommuterRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF'
  },
  kommuterInfo: {
    flex: 1
  },
  kommuterName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000'
  },
  kommuterStats: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4
  }
});
