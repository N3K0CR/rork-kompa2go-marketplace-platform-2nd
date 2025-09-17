import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Search, MapPin, Star, Filter, Navigation, Loader, AlertCircle, Hash, Phone, Mail } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocationSearch } from '@/contexts/LocationSearchContext';
import ExtendRadiusDialog from '@/components/ExtendRadiusDialog';
import { router } from 'expo-router';
import { useReservationPlans } from '@/contexts/ReservationPlansContext';
import { useAuth } from '@/contexts/AuthContext';
import { useK2GProducts } from '@/contexts/K2GProductsContext';

const { width } = Dimensions.get('window');

const baseServiceCategories = [
  { id: 2, name: 'Ambulantes', icon: '🚚', providers: 8, isAmbulante: true },
  { id: 3, name: 'Limpieza', icon: '🧹', providers: 45 },
  { id: 4, name: 'Plomería', icon: '🔧', providers: 32 },
  { id: 5, name: 'Electricidad', icon: '⚡', providers: 28 },
  { id: 6, name: 'Jardinería', icon: '🌱', providers: 23 },
  { id: 7, name: 'Pintura', icon: '🎨', providers: 19 },
  { id: 8, name: 'Carpintería', icon: '🔨', providers: 15 },
  { id: 9, name: 'Mecánica', icon: '🔧', providers: 18 },
  { id: 10, name: 'Belleza', icon: '💄', providers: 35 },
  { id: 11, name: 'Masajes', icon: '💆', providers: 22 },
  { id: 12, name: 'Veterinaria', icon: '🐕', providers: 12 },
  { id: 13, name: 'Tecnología', icon: '💻', providers: 25 },
  { id: 14, name: 'Educación', icon: '📚', providers: 30 },
  { id: 15, name: 'Transporte', icon: '🚗', providers: 20 },
  { id: 16, name: 'Catering', icon: '🍽️', providers: 16 },
  { id: 17, name: 'Fotografía', icon: '📸', providers: 14 },
  { id: 18, name: 'Música', icon: '🎵', providers: 8 },
  { id: 19, name: 'Fitness', icon: '💪', providers: 26 },
  { id: 20, name: 'Consultoría', icon: '💼', providers: 11 },
];

