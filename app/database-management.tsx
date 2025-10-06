import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabaseContext } from '@/contexts/DatabaseContext';

export default function DatabaseManagementScreen() {
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  
  const context = useDatabaseContext();
  
  if (!context) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Base de Datos No Disponible</Text>
          <Text style={styles.errorText}>
            El proveedor de base de datos está deshabilitado. Por favor, habilita DatabaseProvider en app/_layout.tsx
          </Text>
        </View>
      </View>
    );
  }
  
  const { 
    isInitialized, 
    isLoading, 
    error, 
    seedData,
    getAllServices,
    getTopRatedProviders
  } = context;

  const handleSeedDatabase = async () => {
    try {
      await seedData();
      Alert.alert('Éxito', 'Base de datos poblada correctamente');
    } catch (err) {
      Alert.alert('Error', 'Error al poblar la base de datos');
      console.error('Seed error:', err);
    }
  };

  const handleLoadServices = async () => {
    try {
      setLoadingServices(true);
      const allServices = await getAllServices();
      setServices(allServices);
      Alert.alert('Éxito', `Se cargaron ${allServices.length} servicios`);
    } catch (err) {
      Alert.alert('Error', 'Error al cargar servicios');
      console.error('Load services error:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleLoadProviders = async () => {
    try {
      setLoadingProviders(true);
      const topProviders = await getTopRatedProviders(5);
      setProviders(topProviders);
      Alert.alert('Éxito', `Se cargaron ${topProviders.length} proveedores`);
    } catch (err) {
      Alert.alert('Error', 'Error al cargar proveedores');
      console.error('Load providers error:', err);
    } finally {
      setLoadingProviders(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Inicializando base de datos...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error de Base de Datos</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Gestión de Base de Datos</Text>
          <Text style={styles.subtitle}>
            Estado: {isInitialized ? '✅ Inicializada' : '❌ No inicializada'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSeedDatabase}
          >
            <Text style={styles.buttonText}>Poblar Base de Datos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLoadServices}
            disabled={loadingServices}
          >
            {loadingServices ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Cargar Servicios</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLoadProviders}
            disabled={loadingProviders}
          >
            {loadingProviders ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Cargar Proveedores</Text>
            )}
          </TouchableOpacity>
        </View>

        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Servicios ({services.length})</Text>
            {services.map((service, index) => (
              <View key={service.id || index} style={styles.item}>
                <Text style={styles.itemTitle}>{service.name}</Text>
                <Text style={styles.itemSubtitle}>{service.category}</Text>
                <Text style={styles.itemPrice}>₡{service.price?.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {providers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proveedores ({providers.length})</Text>
            {providers.map((provider, index) => (
              <View key={provider.id || index} style={styles.item}>
                <Text style={styles.itemTitle}>{provider.businessName || 'Sin nombre'}</Text>
                <Text style={styles.itemSubtitle}>{provider.location}</Text>
                <Text style={styles.itemRating}>⭐ {provider.rating?.toFixed(1) || '0.0'}</Text>
              </View>
            ))}
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  itemRating: {
    fontSize: 14,
    color: '#ff9800',
    fontWeight: '600',
  },
});