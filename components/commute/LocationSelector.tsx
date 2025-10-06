import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MapPin, Edit3, Map, Plus, X, Navigation } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/context-package/design-system';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

interface LocationSelectorProps {
  label: string;
  value: LocationPoint | null;
  placeholder: string;
  onLocationSelect: (location: LocationPoint) => void;
  onUseCurrentLocation?: () => void;
  loadingLocation?: boolean;
  iconColor?: string;
  editable?: boolean;
}

export function LocationSelector({
  label,
  value,
  placeholder,
  onLocationSelect,
  onUseCurrentLocation,
  loadingLocation = false,
  iconColor = Colors.success[500],
  editable = true,
}: LocationSelectorProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedAddress, setEditedAddress] = useState('');
  const [editedLat, setEditedLat] = useState('');
  const [editedLon, setEditedLon] = useState('');

  const handleOpenEdit = () => {
    if (value) {
      setEditedAddress(value.address);
      setEditedLat(value.latitude.toString());
      setEditedLon(value.longitude.toString());
    } else {
      setEditedAddress('');
      setEditedLat('');
      setEditedLon('');
    }
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    const lat = parseFloat(editedLat);
    const lon = parseFloat(editedLon);

    if (isNaN(lat) || isNaN(lon)) {
      alert('Por favor ingresa coordenadas válidas');
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert('Las coordenadas están fuera de rango');
      return;
    }

    onLocationSelect({
      latitude: lat,
      longitude: lon,
      address: editedAddress || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    });

    setShowEditModal(false);
  };

  const handleOpenMap = () => {
    const lat = value?.latitude || 9.9281;
    const lon = value?.longitude || -84.0907;
    
    if (Platform.OS === 'web') {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
        '_blank'
      );
    } else {
      const url = Platform.select({
        ios: `maps:0,0?q=${lat},${lon}`,
        android: `geo:0,0?q=${lat},${lon}`,
      });
      if (url) {
        alert('Abriendo Google Maps...');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MapPin size={20} color={iconColor} />
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.addressText} numberOfLines={2}>
          {value?.address || placeholder}
        </Text>

        <View style={styles.actions}>
          {editable && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleOpenEdit}
                activeOpacity={0.7}
              >
                <Edit3 size={18} color={Colors.primary[600]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleOpenMap}
                activeOpacity={0.7}
              >
                <Map size={18} color={Colors.primary[600]} />
              </TouchableOpacity>
            </>
          )}

          {onUseCurrentLocation && (
            <TouchableOpacity
              style={[styles.actionButton, loadingLocation && styles.actionButtonDisabled]}
              onPress={onUseCurrentLocation}
              disabled={loadingLocation}
              activeOpacity={0.7}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color={Colors.primary[600]} />
              ) : (
                <Navigation size={18} color={Colors.primary[600]} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Ubicación</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color={Colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Dirección</Text>
              <TextInput
                style={styles.input}
                value={editedAddress}
                onChangeText={setEditedAddress}
                placeholder="Ingresa la dirección"
                placeholderTextColor={Colors.neutral[400]}
                multiline
              />

              <Text style={styles.inputLabel}>Latitud</Text>
              <TextInput
                style={styles.input}
                value={editedLat}
                onChangeText={setEditedLat}
                placeholder="Ej: 9.9281"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Longitud</Text>
              <TextInput
                style={styles.input}
                value={editedLon}
                onChangeText={setEditedLon}
                placeholder="Ej: -84.0907"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="numeric"
              />

              <Text style={styles.helpText}>
                Puedes obtener las coordenadas desde Google Maps haciendo clic derecho en el mapa
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.buttonPrimaryText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface StopPoint extends LocationPoint {
  id: string;
}

interface MultiStopSelectorProps {
  origin: LocationPoint | null;
  destination: LocationPoint | null;
  stops: StopPoint[];
  onOriginChange: (location: LocationPoint) => void;
  onDestinationChange: (location: LocationPoint) => void;
  onStopsChange: (stops: StopPoint[]) => void;
  maxStops?: number;
}

export function MultiStopSelector({
  origin,
  destination,
  stops,
  onOriginChange,
  onDestinationChange,
  onStopsChange,
  maxStops = 3,
}: MultiStopSelectorProps) {
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [newStopAddress, setNewStopAddress] = useState('');
  const [newStopLat, setNewStopLat] = useState('');
  const [newStopLon, setNewStopLon] = useState('');

  const handleAddStop = () => {
    const lat = parseFloat(newStopLat);
    const lon = parseFloat(newStopLon);

    if (isNaN(lat) || isNaN(lon)) {
      alert('Por favor ingresa coordenadas válidas');
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert('Las coordenadas están fuera de rango');
      return;
    }

    const newStop: StopPoint = {
      id: `stop_${Date.now()}`,
      latitude: lat,
      longitude: lon,
      address: newStopAddress || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    };

    onStopsChange([...stops, newStop]);
    setNewStopAddress('');
    setNewStopLat('');
    setNewStopLon('');
    setShowAddStopModal(false);
  };

  const handleRemoveStop = (stopId: string) => {
    onStopsChange(stops.filter((s) => s.id !== stopId));
  };

  return (
    <View style={styles.multiStopContainer}>
      <LocationSelector
        label="Origen"
        value={origin}
        placeholder="Punto de partida"
        onLocationSelect={onOriginChange}
        iconColor={Colors.success[500]}
      />

      {stops.map((stop, index) => (
        <View key={stop.id} style={styles.stopContainer}>
          <View style={styles.stopLine} />
          <View style={styles.stopContent}>
            <LocationSelector
              label={`Parada ${index + 1}`}
              value={stop}
              placeholder={`Parada ${index + 1}`}
              onLocationSelect={(location) => {
                const updatedStops = [...stops];
                updatedStops[index] = { ...location, id: stop.id };
                onStopsChange(updatedStops);
              }}
              iconColor={Colors.warning[500]}
            />
            <TouchableOpacity
              style={styles.removeStopButton}
              onPress={() => handleRemoveStop(stop.id)}
            >
              <X size={20} color={Colors.error[500]} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {stops.length < maxStops && (
        <TouchableOpacity
          style={styles.addStopButton}
          onPress={() => setShowAddStopModal(true)}
        >
          <Plus size={20} color={Colors.primary[600]} />
          <Text style={styles.addStopText}>Agregar parada</Text>
        </TouchableOpacity>
      )}

      <View style={styles.stopLine} />

      <LocationSelector
        label="Destino"
        value={destination}
        placeholder="Punto de llegada"
        onLocationSelect={onDestinationChange}
        iconColor={Colors.error[500]}
      />

      <Modal
        visible={showAddStopModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddStopModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Parada</Text>
              <TouchableOpacity onPress={() => setShowAddStopModal(false)}>
                <X size={24} color={Colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Dirección</Text>
              <TextInput
                style={styles.input}
                value={newStopAddress}
                onChangeText={setNewStopAddress}
                placeholder="Ingresa la dirección de la parada"
                placeholderTextColor={Colors.neutral[400]}
                multiline
              />

              <Text style={styles.inputLabel}>Latitud</Text>
              <TextInput
                style={styles.input}
                value={newStopLat}
                onChangeText={setNewStopLat}
                placeholder="Ej: 9.9281"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Longitud</Text>
              <TextInput
                style={styles.input}
                value={newStopLon}
                onChangeText={setNewStopLon}
                placeholder="Ej: -84.0907"
                placeholderTextColor={Colors.neutral[400]}
                keyboardType="numeric"
              />

              <Text style={styles.helpText}>
                Puedes obtener las coordenadas desde Google Maps
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setShowAddStopModal(false)}
              >
                <Text style={styles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleAddStop}
              >
                <Text style={styles.buttonPrimaryText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  label: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.semibold,
  },
  inputContainer: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  addressText: {
    flex: 1,
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  actionButton: {
    padding: Spacing[2],
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary[50],
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  modalTitle: {
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
    fontWeight: Typography.fontWeight.bold,
  },
  modalBody: {
    padding: Spacing[5],
  },
  inputLabel: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[2],
    marginTop: Spacing[3],
  },
  input: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    padding: Spacing[4],
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    fontSize: 15,
  },
  helpText: {
    ...Typography.textStyles.caption,
    color: Colors.neutral[500],
    marginTop: Spacing[3],
    fontStyle: 'italic' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing[3],
    padding: Spacing[5],
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  button: {
    flex: 1,
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary[500],
  },
  buttonPrimaryText: {
    ...Typography.textStyles.body,
    color: 'white',
    fontWeight: Typography.fontWeight.bold,
  },
  buttonSecondary: {
    backgroundColor: Colors.neutral[100],
  },
  buttonSecondaryText: {
    ...Typography.textStyles.body,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.semibold,
  },
  multiStopContainer: {
    gap: Spacing[3],
  },
  stopContainer: {
    position: 'relative',
  },
  stopLine: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.neutral[300],
  },
  stopContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
  },
  removeStopButton: {
    padding: Spacing[2],
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.error[50],
    marginTop: Spacing[8],
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    padding: Spacing[4],
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary[300],
    borderStyle: 'dashed',
    backgroundColor: Colors.primary[50],
  },
  addStopText: {
    ...Typography.textStyles.body,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.semibold,
  },
});
