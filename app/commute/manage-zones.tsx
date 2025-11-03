import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapPin, X, Check } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/context-package/design-system';
import { trpc } from '@/lib/trpc';

const PROVINCES = [
  'San José',
  'Alajuela',
  'Cartago',
  'Heredia',
  'Guanacaste',
  'Puntarenas',
  'Limón'
];

export default function ManageZones() {
  console.log('🗺️ ManageZones: Screen rendered');
  const insets = useSafeAreaInsets();

  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [avoidedZones, setAvoidedZones] = useState<string[]>([]);
  const [newZoneInput, setNewZoneInput] = useState('');

  const toggleProvince = (province: string) => {
    console.log('🗺️ Toggling province:', province);
    setSelectedProvinces(prev => {
      if (prev.includes(province)) {
        return prev.filter(p => p !== province);
      } else {
        return [...prev, province];
      }
    });
  };

  const addAvoidedZone = () => {
    const trimmedZone = newZoneInput.trim();
    if (trimmedZone === '') {
      Alert.alert('Error', 'Por favor ingresa el nombre de una zona');
      return;
    }
    if (avoidedZones.includes(trimmedZone)) {
      Alert.alert('Error', 'Esta zona ya está en la lista');
      return;
    }
    console.log('🚫 Adding avoided zone:', trimmedZone);
    setAvoidedZones(prev => [...prev, trimmedZone]);
    setNewZoneInput('');
  };

  const removeAvoidedZone = (zone: string) => {
    console.log('✅ Removing avoided zone:', zone);
    setAvoidedZones(prev => prev.filter(z => z !== zone));
  };

  const updatePreferencesMutation = trpc.commute.updateZonePreferences.useMutation({
    onSuccess: (data: { success: boolean; message: string }) => {
      console.log('✅ Preferences saved successfully:', data);
      Alert.alert(
        'Cambios Guardados',
        data.message || 'Tus preferencias han sido guardadas correctamente',
        [{ text: 'OK' }]
      );
    },
    onError: (error: any) => {
      console.error('❌ Error saving preferences:', error);
      Alert.alert(
        'Error',
        'No se pudieron guardar los cambios. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleSave = () => {
    console.log('💾 Saving changes:', {
      selectedProvinces,
      avoidedZones
    });
    
    updatePreferencesMutation.mutate({
      provinces: selectedProvinces,
      avoidedZones,
    });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen 
        options={{ 
          title: 'Gestionar Zonas',
          headerStyle: { backgroundColor: Colors.primary[500] },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={24} color={Colors.primary[500]} />
            <Text style={styles.sectionTitle}>Provincias de Servicio</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Selecciona las provincias donde deseas ofrecer tu servicio
          </Text>

          <View style={styles.provincesGrid}>
            {PROVINCES.map((province) => {
              const isSelected = selectedProvinces.includes(province);
              return (
                <TouchableOpacity
                  key={province}
                  style={[
                    styles.provinceButton,
                    isSelected && styles.provinceButtonSelected
                  ]}
                  onPress={() => toggleProvince(province)}
                  activeOpacity={0.7}
                >
                  <View style={styles.provinceContent}>
                    <Text style={[
                      styles.provinceText,
                      isSelected && styles.provinceTextSelected
                    ]}>
                      {province}
                    </Text>
                    {isSelected && (
                      <Check size={20} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={24} color={Colors.error[500]} />
            <Text style={styles.sectionTitle}>Zonas a Evitar (Seguridad)</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Marca zonas que prefieres evitar por motivos de seguridad
          </Text>

          <View style={styles.addZoneContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                value={newZoneInput}
                onChangeText={setNewZoneInput}
                placeholder="Ej: Barrio X, Sector Y"
                style={styles.zoneInput}
                accessibilityLabel="Ingrese nombre de zona a evitar"
                onSubmitEditing={addAvoidedZone}
                returnKeyType="done"
                placeholderTextColor={Colors.neutral[400]}
              />
            </View>
            <TouchableOpacity
              style={styles.addZoneButton}
              onPress={addAvoidedZone}
              activeOpacity={0.7}
            >
              <Text style={styles.addZoneButtonText}>Añadir Zona</Text>
            </TouchableOpacity>
          </View>

          {avoidedZones.length > 0 && (
            <View style={styles.avoidedZonesList}>
              {avoidedZones.map((zone, index) => (
                <View key={`${zone}-${index}`} style={styles.avoidedZoneItem}>
                  <Text style={styles.avoidedZoneText}>{zone}</Text>
                  <TouchableOpacity
                    onPress={() => removeAvoidedZone(zone)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={20} color={Colors.error[500]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {avoidedZones.length === 0 && (
            <Text style={styles.emptyZonesText}>
              No has marcado zonas a evitar
            </Text>
          )}
        </View>

        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              updatePreferencesMutation.isPending && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={updatePreferencesMutation.isPending}
          >
            {updatePreferencesMutation.isPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.saveButtonText}>Guardando...</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
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
    marginBottom: Spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  sectionTitle: {
    ...Typography.textStyles.h5,
    color: Colors.neutral[800],
  },
  sectionSubtitle: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
    marginBottom: Spacing[4],
  },
  provincesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  provinceButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderWidth: 2,
    borderColor: Colors.neutral[200],
  },
  provinceButtonSelected: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[600],
  },
  provinceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  provinceText: {
    ...Typography.textStyles.button,
    color: Colors.neutral[700],
  },
  provinceTextSelected: {
    color: 'white',
  },
  addZoneContainer: {
    marginBottom: Spacing[4],
  },
  inputWrapper: {
    marginBottom: Spacing[3],
  },
  zoneInput: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    ...Typography.textStyles.body,
    backgroundColor: 'white',
  },
  addZoneButton: {
    backgroundColor: Colors.error[500],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  addZoneButtonText: {
    ...Typography.textStyles.button,
    color: 'white',
  },
  avoidedZonesList: {
    gap: Spacing[2],
  },
  avoidedZoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.error[200],
  },
  avoidedZoneText: {
    ...Typography.textStyles.body,
    color: Colors.neutral[800],
    flex: 1,
  },
  emptyZonesText: {
    ...Typography.textStyles.body,
    color: Colors.neutral[500],
    textAlign: 'center',
    paddingVertical: Spacing[4],
    fontStyle: 'italic',
  },
  saveButtonContainer: {
    padding: Spacing[4],
    paddingTop: 0,
  },
  saveButton: {
    backgroundColor: Colors.success[500],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    ...Typography.textStyles.button,
    color: 'white',
    fontSize: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
});
