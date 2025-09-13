import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { Search, MapPin, Star, Filter, Navigation, Loader, AlertCircle } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocationSearch } from '@/contexts/LocationSearchContext';
import ExtendRadiusDialog from '@/components/ExtendRadiusDialog';
import { router } from 'expo-router';
import { useReservationPlans } from '@/contexts/ReservationPlansContext';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

const serviceCategories = [
  { id: 1, name: 'Limpieza', icon: '🧹', providers: 45 },
  { id: 2, name: 'Plomería', icon: '🔧', providers: 32 },
  { id: 3, name: 'Electricidad', icon: '⚡', providers: 28 },
  { id: 4, name: 'Jardinería', icon: '🌱', providers: 23 },
  { id: 5, name: 'Pintura', icon: '🎨', providers: 19 },
  { id: 6, name: 'Carpintería', icon: '🔨', providers: 15 },
  { id: 7, name: 'Mecánica', icon: '🔧', providers: 18 },
  { id: 8, name: 'Belleza', icon: '💄', providers: 35 },
  { id: 9, name: 'Masajes', icon: '💆', providers: 22 },
  { id: 10, name: 'Veterinaria', icon: '🐕', providers: 12 },
  { id: 11, name: 'Tecnología', icon: '💻', providers: 25 },
  { id: 12, name: 'Educación', icon: '📚', providers: 30 },
  { id: 13, name: 'Transporte', icon: '🚗', providers: 20 },
  { id: 14, name: 'Catering', icon: '🍽️', providers: 16 },
  { id: 15, name: 'Fotografía', icon: '📸', providers: 14 },
  { id: 16, name: 'Música', icon: '🎵', providers: 8 },
  { id: 17, name: 'Fitness', icon: '💪', providers: 26 },
  { id: 18, name: 'Consultoría', icon: '💼', providers: 11 },
];

const featuredProviders = [
  {
    id: 999,
    name: 'Sakura Beauty Salon',
    fullName: 'Sakura Beauty Salon',
    service: 'Servicios de Belleza',
    rating: 5.0,
    reviews: 250,
    location: 'San José Centro',
    price: '₡15,000/sesión',
    image: '🌸',
    isSpecialProvider: true,
  },
  {
    id: 1,
    name: 'María',
    fullName: 'María González',
    service: 'Limpieza Residencial',
    rating: 4.9,
    reviews: 127,
    location: 'San José Centro',
    price: '₡8,000/hora',
    image: '👩‍💼',
    isSpecialProvider: false,
  },
  {
    id: 2,
    name: 'Carlos',
    fullName: 'Carlos Rodríguez',
    service: 'Plomería',
    rating: 4.8,
    reviews: 89,
    location: 'Escazú',
    price: '₡12,000/visita',
    image: '👨‍🔧',
    isSpecialProvider: false,
  },
  {
    id: 3,
    name: 'Ana',
    fullName: 'Ana Jiménez',
    service: 'Jardinería',
    rating: 4.7,
    reviews: 64,
    location: 'Cartago',
    price: '₡15,000/día',
    image: '👩‍🌾',
    isSpecialProvider: false,
  },
];

