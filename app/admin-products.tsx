import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Stack } from 'expo-router';
import { Plus, Edit3, Trash2, Save, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useK2GProducts, K2GProduct } from '@/contexts/K2GProductsContext';
import { router } from 'expo-router';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  isActive: boolean;
}

export default function ProductsAdminScreen() {
  const { user } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useK2GProducts();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<K2GProduct | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    isActive: true,
  });

  // Check if user is admin
  if (user?.userType !== 'admin') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Acceso Denegado' }} />
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedText}>
            Solo los administradores pueden acceder a esta página.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      isActive: true,
    });
    setEditingProduct(null);
  };

  const handleAddProduct = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return;
    }

    try {
      await addProduct({
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price.trim() || '₡0',
        category: 'K2G Products',
        isActive: formData.isActive,
      });
      
      Alert.alert('Éxito', 'Producto agregado correctamente');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el producto');
      console.error('Error adding product:', error);
    }
  };

  const handleEditProduct = (product: K2GProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      isActive: product.isActive,
    });
    setShowAddModal(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !formData.name.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return;
    }

    try {
      await updateProduct(editingProduct.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price.trim() || '₡0',
        isActive: formData.isActive,
      });
      
      Alert.alert('Éxito', 'Producto actualizado correctamente');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el producto');
      console.error('Error updating product:', error);
    }
  };

  const handleDeleteProduct = (product: K2GProduct) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              Alert.alert('Éxito', 'Producto eliminado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el producto');
              console.error('Error deleting product:', error);
            }
          },
        },
      ]
    );
  };

  const renderProductCard = (product: K2GProduct) => (
    <View key={product.id} style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription}>{product.description}</Text>
          <Text style={styles.productPrice}>{product.price}</Text>
          <View style={styles.productStatus}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: product.isActive ? '#4CAF50' : '#F44336' }
            ]} />
            <Text style={styles.statusText}>
              {product.isActive ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditProduct(product)}
          >
            <Edit3 size={20} color="#D81B60" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteProduct(product)}
          >
            <Trash2 size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderProductModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowAddModal(false);
              resetForm();
            }}
          >
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre del Producto *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Ej: Automations"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe el producto o servicio..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Precio</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder="₡50,000/proyecto"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setFormData({ ...formData, isActive: !formData.isActive })}
              >
                <View style={[
                  styles.checkboxInner,
                  formData.isActive && styles.checkboxChecked
                ]}>
                  {formData.isActive && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Producto activo</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              setShowAddModal(false);
              resetForm();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={editingProduct ? handleUpdateProduct : handleAddProduct}
          >
            <Save size={20} color="white" />
            <Text style={styles.saveButtonText}>
              {editingProduct ? 'Actualizar' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Administrar Productos K2G' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Productos K2G</Text>
        <Text style={styles.subtitle}>
          Administra los productos y servicios de Kompa2Go
        </Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="white" />
          <Text style={styles.addButtonText}>Agregar Producto</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{products.length}</Text>
            <Text style={styles.statLabel}>Total Productos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {products.filter(p => p.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {products.filter(p => !p.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Inactivos</Text>
          </View>
        </View>

        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Lista de Productos</Text>
          
          {products.length > 0 ? (
            products.map(renderProductCard)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No hay productos registrados
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Agrega el primer producto K2G
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {renderProductModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#D81B60',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#D81B60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  productsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D81B60',
    marginBottom: 8,
  },
  productStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    padding: 4,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D81B60',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#D81B60',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#D81B60',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});