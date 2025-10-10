import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { Search, Book, MessageCircle, HelpCircle, ChevronRight } from 'lucide-react-native';
import { useHelp } from '@/contexts/HelpContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpCenterScreen() {
  const { articles, faqs, loadArticles, loadFAQs, searchArticles } = useHelp();
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadArticles();
    loadFAQs();
  }, [loadArticles, loadFAQs]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchArticles(searchQuery);
    } else {
      loadArticles();
    }
  };

  const categories = [
    { id: 'getting-started', name: 'Comenzar', icon: Book },
    { id: 'trips', name: 'Viajes', icon: MessageCircle },
    { id: 'payments', name: 'Pagos', icon: HelpCircle },
    { id: 'safety', name: 'Seguridad', icon: HelpCircle },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Centro de Ayuda',
          headerStyle: { backgroundColor: '#6366F1' },
          headerTintColor: '#FFFFFF',
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar artículos de ayuda..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => router.push(`/help/category/${category.id}` as any)}
              >
                <category.icon size={32} color="#6366F1" />
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Artículos Populares</Text>
            <TouchableOpacity onPress={() => router.push('/help/articles' as any)}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {articles.slice(0, 5).map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleItem}
              onPress={() => router.push(`/help/article/${article.id}` as any)}
            >
              <View style={styles.articleContent}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleViews}>{article.views} vistas</Text>
              </View>
              <ChevronRight size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
            <TouchableOpacity onPress={() => router.push('/help/faqs' as any)}>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {faqs.slice(0, 5).map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqItem}
              onPress={() => router.push(`/help/faq/${faq.id}` as any)}
            >
              <View style={styles.faqContent}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
              </View>
              <ChevronRight size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => router.push('/help/contact' as any)}
        >
          <MessageCircle size={24} color="#FFFFFF" />
          <Text style={styles.contactButtonText}>Contactar Soporte</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  section: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600' as const,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  articleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  articleContent: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#333',
    marginBottom: 4,
  },
  articleViews: {
    fontSize: 12,
    color: '#999',
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  faqContent: {
    flex: 1,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#333',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    gap: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