export default function SearchScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { hasActiveReservations } = useReservationPlans();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  const {
    userLocation,
    locationPermission,
    isLoadingLocation,
    searchRadius,
    foundProviders,
    isSearching,
    searchError,
    showExtendRadiusDialog,
    availableRadii,
    maxExtendedRadius,
    requestLocationPermission,
    searchProviders,
    extendSearchRadius,
    dismissExtendDialog,
    resetSearch
  } = useLocationSearch();
  
  const handleLocationRequest = async () => {
    console.log('Location sharing requested from search');
    await requestLocationPermission();
  };
  
  const handleCategorySearch = async (categoryName: string) => {
    if (!categoryName?.trim() || categoryName.length > 50) return;
    const sanitizedName = categoryName.trim();
    setSelectedCategory(selectedCategory === null ? 1 : null);
    await searchProviders(sanitizedName);
  };
  
  const handleTextSearch = async () => {
    if (searchQuery.trim()) {
      await searchProviders(searchQuery.trim());
    }
  };
  
  const getLocationText = () => {
    if (isLoadingLocation) return 'Obteniendo ubicación...';
    if (!locationPermission) return 'Ubicación no disponible';
    if (userLocation) return `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`;
    return 'San José, Costa Rica';
  };
  
  const getSearchStatusText = () => {
    if (isSearching) {
      return `Buscando en radio de ${searchRadius.current}km...`;
    }
    if (foundProviders.length > 0) {
      return `${foundProviders.length} proveedores encontrados en ${searchRadius.current}km`;
    }
    if (searchError) {
      return searchError;
    }
    return null;
  };

  const canViewProviderDetails = (provider: any) => {
    if (!user || user.userType !== 'client') return true;
    if (provider.isSpecialProvider || provider.id === '999') return true;
    return hasActiveReservations();
  };

  const renderProviderCard = (provider: any) => {
    const canView = canViewProviderDetails(provider);
    
    return (
      <TouchableOpacity
        key={provider.id}
        style={styles.providerCard}
        onPress={() => router.push(`/provider/${provider.id}`)}
      >
        <View style={styles.providerHeader}>
          <Text style={styles.providerImage}>{provider.image}</Text>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <Text style={styles.providerService}>{provider.service}</Text>
            <View style={styles.providerMeta}>
              <View style={styles.rating}>
                <Star size={14} color="#FFD700" fill="#FFD700" />
                <Text style={styles.ratingText}>{provider.rating}</Text>
                <Text style={styles.reviewsText}>({provider.reviews})</Text>
              </View>
              {canView && (
                <View style={styles.location}>
                  <MapPin size={14} color="#666" />
                  <Text style={styles.locationText}>{provider.location}</Text>
                  {provider.distance && (
                    <Text style={styles.distanceText}>
                      • {provider.distance.toFixed(1)}km
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
          <View style={styles.providerPrice}>
            {canView ? (
              <Text style={styles.priceText}>{provider.price}</Text>
            ) : (
              <View style={styles.restrictedAccess}>
                <Text style={styles.restrictedText}>🔒</Text>
                <Text style={styles.restrictedSubtext}>Plan requerido</Text>
              </View>
            )}
          </View>
        </View>
        {!canView && (
          <View style={styles.restrictedBanner}>
            <Text style={styles.restrictedBannerText}>
              💎 Información Restringida - Adquiere un plan de reservas para ver información de contacto y realizar reservas
            </Text>
            <View style={styles.restrictedActions}>
              <TouchableOpacity 
                style={styles.restrictedButton}
                onPress={() => router.push('/purchase-plan')}
              >
                <Text style={styles.restrictedButtonText}>Ver Planes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.restrictedButton, styles.primaryRestrictedButton]}
                onPress={() => router.push('/purchase-plan')}
              >
                <Text style={[styles.restrictedButtonText, styles.primaryRestrictedButtonText]}>Comprar pase de reserva</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('search_services_title')}</Text>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('what_service_need')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleTextSearch}
              placeholderTextColor="#666"
              returnKeyType="search"
            />
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#D81B60" />
          </TouchableOpacity>
        </View>

        <View style={styles.locationContainer}>
          <MapPin size={16} color="#666" />
          <Text style={styles.locationText}>{getLocationText()}</Text>
          <TouchableOpacity 
            style={[
              styles.shareLocationButton,
              isLoadingLocation && styles.shareLocationButtonLoading
            ]}
            onPress={handleLocationRequest}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size={14} color="#D81B60" />
            ) : (
              <Navigation size={14} color="#D81B60" />
            )}
            <Text style={styles.shareLocationText}>
              {isLoadingLocation ? 'Obteniendo...' : t('share_location')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Search Status */}
        {getSearchStatusText() && (
          <View style={[
            styles.searchStatusContainer,
            searchError && styles.searchStatusError
          ]}>
            {isSearching ? (
              <Loader size={16} color="#D81B60" />
            ) : searchError ? (
              <AlertCircle size={16} color="#FF3B30" />
            ) : (
              <MapPin size={16} color="#34C759" />
            )}
            <Text style={[
              styles.searchStatusText,
              searchError && styles.searchStatusTextError
            ]}>
              {getSearchStatusText()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('categories')}</Text>
          <View style={styles.categoriesGrid}>
            {serviceCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardSelected,
                ]}
                onPress={() => handleCategorySearch(category.name)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>{category.providers} {t('providers_count')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {foundProviders.length > 0 ? 'Proveedores Encontrados' : t('featured_providers')}
          </Text>
          
          {/* Show search results if available */}
          {foundProviders.length > 0 ? (
            foundProviders
              .sort((a, b) => {
                // Always put Sakura Beauty Salon first
                if (a.isSpecialProvider || a.id === '999') return -1;
                if (b.isSpecialProvider || b.id === '999') return 1;
                return 0;
              })
              .map((provider) => renderProviderCard(provider))
          ) : (
            /* Show default featured providers */
            featuredProviders.map((provider) => renderProviderCard(provider))
          )}
        </View>

        {/* Reset Search Button */}
        {foundProviders.length > 0 && (
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={resetSearch}
          >
            <Text style={styles.resetButtonText}>🔄 Nueva Búsqueda</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => router.push('/chat')}
        >
          <Text style={styles.chatButtonText}>💬 {t('ask_kompi_what_need')}</Text>
        </TouchableOpacity>
        
        {/* Extend Radius Dialog */}
        <ExtendRadiusDialog
          visible={showExtendRadiusDialog}
          onExtend={extendSearchRadius}
          onDismiss={dismissExtendDialog}
          maxRadius={searchRadius.maxRadius}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  shareLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(216, 27, 96, 0.1)',
  },
  shareLocationText: {
    fontSize: 12,
    color: '#D81B60',
    fontWeight: '600',
  },
  shareLocationButtonLoading: {
    opacity: 0.6,
  },
  searchStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 8,
  },
  searchStatusError: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  searchStatusText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  searchStatusTextError: {
    color: '#FF3B30',
  },
  distanceText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  resetButton: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: (width - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryCardSelected: {
    backgroundColor: '#D81B60',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
  },
  providerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerImage: {
    fontSize: 40,
    width: 60,
    height: 60,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  providerService: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  providerMeta: {
    gap: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewsText: {
    fontSize: 14,
    color: '#666',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D81B60',
  },
  chatButton: {
    backgroundColor: '#D81B60',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  restrictedAccess: {
    alignItems: 'center',
  },
  restrictedText: {
    fontSize: 20,
    marginBottom: 2,
  },
  restrictedSubtext: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  restrictedBanner: {
    backgroundColor: 'rgba(216, 27, 96, 0.1)',
    padding: 12,
    marginTop: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D81B60',
  },
  restrictedBannerText: {
    fontSize: 12,
    color: '#D81B60',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  restrictedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  restrictedButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D81B60',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  primaryRestrictedButton: {
    backgroundColor: '#D81B60',
  },
  restrictedButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D81B60',
  },
  primaryRestrictedButtonText: {
    color: 'white',
  },
});