const featuredProviders = [
  {
    id: '999',
    name: 'Sakura Beauty Salon',
    fullName: 'Sakura Beauty Salon',
    service: 'Servicios de Belleza',
    rating: 5.0,
    reviews: 250,
    location: 'San José Centro',
    price: '₡15,000/sesión',
    image: '🌸',
    isSpecialProvider: true,
    isAmbulante: false,
    uniqueId: '2KPSK789',
    phone: '+506 8888-0001',
    email: 'sakura@beauty.com',
  },
  {
    id: '998',
    name: 'Neko Studios',
    fullName: 'Neko Studios',
    service: 'Fotografía y Video',
    rating: 4.9,
    reviews: 189,
    location: 'Escazú',
    price: '₡25,000/sesión',
    image: '📸',
    isSpecialProvider: true,
    isAmbulante: false,
    uniqueId: '2KPNK456',
    phone: '+506 8888-0002',
    email: 'neko@studios.com',
  },
  {
    id: '1',
    name: 'María',
    fullName: 'María González',
    service: 'Limpieza Residencial',
    rating: 4.9,
    reviews: 127,
    location: 'San José Centro',
    price: '₡8,000/hora',
    image: '👩‍💼',
    isSpecialProvider: false,
    isAmbulante: false,
    uniqueId: '2KPMG123',
    phone: '+506 8888-0003',
    email: 'maria@limpieza.com',
  },
  {
    id: '2',
    name: 'Carlos',
    fullName: 'Carlos Rodríguez',
    service: 'Plomería',
    rating: 4.8,
    reviews: 89,
    location: 'Escazú',
    price: '₡12,000/visita',
    image: '👨‍🔧',
    isSpecialProvider: false,
    isAmbulante: false,
    uniqueId: '2KPCR789',
    phone: '+506 8888-0004',
    email: 'carlos@plomeria.com',
  },
  {
    id: '3',
    name: 'Ana',
    fullName: 'Ana Jiménez',
    service: 'Jardinería',
    rating: 4.7,
    reviews: 64,
    location: 'Cartago',
    price: '₡15,000/día',
    image: '👩‍🌾',
    isSpecialProvider: false,
    isAmbulante: false,
    uniqueId: '2KPAJ456',
    phone: '+506 8888-0005',
    email: 'ana@jardineria.com',
  },
  {
    id: '4',
    name: 'Luis',
    fullName: 'Luis Morales',
    service: 'Comida Rápida Ambulante',
    rating: 4.6,
    reviews: 95,
    location: 'Móvil - San José',
    price: '₡2,500/combo',
    image: '🚚',
    isSpecialProvider: false,
    isAmbulante: true,
    uniqueId: '2KPLM123',
    phone: '+506 8888-0006',
    email: 'luis@comida.com',
  },
  {
    id: '5',
    name: 'Carmen',
    fullName: 'Carmen Vega',
    service: 'Reparación de Celulares Móvil',
    rating: 4.8,
    reviews: 73,
    location: 'Móvil - Área Metropolitana',
    price: '₡8,000/reparación',
    image: '📱',
    isSpecialProvider: false,
    isAmbulante: true,
    uniqueId: '2KPCV789',
    phone: '+506 8888-0007',
    email: 'carmen@celulares.com',
  },
  {
    id: '6',
    name: 'Roberto',
    fullName: 'Roberto Jiménez',
    service: 'Lavado de Autos a Domicilio',
    rating: 4.5,
    reviews: 112,
    location: 'Móvil - Todo San José',
    price: '₡5,000/lavado',
    image: '🚐',
    isSpecialProvider: false,
    isAmbulante: true,
    uniqueId: '2KPRJ456',
    phone: '+506 8888-0008',
    email: 'roberto@lavado.com',
  },
];

