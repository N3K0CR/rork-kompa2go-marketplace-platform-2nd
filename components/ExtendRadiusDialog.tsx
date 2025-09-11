import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { AlertTriangle, MapPin, X } from 'lucide-react-native';

interface ExtendRadiusDialogProps {
  visible: boolean;
  onExtend: (radius: number) => void;
  onDismiss: () => void;
  maxRadius: number;
}

export default function ExtendRadiusDialog({ 
  visible, 
  onExtend, 
  onDismiss, 
  maxRadius 
}: ExtendRadiusDialogProps) {
  const [showOptions, setShowOptions] = useState(false);

  const handleExtendSearch = () => {
    setShowOptions(true);
  };
  
  const handleOptionSelect = (radius: number) => {
    if (radius > 0 && radius <= 100) {
      setShowOptions(false);
      onExtend(radius);
    }
  };
  
  const handleCancel = () => {
    setShowOptions(false);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <X size={24} color="#666" />
          </TouchableOpacity>
          
          <View style={styles.iconContainer}>
            <AlertTriangle size={48} color="#FF9500" />
          </View>
          
          <Text style={styles.title}>No se encontraron proveedores</Text>
          
          <Text style={styles.message}>
            No hay proveedores disponibles en un radio de {maxRadius}km de su ubicación.
          </Text>
          
          <View style={styles.infoContainer}>
            <MapPin size={16} color="#666" />
            <Text style={styles.infoText}>
              ¿Desea extender el área de búsqueda?
            </Text>
          </View>
          
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Los proveedores pueden estar en otra provincia
            </Text>
            <Text style={styles.warningSubtext}>
              • Costos de traslado adicionales{'\n'}
              • Tiempo de viaje puede ser excesivo{'\n'}
              • Todos registrados en Kompa2Go
            </Text>
          </View>
          
          {!showOptions ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={onDismiss}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.extendButton} 
                onPress={handleExtendSearch}
              >
                <Text style={styles.extendButtonText}>Extender Búsqueda</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.optionsContainer}>
              <Text style={styles.optionsTitle}>Seleccione el radio de búsqueda:</Text>
              
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => handleOptionSelect(25)}
              >
                <Text style={styles.optionButtonText}>Buscar hasta 25km</Text>
                <Text style={styles.optionSubtext}>Área metropolitana extendida</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => handleOptionSelect(50)}
              >
                <Text style={styles.optionButtonText}>Buscar hasta 50km</Text>
                <Text style={styles.optionSubtext}>Incluye otras provincias</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  warningText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '600',
    marginBottom: 8,
  },
  warningSubtext: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  extendButton: {
    flex: 1,
    backgroundColor: '#D81B60',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  extendButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  optionButton: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D81B60',
    textAlign: 'center',
  },
  optionSubtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
});