import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Star, MapPin, MessageCircle, Calendar, Clock, Shield } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const mockProvider = {
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
  gallery: ['🏠', '🧹', '✨', '🪟', '🛋️', '🧽']
};

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams();

  const handleBooking = () => {
    router.push(`/booking/${id}`);
  };

  const handleChat = () => {
    router.push('/chat');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.providerInfo}>
          <Text style={styles.providerImage}>{mockProvider.image}</Text>
          <View style={styles.providerDetails}>
            <Text style={styles.providerName}>{mockProvider.name}</Text>
            <Text style={styles.providerService}>{mockProvider.service}</Text>
            
            <View style={styles.rating}>
              <Star size={16} color="#FFD700" fill="#FFD700" />
              <Text style={styles.ratingText}>{mockProvider.rating}</Text>
              <Text style={styles.reviewsText}>({mockProvider.reviews} reseñas)</Text>
            </View>
            
            <View style={styles.location}>
              <MapPin size={16} color="#666" />
              <Text style={styles.locationText}>{mockProvider.location}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{mockProvider.price}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{mockProvider.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicios Ofrecidos</Text>
          <View style={styles.servicesList}>
            {mockProvider.services.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <View style={styles.serviceBullet} />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilidad</Text>
          <View style={styles.availabilityList}>
            {mockProvider.availability.map((schedule, index) => (
              <View key={index} style={styles.availabilityItem}>
                <Clock size={16} color="#666" />
                <Text style={styles.availabilityText}>{schedule}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Galería de Trabajos</Text>
          <View style={styles.gallery}>
            {mockProvider.gallery.map((item, index) => (
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
});