export default function SearchScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { hasActiveReservations } = useReservationPlans();
  const { getActiveProducts } = useK2GProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showK2GProducts, setShowK2GProducts] = useState(false);
  const [showAmbulanteProviders, setShowAmbulanteProviders] = useState(false);
  const [idSearchQuery, setIdSearchQuery] = useState('');
  const [idSearchResults, setIdSearchResults] = useState<any[]>([]);
  const [showIdSearch, setShowIdSearch] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const resultsRef = useRef<View>(null);
  
  const k2gProducts = getActiveProducts();
  
  const serviceCategories = [
    { id: 1, name: 'K2G Products', icon: '🚀', providers: k2gProducts.length, isK2G: true },
    ...baseServiceCategories,
  ];
  
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
  
  const handleCategorySearch = async (categoryName: string, categoryId: number) => {
    if (!categoryName?.trim() || categoryName.length > 50) return;
    const sanitizedName = categoryName.trim();
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    
    if (categoryId === 1) {
      // K2G Products category
      setShowK2GProducts(true);
      setShowAmbulanteProviders(false);
      // Scroll to results after state update
      setTimeout(() => {
        scrollToResults();
      }, 100);
    } else if (categoryId === 2) {
      // Ambulantes category
      setShowAmbulanteProviders(true);
      setShowK2GProducts(false);
      // Scroll to results after state update
      setTimeout(() => {
        scrollToResults();
      }, 100);
    } else {
      setShowK2GProducts(false);
      setShowAmbulanteProviders(false);
      await searchProviders(sanitizedName);
    }
  };
  
  const handleTextSearch = async () => {
    if (searchQuery.trim()) {
      await searchProviders(searchQuery.trim());
    }
  };

  const handleIdSearch = () => {
    if (!idSearchQuery.trim()) {
      Alert.alert('Error', 'Por favor ingresa un ID para buscar');
      return;
    }

    const searchId = idSearchQuery.trim().toUpperCase();
    console.log('🔍 Searching for ID:', searchId);
    
    // Search in featured providers
    const results = featuredProviders.filter(provider => 
      provider.uniqueId?.toUpperCase().includes(searchId)
    );
    
    console.log('🔍 ID search results:', results);
    
    if (results.length === 0) {
      Alert.alert('Sin resultados', `No se encontraron usuarios con el ID: ${searchId}`);
      return;
    }
    
    setIdSearchResults(results);
    setShowIdSearch(true);
    setShowK2GProducts(false);
    setShowAmbulanteProviders(false);
    setSelectedCategory(null);
    
    // Scroll to results
    setTimeout(() => {
      scrollToResults();
    }, 100);
  };

  const showContactInfo = (provider: any) => {
    Alert.alert(
      `Contactar a ${provider.name}`,
      `ID: ${provider.uniqueId}\nTeléfono: ${provider.phone}\nEmail: ${provider.email}\nServicio: ${provider.service}`,
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Llamar', onPress: () => console.log('Calling:', provider.phone) },
        { text: 'Email', onPress: () => console.log('Emailing:', provider.email) }
      ]
    );
  };

  const scrollToResults = () => {
    if (resultsRef.current && scrollViewRef.current) {
      resultsRef.current.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
        },
        () => {}
      );
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
    // Sakura Beauty Salon and Neko Studios don't require reservation pass
    if (provider.isSpecialProvider || provider.id === '999' || provider.id === '998') return true;
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
                onPress={() => {
                  router.push('/purchase-plan');
                }}
              >
                <Text style={styles.restrictedButtonText}>Ver Planes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.restrictedButton, styles.primaryRestrictedButton]}
                onPress={() => {
                  router.push('/(tabs)/?modal=purchase');
                }}
              >
                <Text style={[styles.restrictedButtonText, styles.primaryRestrictedButtonText]}>Comprar pase de reserva</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Auto-scroll to results when search results are found
  useEffect(() => {
    if (foundProviders.length > 0) {
      setTimeout(() => {
        scrollToResults();
      }, 100);
    }
  }, [foundProviders.length]);

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
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

        {/* ID Search Section */}
        <View style={styles.idSearchContainer}>
          <Text style={styles.idSearchLabel}>Buscar por ID de Usuario:</Text>
          <View style={styles.idSearchBar}>
            <Hash size={18} color="#666" />
            <TextInput
              style={styles.idSearchInput}
              placeholder="Ej: 2KPSK789 o MKPXY123"
              value={idSearchQuery}
              onChangeText={setIdSearchQuery}
              onSubmitEditing={handleIdSearch}
              placeholderTextColor="#666"
              returnKeyType="search"
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={styles.idSearchButton}
              onPress={handleIdSearch}
            >
              <Text style={styles.idSearchButtonText}>Buscar</Text>
            </TouchableOpacity>
          </View>
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
                onPress={() => handleCategorySearch(category.name, category.id)}
              >
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{category.providers} {t('providers_count')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View ref={resultsRef} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {showIdSearch ? `Resultados de ID: ${idSearchQuery}` :
             showK2GProducts ? 'K2G Products' : 
             showAmbulanteProviders ? 'Proveedores Ambulantes' :
             foundProviders.length > 0 ? 'Proveedores Encontrados' : t('featured_providers')}
          </Text>
          
          {/* Show ID Search Results */}
          {showIdSearch ? (
            idSearchResults.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[styles.providerCard, styles.idSearchResultCard]}
                onPress={() => showContactInfo(provider)}
              >
                <View style={styles.providerHeader}>
                  <Text style={styles.providerImage}>{provider.image}</Text>
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>{provider.name}</Text>
                    <Text style={styles.providerService}>{provider.service}</Text>
                    <Text style={styles.providerUniqueId}>ID: {provider.uniqueId}</Text>
                    <View style={styles.providerMeta}>
                      <View style={styles.rating}>
                        <Star size={14} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.ratingText}>{provider.rating}</Text>
                        <Text style={styles.reviewsText}>({provider.reviews})</Text>
                      </View>
                      <View style={styles.location}>
                        <MapPin size={14} color="#666" />
                        <Text style={styles.locationText}>{provider.location}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.providerPrice}>
                    <Text style={styles.priceText}>{provider.price}</Text>
                  </View>
                </View>
                <View style={styles.contactActions}>
                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => console.log('Calling:', provider.phone)}
                  >
                    <Phone size={16} color="white" />
                    <Text style={styles.contactButtonText}>Llamar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.contactButton, styles.emailButton]}
                    onPress={() => console.log('Emailing:', provider.email)}
                  >
                    <Mail size={16} color="white" />
                    <Text style={styles.contactButtonText}>Email</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : showK2GProducts ? (
            k2gProducts.length > 0 ? (
              k2gProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => {
                    // Navigate to product details or contact
                    console.log('K2G Product selected:', product.name);
                  }}
                >
                  <View style={styles.productHeader}>
                    <Text style={styles.productIcon}>🚀</Text>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productDescription}>{product.description}</Text>
                      <Text style={styles.productPrice}>{product.price}</Text>
                    </View>
                  </View>
                  <View style={styles.k2gBadge}>
                    <Text style={styles.k2gBadgeText}>K2G Official</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No hay productos K2G disponibles</Text>
              </View>
            )
          ) : showAmbulanteProviders ? (
            /* Show Ambulante Providers */
            featuredProviders
              .filter(provider => provider.isAmbulante)
              .map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={[styles.providerCard, styles.ambulanteProviderCard]}
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
                        <View style={styles.location}>
                          <MapPin size={14} color="#666" />
                          <Text style={styles.locationText}>{provider.location}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.providerPrice}>
                      <Text style={styles.priceText}>{provider.price}</Text>
                    </View>
                  </View>
                  <View style={styles.ambulanteBadge}>
                    <Text style={styles.ambulanteBadgeText}>🚚 Servicio Móvil</Text>
                  </View>
                </TouchableOpacity>
              ))
          ) : (
            /* Show search results or featured providers */
            foundProviders.length > 0 ? (
              foundProviders
                .sort((a, b) => {
                  // Always put special providers first (Sakura Beauty Salon and Neko Studios)
                  if (a.isSpecialProvider || a.id === '999' || a.id === '998') return -1;
                  if (b.isSpecialProvider || b.id === '999' || b.id === '998') return 1;
                  return 0;
                })
                .map((provider) => renderProviderCard(provider))
            ) : (
              /* Show default featured providers */
              featuredProviders.map((provider) => renderProviderCard(provider))
            )
          )}
        </View>

        {/* Reset Search Button */}
        {(foundProviders.length > 0 || showK2GProducts || showAmbulanteProviders || showIdSearch) && (
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              resetSearch();
              setShowK2GProducts(false);
              setShowAmbulanteProviders(false);
              setShowIdSearch(false);
              setIdSearchResults([]);
              setIdSearchQuery('');
              setSelectedCategory(null);
            }}
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
    gap: 8,
  },
  categoryCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: (width - 80) / 4,
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
    fontSize: 24,
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
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
  productCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#D81B60',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  productIcon: {
    fontSize: 40,
    width: 60,
    height: 60,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: 'rgba(216, 27, 96, 0.1)',
    borderRadius: 30,
  },
  productInfo: {
    flex: 1,
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
    fontWeight: 'bold',
    color: '#D81B60',
  },
  k2gBadge: {
    backgroundColor: '#D81B60',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  k2gBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  ambulanteProviderCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  ambulanteBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  ambulanteBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  // ID Search Styles
  idSearchContainer: {
    marginBottom: 16,
  },
  idSearchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  idSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  idSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  idSearchButton: {
    backgroundColor: '#D81B60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  idSearchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Category Content
  categoryContent: {
    alignItems: 'center',
  },
  // ID Search Results
  idSearchResultCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  providerUniqueId: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
    marginBottom: 4,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#D81B60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  emailButton: {
    backgroundColor: '#007AFF',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});