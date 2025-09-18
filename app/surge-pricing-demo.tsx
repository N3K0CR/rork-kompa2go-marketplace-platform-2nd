// ============================================================================
// SURGE PRICING DEMO SCREEN
// ============================================================================
// Pantalla de demostración del sistema de precios dinámicos

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';
import { DollarSign, TrendingUp, Zap, Settings, RefreshCw, MapPin } from 'lucide-react-native';
import { SurgePricingDisplay } from '@/components/commute/SurgePricingDisplay';

// ============================================================================
// TYPES
// ============================================================================

interface SurgePricingCalculation {
  zoneId: string;
  basePrice: number;
  surgeMultiplier: number;
  finalPrice: number;
  factors: {
    demand: number;
    time: number;
    weather: number;
    event: number;
    saturation: number;
  };
  explanation: string[];
  validUntil: Date;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SurgePricingDemo() {
  const [selectedZone, setSelectedZone] = useState<string>('zone-centro');
  const [basePrice, setBasePrice] = useState<number>(10.0);
  const [currentCalculation, setCurrentCalculation] = useState<SurgePricingCalculation | undefined>();
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Mock surge pricing data
  const mockSurgeData: Record<string, SurgePricingCalculation> = {
    'zone-centro': {
      zoneId: 'zone-centro',
      basePrice: 10.0,
      surgeMultiplier: 1.8,
      finalPrice: 18.0,
      factors: {
        demand: 1.5,
        time: 1.4,
        weather: 1.0,
        event: 1.0,
        saturation: 1.2,
      },
      explanation: [
        'Alta demanda detectada (75% ratio)',
        'Hora pico (8:00)',
        'Zona con alta ocupación',
      ],
      validUntil: new Date(Date.now() + 15 * 60 * 1000),
    },
    'zone-miraflores': {
      zoneId: 'zone-miraflores',
      basePrice: 12.0,
      surgeMultiplier: 2.8,
      finalPrice: 33.6,
      factors: {
        demand: 2.2,
        time: 1.8,
        weather: 1.3,
        event: 1.0,
        saturation: 1.8,
      },
      explanation: [
        'Demanda extrema detectada (95% ratio)',
        'Hora pico (18:00)',
        'Condiciones climáticas: lluvia',
        'Zona saturada - alta demanda',
      ],
      validUntil: new Date(Date.now() + 12 * 60 * 1000),
    },
    'zone-san-isidro': {
      zoneId: 'zone-san-isidro',
      basePrice: 8.0,
      surgeMultiplier: 0.9,
      finalPrice: 7.2,
      factors: {
        demand: 0.8,
        time: 0.8,
        weather: 1.0,
        event: 1.0,
        saturation: 0.9,
      },
      explanation: [
        'Baja demanda (30% ratio)',
        'Hora valle (14:00)',
        'Zona con baja ocupación',
      ],
      validUntil: new Date(Date.now() + 20 * 60 * 1000),
    },
  };

  const zones = [
    { id: 'zone-centro', name: 'Centro Histórico', basePrice: 10.0 },
    { id: 'zone-miraflores', name: 'Miraflores', basePrice: 12.0 },
    { id: 'zone-san-isidro', name: 'San Isidro', basePrice: 8.0 },
  ];

  const handleZoneChange = (zoneId: string) => {
    console.log('🎯 Zone changed:', zoneId);
    setSelectedZone(zoneId);
    const zone = zones.find(z => z.id === zoneId);
    if (zone) {
      setBasePrice(zone.basePrice);
      setCurrentCalculation(mockSurgeData[zoneId]);
    }
  };

  const handleRefreshSurge = async () => {
    console.log('🔄 Refreshing surge pricing data');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate slight changes in surge data
    const current = mockSurgeData[selectedZone];
    if (current) {
      const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
      const newMultiplier = Math.max(0.5, Math.min(4.0, current.surgeMultiplier + variation));
      
      const updatedCalculation: SurgePricingCalculation = {
        ...current,
        surgeMultiplier: Math.round(newMultiplier * 10) / 10,
        finalPrice: Math.round(basePrice * newMultiplier * 100) / 100,
        validUntil: new Date(Date.now() + 15 * 60 * 1000),
      };
      
      setCurrentCalculation(updatedCalculation);
    }
    
    setRefreshKey(prev => prev + 1);
  };

  const simulateWeatherChange = () => {
    const weatherConditions = [
      { name: 'Despejado', multiplier: 1.0 },
      { name: 'Lluvia', multiplier: 1.3 },
      { name: 'Tormenta', multiplier: 1.8 },
      { name: 'Granizo', multiplier: 2.0 },
    ];
    
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    
    const current = currentCalculation;
    if (current) {
      const updatedCalculation: SurgePricingCalculation = {
        ...current,
        factors: {
          ...current.factors,
          weather: randomWeather.multiplier,
        },
        surgeMultiplier: current.surgeMultiplier * (randomWeather.multiplier / current.factors.weather),
        explanation: [
          ...current.explanation.filter(e => !e.includes('Condiciones climáticas')),
          randomWeather.name !== 'Despejado' ? `Condiciones climáticas: ${randomWeather.name.toLowerCase()}` : '',
        ].filter(Boolean),
      };
      
      updatedCalculation.finalPrice = Math.round(basePrice * updatedCalculation.surgeMultiplier * 100) / 100;
      setCurrentCalculation(updatedCalculation);
    }
    
    Alert.alert(
      'Clima Actualizado',
      `Condiciones cambiaron a: ${randomWeather.name}`,
      [{ text: 'OK' }]
    );
  };

  const simulateEventChange = () => {
    const events = [
      { name: 'Normal', multiplier: 1.0 },
      { name: 'Feriado', multiplier: 1.4 },
      { name: 'Evento Especial', multiplier: 1.6 },
      { name: 'Emergencia', multiplier: 2.5 },
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    const current = currentCalculation;
    if (current) {
      const updatedCalculation: SurgePricingCalculation = {
        ...current,
        factors: {
          ...current.factors,
          event: randomEvent.multiplier,
        },
        surgeMultiplier: current.surgeMultiplier * (randomEvent.multiplier / current.factors.event),
        explanation: [
          ...current.explanation.filter(e => !e.includes('Evento especial')),
          randomEvent.name !== 'Normal' ? `Evento especial: ${randomEvent.name.toLowerCase()}` : '',
        ].filter(Boolean),
      };
      
      updatedCalculation.finalPrice = Math.round(basePrice * updatedCalculation.surgeMultiplier * 100) / 100;
      setCurrentCalculation(updatedCalculation);
    }
    
    Alert.alert(
      'Evento Actualizado',
      `Tipo de evento: ${randomEvent.name}`,
      [{ text: 'OK' }]
    );
  };

  useEffect(() => {
    console.log('🚀 Surge Pricing Demo initialized');
    setCurrentCalculation(mockSurgeData[selectedZone]);
  }, [selectedZone]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Sistema de Precios Dinámicos',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Info */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <DollarSign size={24} color="#007AFF" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Surge Pricing Demo</Text>
              <Text style={styles.headerSubtitle}>Precios dinámicos en tiempo real</Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefreshSurge}
              testID="refresh-surge"
            >
              <RefreshCw size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Zone Selector */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Seleccionar Zona</Text>
            <Text style={styles.sectionSubtitle}>
              Elige una zona para ver su pricing dinámico
            </Text>
          </View>
          
          <View style={styles.zoneSelector}>
            {zones.map((zone) => (
              <TouchableOpacity
                key={zone.id}
                style={[
                  styles.zoneButton,
                  selectedZone === zone.id && styles.zoneButtonSelected,
                ]}
                onPress={() => handleZoneChange(zone.id)}
                testID={`zone-${zone.id}`}
              >
                <MapPin 
                  size={16} 
                  color={selectedZone === zone.id ? '#FFFFFF' : '#007AFF'} 
                />
                <Text style={[
                  styles.zoneButtonText,
                  selectedZone === zone.id && styles.zoneButtonTextSelected,
                ]}>
                  {zone.name}
                </Text>
                <Text style={[
                  styles.zoneButtonPrice,
                  selectedZone === zone.id && styles.zoneButtonPriceSelected,
                ]}>
                  ${zone.basePrice.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Surge Pricing Display */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Precio Dinámico</Text>
            <Text style={styles.sectionSubtitle}>
              Información detallada del surge pricing
            </Text>
          </View>
          
          <SurgePricingDisplay
            zoneId={selectedZone}
            basePrice={basePrice}
            calculation={currentCalculation}
            onRefresh={handleRefreshSurge}
            showDetails={true}
            compact={false}
            animated={true}
          />
        </View>

        {/* Compact View Example */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vista Compacta</Text>
            <Text style={styles.sectionSubtitle}>
              Versión compacta para listas o dashboards
            </Text>
          </View>
          
          <SurgePricingDisplay
            zoneId={selectedZone}
            basePrice={basePrice}
            calculation={currentCalculation}
            showDetails={false}
            compact={true}
            animated={false}
          />
        </View>

        {/* Demo Controls */}
        <View style={styles.controlsCard}>
          <Text style={styles.controlsTitle}>Controles de Simulación</Text>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={simulateWeatherChange}
            testID="simulate-weather"
          >
            <TrendingUp size={20} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Cambiar Clima</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonSecondary]}
            onPress={simulateEventChange}
            testID="simulate-event"
          >
            <Zap size={20} color="#007AFF" />
            <Text style={[styles.controlButtonText, styles.controlButtonTextSecondary]}>
              Simular Evento
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonSecondary]}
            onPress={handleRefreshSurge}
            testID="refresh-pricing"
          >
            <RefreshCw size={20} color="#007AFF" />
            <Text style={[styles.controlButtonText, styles.controlButtonTextSecondary]}>
              Actualizar Precios
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonSecondary]}
            onPress={() => {
              setCurrentCalculation(mockSurgeData[selectedZone]);
              setRefreshKey(prev => prev + 1);
            }}
            testID="reset-demo"
          >
            <Settings size={20} color="#007AFF" />
            <Text style={[styles.controlButtonText, styles.controlButtonTextSecondary]}>
              Reiniciar Demo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Info */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Estado del Sistema</Text>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Zona Activa:</Text>
            <Text style={styles.statusValue}>
              {zones.find(z => z.id === selectedZone)?.name || 'N/A'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Precio Base:</Text>
            <Text style={styles.statusValue}>${basePrice.toFixed(2)}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Multiplicador Actual:</Text>
            <Text style={styles.statusValue}>
              {currentCalculation?.surgeMultiplier.toFixed(1)}x
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Precio Final:</Text>
            <Text style={styles.statusValue}>
              ${currentCalculation?.finalPrice.toFixed(2) || 'N/A'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Válido Hasta:</Text>
            <Text style={styles.statusValue}>
              {currentCalculation?.validUntil?.toLocaleTimeString() || 'N/A'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  zoneSelector: {
    padding: 16,
    gap: 12,
  },
  zoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#FFFFFF',
  },
  zoneButtonSelected: {
    backgroundColor: '#007AFF',
  },
  zoneButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  zoneButtonTextSelected: {
    color: '#FFFFFF',
  },
  zoneButtonPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  zoneButtonPriceSelected: {
    color: '#FFFFFF',
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  controlButtonSecondary: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  controlButtonTextSecondary: {
    color: '#007AFF',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusLabel: {
    fontSize: 14,
    color: '#757575',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
});