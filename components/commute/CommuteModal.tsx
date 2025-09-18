import React, { useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { X, MapPin, Plus, Minus, Clock, Users, DollarSign, Calendar } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/context-package/design-system';
import { Route, TransportMode, RoutePoint } from '@/backend/trpc/routes/commute/types';
import TransportModeSelector from './TransportModeSelector';

interface CommuteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (routeData: Partial<Route>) => void;
  transportModes: TransportMode[];
  initialRoute?: Route | null;
  mode: 'create' | 'edit';
}

const CommuteModal = memo<CommuteModalProps>(function CommuteModal({
  visible,
  onClose,
  onSave,
  transportModes,
  initialRoute,
  mode = 'create'
}) {
  const [routeName, setRouteName] = useState(initialRoute?.name || '');
  const [selectedTransportModes, setSelectedTransportModes] = useState<string[]>(
    initialRoute?.transportModes?.map(m => m.id) || []
  );
  const [routePoints, setRoutePoints] = useState<Omit<RoutePoint, 'id'>[]>(
    initialRoute?.points?.map(p => ({
      latitude: p.latitude,
      longitude: p.longitude,
      address: p.address,
      name: p.name,
      type: p.type,
      estimatedArrival: p.estimatedArrival,
      actualArrival: p.actualArrival
    })) || [
      {
        latitude: 0,
        longitude: 0,
        address: '',
        type: 'origin' as const
      },
      {
        latitude: 0,
        longitude: 0,
        address: '',
        type: 'destination' as const
      }
    ]
  );
  const [isRecurring, setIsRecurring] = useState(initialRoute?.isRecurring || false);
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const handleSave = useCallback(() => {
    if (!routeName.trim()) {
      console.log('❌ CommuteModal: Route name is required');
      return;
    }

    if (selectedTransportModes.length === 0) {
      console.log('❌ CommuteModal: At least one transport mode is required');
      return;
    }

    if (routePoints.length < 2) {
      console.log('❌ CommuteModal: At least origin and destination are required');
      return;
    }

    const routeData: Partial<Route> = {
      name: routeName.trim(),
      points: routePoints.map((point, index) => ({
        ...point,
        id: `point_${index}_${Date.now()}`
      })),
      transportModes: transportModes.filter(mode => selectedTransportModes.includes(mode.id)),
      isRecurring,
      recurringPattern: isRecurring ? {
        type: recurringType,
        startDate: new Date(),
        daysOfWeek: recurringType === 'weekly' ? [1, 2, 3, 4, 5] : undefined
      } : undefined,
      status: 'planned'
    };

    console.log('💾 CommuteModal: Saving route:', routeData);
    onSave(routeData);
    onClose();
  }, [routeName, selectedTransportModes, routePoints, isRecurring, recurringType, transportModes, onSave, onClose]);

  const handleAddPoint = useCallback(() => {
    const newPoint: Omit<RoutePoint, 'id'> = {
      latitude: 0,
      longitude: 0,
      address: '',
      type: 'waypoint'
    };
    setRoutePoints(prev => [...prev, newPoint]);
  }, []);

  const handleRemovePoint = useCallback((index: number) => {
    if (routePoints.length <= 2) return; // Keep at least origin and destination
    setRoutePoints(prev => prev.filter((_, i) => i !== index));
  }, [routePoints.length]);

  const handlePointChange = useCallback((index: number, field: keyof Omit<RoutePoint, 'id'>, value: any) => {
    setRoutePoints(prev => {
      const newPoints = [...prev];
      (newPoints[index] as any)[field] = value;
      return newPoints;
    });
  }, []);

  const renderPointEditor = useCallback((point: Omit<RoutePoint, 'id'>, index: number) => {
    const isOrigin = point.type === 'origin';
    const isDestination = point.type === 'destination';
    const canRemove = routePoints.length > 2 && !isOrigin && !isDestination;

    return (
      <View key={index} style={styles.pointEditor}>
        <View style={styles.pointHeader}>
          <View style={[
            styles.pointTypeIndicator,
            isOrigin && styles.originIndicator,
            isDestination && styles.destinationIndicator
          ]}>
            <Text style={styles.pointTypeIcon}>
              {isOrigin ? '🏠' : isDestination ? '🎯' : '📍'}
            </Text>
          </View>
          
          <Text style={styles.pointTypeLabel}>
            {isOrigin ? 'Origen' : isDestination ? 'Destino' : `Parada ${index}`}
          </Text>
          
          {canRemove && (
            <TouchableOpacity
              onPress={() => handleRemovePoint(index)}
              style={styles.removePointButton}
            >
              <Minus size={16} color={Colors.error[500]} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.pointInputs}>
          <TextInput
            style={styles.addressInput}
            placeholder="Dirección"
            value={point.address}
            onChangeText={(text) => handlePointChange(index, 'address', text)}
            multiline
          />
          
          <TextInput
            style={styles.nameInput}
            placeholder="Nombre del lugar (opcional)"
            value={point.name || ''}
            onChangeText={(text) => handlePointChange(index, 'name', text)}
          />
        </View>

        <TouchableOpacity style={styles.locationButton}>
          <MapPin size={16} color={Colors.primary[500]} />
          <Text style={styles.locationButtonText}>Usar ubicación actual</Text>
        </TouchableOpacity>
      </View>
    );
  }, [routePoints.length, handleRemovePoint, handlePointChange]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'create' ? 'Nueva Ruta' : 'Editar Ruta'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.neutral[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Route Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nombre de la Ruta</Text>
            <TextInput
              style={styles.routeNameInput}
              placeholder="Ej: Casa al Trabajo"
              value={routeName}
              onChangeText={setRouteName}
              maxLength={100}
            />
          </View>

          {/* Route Points */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Puntos de la Ruta</Text>
              <TouchableOpacity
                onPress={handleAddPoint}
                style={styles.addPointButton}
              >
                <Plus size={16} color={Colors.primary[500]} />
                <Text style={styles.addPointText}>Agregar Parada</Text>
              </TouchableOpacity>
            </View>
            
            {routePoints.map((point, index) => (
              <React.Fragment key={index}>
                {renderPointEditor(point, index)}
              </React.Fragment>
            ))}
          </View>

          {/* Transport Modes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Modos de Transporte</Text>
            <TransportModeSelector
              transportModes={transportModes}
              selectedModes={selectedTransportModes}
              onSelectionChange={setSelectedTransportModes}
              maxSelection={3}
              showDetails={false}
              compact
            />
          </View>

          {/* Recurring Options */}
          <View style={styles.section}>
            <View style={styles.recurringHeader}>
              <Text style={styles.sectionTitle}>Ruta Recurrente</Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  isRecurring && styles.toggleButtonActive
                ]}
                onPress={() => setIsRecurring(!isRecurring)}
              >
                <Text style={[
                  styles.toggleButtonText,
                  isRecurring && styles.toggleButtonTextActive
                ]}>
                  {isRecurring ? 'Activado' : 'Desactivado'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {isRecurring && (
              <View style={styles.recurringOptions}>
                <Text style={styles.recurringLabel}>Frecuencia:</Text>
                <View style={styles.frequencyButtons}>
                  {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.frequencyButton,
                        recurringType === type && styles.frequencyButtonActive
                      ]}
                      onPress={() => setRecurringType(type)}
                    >
                      <Text style={[
                        styles.frequencyButtonText,
                        recurringType === type && styles.frequencyButtonTextActive
                      ]}>
                        {type === 'daily' ? 'Diario' :
                         type === 'weekly' ? 'Semanal' : 'Mensual'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!routeName.trim() || selectedTransportModes.length === 0) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!routeName.trim() || selectedTransportModes.length === 0}
          >
            <Text style={styles.saveButtonText}>
              {mode === 'create' ? 'Crear Ruta' : 'Guardar Cambios'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[4],
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  title: {
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
  },
  closeButton: {
    padding: Spacing[2],
  },
  content: {
    flex: 1,
    padding: Spacing[4],
  },
  section: {
    marginBottom: Spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[800],
    marginBottom: Spacing[3],
  },
  routeNameInput: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
  },
  addPointButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[300],
  },
  addPointText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
  },
  pointEditor: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    ...Shadows.sm,
  },
  pointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[3],
    gap: Spacing[3],
  },
  pointTypeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
  },
  originIndicator: {
    backgroundColor: Colors.success[100],
  },
  destinationIndicator: {
    backgroundColor: Colors.error[100],
  },
  pointTypeIcon: {
    fontSize: 16,
  },
  pointTypeLabel: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.semibold,
    flex: 1,
  },
  removePointButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointInputs: {
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  addressInput: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    minHeight: 60,
    textAlignVertical: 'top',
  },
  nameInput: {
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[300],
    backgroundColor: 'transparent',
  },
  locationButtonText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  toggleButton: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: 'white',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  toggleButtonText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  recurringOptions: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    ...Shadows.sm,
  },
  recurringLabel: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[700],
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing[2],
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: 'white',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  frequencyButtonText: {
    ...Typography.textStyles.bodySmall,
    color: Colors.neutral[600],
    fontWeight: Typography.fontWeight.medium,
  },
  frequencyButtonTextActive: {
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing[4],
    gap: Spacing[3],
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.textStyles.button,
    color: Colors.neutral[600],
  },
  saveButton: {
    flex: 2,
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  saveButtonText: {
    ...Typography.textStyles.button,
    color: 'white',
  },
});

export default CommuteModal;