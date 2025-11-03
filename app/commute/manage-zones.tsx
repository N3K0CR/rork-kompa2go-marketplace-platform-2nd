import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Plus } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography } from '@/context-package/design-system';

export default function ManageZones() {
  console.log('🗺️ ManageZones: Screen rendered');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <View style={styles.header}>
            <MapPin size={32} color={Colors.primary[500]} />
            <Text style={styles.title}>Zonas de Servicio</Text>
            <Text style={styles.subtitle}>
              Administra las zonas donde ofreces tu servicio de transporte
            </Text>
          </View>

          <View style={styles.emptyState}>
            <MapPin size={48} color={Colors.neutral[400]} />
            <Text style={styles.emptyStateTitle}>No tienes zonas configuradas</Text>
            <Text style={styles.emptyStateText}>
              Agrega zonas de servicio para comenzar a recibir solicitudes de viaje
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              console.log('➕ Agregar nueva zona');
              // TODO: Implementar lógica para agregar zona
            }}
          >
            <Plus size={20} color="white" />
            <Text style={styles.addButtonText}>Agregar Zona</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  title: {
    ...Typography.textStyles.h4,
    color: Colors.neutral[800],
    marginTop: Spacing[3],
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.textStyles.body,
    color: Colors.neutral[600],
    marginTop: Spacing[2],
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing[8],
  },
  emptyStateTitle: {
    ...Typography.textStyles.h6,
    color: Colors.neutral[600],
    marginTop: Spacing[4],
  },
  emptyStateText: {
    ...Typography.textStyles.body,
    color: Colors.neutral[500],
    marginTop: Spacing[2],
    textAlign: 'center',
    paddingHorizontal: Spacing[6],
  },
  addButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[4],
  },
  addButtonText: {
    ...Typography.textStyles.button,
    color: 'white',
  },
});
