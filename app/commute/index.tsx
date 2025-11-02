import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, Search } from 'lucide-react-native';
import { useCurrentLocation } from '@/src/modules/commute/hooks/useCurrentLocation';

const LocationCard = ({ label, value, icon: Icon, isLoading, isError, onPress }: {
  label: string;
  value: string;
  icon: typeof MapPin | typeof Search;
  isLoading: boolean;
  isError: boolean;
  onPress: () => void;
}) => {
  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator />;
    }
    if (isError) {
      return <Text style={styles.locationError}>Activa los permisos de ubicación</Text>;
    }
    return <Text style={styles.locationValue} numberOfLines={1}>{value}</Text>;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Icon color="#333" size={24} style={styles.icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.locationLabel}>{label}</Text>
        {renderContent()}
      </View>
    </TouchableOpacity>
  );
};

const CommuteHomeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: currentAddress, isLoading, isError } = useCurrentLocation();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Text style={styles.title}>Planifica tu viaje</Text>
      <View style={styles.cardContainer}>
        <LocationCard 
          label="Desde"
          value={currentAddress || 'Buscando tu ubicación...'}
          icon={MapPin}
          isLoading={isLoading}
          isError={isError}
          onPress={() => {}}
        />
        <LocationCard 
          label="¿A dónde vas?"
          value="Toca para buscar tu destino"
          icon={Search}
          isLoading={false}
          isError={false}
          onPress={() => router.push('/commute/search')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, marginTop: 16 },
  cardContainer: { gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  icon: { marginRight: 12 },
  locationLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  locationValue: { fontSize: 16, fontWeight: '500', color: '#000' },
  locationError: { fontSize: 16, fontWeight: '500', color: 'orange' },
});

export default CommuteHomeScreen;
