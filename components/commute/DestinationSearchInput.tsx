import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { MapPin, X, Navigation } from 'lucide-react-native';
import { useDestinationSearch } from '@/src/modules/commute/hooks/useDestinationSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { PlaceResult, PlaceDetails, PlacesService } from '@/src/modules/commute/services/places-service';

interface Props {
  onSelectDestination: (place: PlaceDetails) => void;
  placeholder?: string;
  initialValue?: string;
  userLocation?: { latitude: number; longitude: number };
}

export function DestinationSearchInput({
  onSelectDestination,
  placeholder = '¿A dónde vas?',
  initialValue = '',
  userLocation,
}: Props) {
  const [query, setQuery] = useState(initialValue);
  const debouncedQuery = useDebounce(query, 500);
  
  const { results, loading, error, search, clearResults, clearError } = useDestinationSearch(userLocation);

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.trim().length >= 2) {
      search(debouncedQuery);
    } else {
      clearResults();
    }
  }, [debouncedQuery, search, clearResults]);

  const handleClear = () => {
    setQuery('');
    clearResults();
    clearError();
  };

  const handleSelectPlace = async (place: PlaceResult) => {
    try {
      const details = await PlacesService.getPlaceDetails(place.place_id);
      
      setQuery(place.structured_formatting.main_text);
      
      clearResults();
      
      onSelectDestination(details);
      
    } catch (error) {
      console.error('Error obteniendo detalles del lugar:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <MapPin size={20} color="#666" style={styles.icon} />
        
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          placeholderTextColor="#999"
        />

        {loading && (
          <ActivityIndicator 
            size="small" 
            color="#007AFF" 
            style={styles.loader}
          />
        )}

        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <X size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorDismiss}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectPlace(item)}
                style={styles.resultItem}
              >
                <Navigation size={18} color="#007AFF" style={styles.resultIcon} />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultMainText}>
                    {item.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.resultSecondaryText}>
                    {item.structured_formatting.secondary_text}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
  },
  loader: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fee',
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    color: '#c00',
    fontSize: 14,
  },
  errorDismiss: {
    color: '#c00',
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  resultsContainer: {
    maxHeight: 300,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  resultIcon: {
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultMainText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
  },
  resultSecondaryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
});
