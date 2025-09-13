import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Star, MapPin, MessageCircle, Calendar, Clock, Shield, Lock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useReservationPlans } from '@/contexts/ReservationPlansContext';
import { useChat } from '@/contexts/ChatContext';

const { width } = Dimensions.get('window');

const getProviderData = (id: string) => {
  const providers = {
    '1': {
      id: 1,
      name: 'María González',
      service: 'Limpieza Residencial',
      rating: 4.9,
      reviews: 127,
      location: 'San José Centro',
      price: '₡8,000/hora',
      image: '👩‍💼',
      description: 'Especialista en limpieza residencial con más de 5 años de experiencia. Ofrezco servicios de limpieza profunda, mantenimiento regular y organización de espacios.',
      services: [
        'Limpieza general',
        'Limpieza profunda',
        'Organización de espacios',
        'Limpieza de ventanas',
        'Limpieza de alfombras'
      ],
      availability: [
        'Lunes a Viernes: 8:00 AM - 6:00 PM',
        'Sábados: 9:00 AM - 4:00 PM',
        'Domingos: No disponible'
      ],
      gallery: ['🏠', '🧹', '✨', '🪟', '🛋️', '🧽'],
      isSpecialProvider: false
    },
    '2': {
      id: 2,
      name: 'Carlos Rodríguez',
      service: 'Plomería',
      rating: 4.8,
      reviews: 89,
      location: 'Escazú',
      price: '₡12,000/visita',
      image: '👨‍🔧',
      description: 'Plomero certificado con experiencia en reparaciones residenciales y comerciales.',
      services: [
        'Reparación de tuberías',
        'Instalación de grifos',
        'Destape de drenajes',
        'Reparación de inodoros'
      ],
      availability: [
        'Lunes a Sábado: 7:00 AM - 7:00 PM',
        'Domingos: Emergencias únicamente'
      ],
      gallery: ['🔧', '🚿', '🚽', '🔩', '⚒️', '🛠️'],
      isSpecialProvider: false
    },
    '3': {
      id: 3,
      name: 'Ana Jiménez',
      service: 'Jardinería',
      rating: 4.7,
      reviews: 64,
      location: 'Cartago',
      price: '₡15,000/día',
      image: '👩‍🌾',
      description: 'Especialista en diseño y mantenimiento de jardines con enfoque en plantas nativas.',
      services: [
        'Diseño de jardines',
        'Mantenimiento de césped',
        'Poda de árboles',
        'Siembra de plantas'
      ],
      availability: [
        'Lunes a Viernes: 6:00 AM - 4:00 PM',
        'Sábados: 6:00 AM - 12:00 PM'
      ],
      gallery: ['🌱', '🌸', '🌳', '🌿', '🌺', '🍃'],
      isSpecialProvider: false
    },
    '999': {
      id: 999,
      name: 'Sakura Beauty Salon',
      service: 'Servicios de Belleza',
      rating: 5.0,
      reviews: 250,
      location: 'San José Centro',
      price: '₡15,000/sesión',
      image: '🌸',
      description: 'Salón de belleza premium con servicios completos de estética y bienestar. Especialistas certificados en tratamientos faciales, corporales y de cabello.',
      services: [
        'Tratamientos faciales',
        'Masajes relajantes',
        'Manicure y pedicure',
        'Corte y peinado',
        'Tratamientos corporales',
        'Maquillaje profesional'
      ],
      availability: [
        'Lunes a Viernes: 9:00 AM - 7:00 PM',
        'Sábados: 8:00 AM - 6:00 PM',
        'Domingos: 10:00 AM - 4:00 PM'
      ],
      gallery: ['💅', '💆‍♀️', '💄', '✨', '🌸', '💖'],
      isSpecialProvider: true
    }
  };
  
  return providers[id as keyof typeof providers] || providers['1'];
};

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { hasActiveReservations } = useReservationPlans();
  const { createChat } = useChat();
  
  const provider = getProviderData(id as string);
  
  const canViewContactInfo = () => {
    if (!user || user.userType !== 'client') return true;
    if (provider.isSpecialProvider) return true;
    return hasActiveReservations();
  };

  const handleBooking = () => {
    if (canViewContactInfo()) {
      router.push(`/booking/${id}`);
    } else {
      // Redirect to plans page
      router.push('/pending-payments');
    }
  };

  const handleChat = async () => {
    if (!user || user.userType !== 'client') {
      router.push('/auth');
      return;
    }
    
    if (canViewContactInfo()) {
      try {
        const chatId = await createChat(provider.id.toString(), provider.name);
        router.push(`/chat/${chatId}`);
      } catch (error) {
        console.error('Error creating chat:', error);
      }
    } else {
      // Redirect to plans page
      router.push('/purchase-plan');
    }
  };
  
  const canView = canViewContactInfo();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.providerInfo}>
          <Text style={styles.providerImage}>{provider.image}</Text>
          <View style={styles.providerDetails}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <Text style={styles.providerService}>{provider.service}</Text>
            
            <View style={styles.rating}>
              <Star size={16} color="#FFD700" fill="#FFD700" />
              <Text style={styles.ratingText}>{provider.rating}</Text>
              <Text style={styles.reviewsText}>({provider.reviews} reseñas)</Text>
            </View>
            
            {canView && (
              <View style={styles.location}>
                <MapPin size={16} color="#666" />
                <Text style={styles.locationText}>{provider.location}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          {canView ? (
            <Text style={styles.priceText}>{provider.price}</Text>
          ) : (
            <View style={styles.restrictedPrice}>
              <Lock size={20} color="#999" />
              <Text style={styles.restrictedPriceText}>Plan requerido</Text>
            </View>
          )}
        </View>
      </View>
      
      {!canView && (
        <View style={styles.accessBanner}>
          <View style={styles.accessBannerContent}>
            <Lock size={24} color="#D81B60" />
            <View style={styles.accessBannerText}>
              <Text style={styles.accessBannerTitle}>Información Restringida</Text>
              <Text style={styles.accessBannerSubtitle}>
                Adquiere un plan de reservas para ver información de contacto y realizar reservas
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.accessBannerButton}
            onPress={() => router.push('/pending-payments')}
          >
            <Text style={styles.accessBannerButtonText}>Ver Planes</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{provider.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicios Ofrecidos</Text>
          <View style={styles.servicesList}>
            {provider.services.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <View style={styles.serviceBullet} />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>

        {canView && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Disponibilidad</Text>
              <View style={styles.availabilityList}>
                {provider.availability.map((schedule, index) => (
                  <View key={index} style={styles.availabilityItem}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.availabilityText}>{schedule}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Galería de Trabajos</Text>
          <View style={styles.gallery}>
            {provider.gallery.map((item, index) => (
              <View key={index} style={styles.galleryItem}>
                <Text style={styles.galleryEmoji}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.trustBadges}>
          <View style={styles.trustBadge}>
            <Shield size={20} color="#4CAF50" />
            <Text style={styles.trustText}>Verificado</Text>
          </View>
          <View style={styles.trustBadge}>
            <Star size={20} color="#FFD700" />
            <Text style={styles.trustText}>Top Rated</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        {canView ? (
          <>
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={handleChat}
            >
              <MessageCircle size={20} color="white" />
              <Text style={styles.chatButtonText}>Chatear</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={handleBooking}
            >
              <Calendar size={20} color="white" />
              <Text style={styles.bookButtonText}>Reservar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => router.push('/pending-payments')}
          >
            <Lock size={20} color="white" />
            <Text style={styles.upgradeButtonText}>Comprar pase de reserva</Text>
          </TouchableOpacity>
        )}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  providerImage: {
    fontSize: 60,
    width: 80,
    height: 80,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 40,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  providerService: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 16,
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
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    alignItems: 'center',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D81B60',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  servicesList: {
    gap: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D81B60',
  },
  serviceText: {
    fontSize: 16,
    color: '#333',
  },
  availabilityList: {
    gap: 8,
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  availabilityText: {
    fontSize: 16,
    color: '#333',
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  galleryItem: {
    width: (width - 80) / 3,
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryEmoji: {
    fontSize: 32,
  },
  trustBadges: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trustText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#666',
    paddingVertical: 16,
    borderRadius: 12,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D81B60',
    paddingVertical: 16,
    borderRadius: 12,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  restrictedPrice: {
    alignItems: 'center',
    gap: 4,
  },
  restrictedPriceText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  accessBanner: {
    backgroundColor: 'rgba(216, 27, 96, 0.05)',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(216, 27, 96, 0.2)',
  },
  accessBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  accessBannerText: {
    flex: 1,
  },
  accessBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 4,
  },
  accessBannerSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  accessBannerButton: {
    backgroundColor: '#D81B60',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  accessBannerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D81B60',
    paddingVertical: 16,
    borderRadius: 12,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});