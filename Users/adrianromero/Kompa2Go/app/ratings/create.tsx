import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useRating } from '@/contexts/RatingContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

export default function CreateRatingScreen() {
  const { tripId, serviceId, targetUserId, targetUserName, type } = useLocalSearchParams<{
    tripId?: string;
    serviceId?: string;
    targetUserId: string;
    targetUserName: string;
    type: 'trip' | 'service';
  }>();

  const { user } = useFirebaseAuth();
  const { createRating } = useRating();

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [categories, setCategories] = useState({
    punctuality: 5,
    communication: 5,
    cleanliness: 5,
    professionalism: 5,
    quality: 5,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!user?.uid || !targetUserId) {
      Alert.alert('Error', 'Información de usuario no disponible');
      return;
    }

    try {
      setLoading(true);
      await createRating({
        type: type || 'trip',
        relatedId: tripId || serviceId || '',
        fromUserId: user.uid,
        fromUserName: user.displayName || 'Usuario',
        fromUserRole: 'client',
        toUserId: targetUserId,
        toUserName: targetUserName,
        toUserRole: type === 'trip' ? 'kommuter' : 'provider',
        rating,
        categories,
        comment: comment.trim() || undefined,
        status: 'published',
        helpful: 0,
        reported: false,
      });

      Alert.alert('Éxito', 'Calificación enviada correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error creating rating:', error);
      Alert.alert('Error', 'No se pudo enviar la calificación');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (value: number, onChange: (value: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onChange(star)}>
            <Star
              size={32}
              color={star <= value ? '#FFD700' : '#E0E0E0'}
              fill={star <= value ? '#FFD700' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Calificar',
          headerStyle: { backgroundColor: '#6366F1' },
          headerTintColor: '#FFFFFF',
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calificando a</Text>
          <Text style={styles.targetName}>{targetUserName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calificación General</Text>
          {renderStars(rating, setRating)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías</Text>

          <View style={styles.categoryItem}>
            <Text style={styles.categoryLabel}>Puntualidad</Text>
            {renderStars(categories.punctuality, (value) =>
              setCategories({ ...categories, punctuality: value })
            )}
          </View>

          <View style={styles.categoryItem}>
            <Text style={styles.categoryLabel}>Comunicación</Text>
            {renderStars(categories.communication, (value) =>
              setCategories({ ...categories, communication: value })
            )}
          </View>

          <View style={styles.categoryItem}>
            <Text style={styles.categoryLabel}>Limpieza</Text>
            {renderStars(categories.cleanliness, (value) =>
              setCategories({ ...categories, cleanliness: value })
            )}
          </View>

          <View style={styles.categoryItem}>
            <Text style={styles.categoryLabel}>Profesionalismo</Text>
            {renderStars(categories.professionalism, (value) =>
              setCategories({ ...categories, professionalism: value })
            )}
          </View>

          <View style={styles.categoryItem}>
            <Text style={styles.categoryLabel}>Calidad</Text>
            {renderStars(categories.quality, (value) =>
              setCategories({ ...categories, quality: value })
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comentario (Opcional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Comparte tu experiencia..."
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Enviando...' : 'Enviar Calificación'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 12,
  },
  targetName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#6366F1',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#666',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
