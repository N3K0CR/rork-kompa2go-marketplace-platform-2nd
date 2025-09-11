import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Settings, CreditCard, History, LogOut, Shield, Calendar, Users, BarChart3, Star, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  const handleSignOut = () => {
    Alert.alert(
      t('sign_out'),
      t('sign_out_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('sign_out'), 
          style: 'destructive',
          onPress: () => {
            signOut();
            router.replace('/auth');
          }
        },
      ]
    );
  };

  const handleMenuPress = (action: string) => {
    switch (action) {
      case 'edit_profile':
        if (user?.userType === 'provider') {
          router.push('/provider/edit-profile');
        } else {
          Alert.alert(t('edit_profile'), 'Funcionalidad en desarrollo');
        }
        break;
      case 'wallet':
        if (user?.userType === 'client') {
          Alert.alert(t('my_wallet'), 'Funcionalidad de billetera en desarrollo');
        } else {
          Alert.alert(t('my_wallet'), 'Esta función no está disponible para proveedores');
        }
        break;
      case 'history':
        if (user?.userType === 'provider') {
          router.push('/provider/history');
        } else {
          Alert.alert(t('historical'), 'Historial de servicios en desarrollo');
        }
        break;
      case 'settings':
        Alert.alert(t('configurations'), 'Configuraciones en desarrollo');
        break;
      case 'calendar':
        router.push('/(tabs)/calendar');
        break;
      case 'collaborators':
        router.push('/collaborators');
        break;
      case 'rating':
        Alert.alert(
          t('rating_summary'),
          `${t('total_rated_services')}: 127\nCalificación promedio: 4.8/5.0\n\n${t('rating_tips')}:\n• Responde rápidamente a los mensajes\n• Llega puntual a las citas\n• Mantén alta calidad en el servicio\n• Solicita feedback a tus clientes`
        );
        break;
      case 'services':
        Alert.alert(
          t('services_analytics'),
          `${t('most_popular_services')}:\n• Limpieza General (45 servicios)\n• Limpieza Profunda (32 servicios)\n• Organización (28 servicios)\n• Limpieza de Ventanas (22 servicios)`
        );
        break;
      case 'revenue':
        Alert.alert(
          t('revenue_breakdown'),
          `Ingresos del mes: ₡450,000\n\n${t('filter_by_week')}:\n• Semana 1: ₡120,000\n• Semana 2: ₡110,000\n• Semana 3: ₡105,000\n• Semana 4: ₡115,000\n\n${t('revenue_improvement_guide')}:\n• Agrega promociones\n• Mejora tu calificación\n• Actualiza tu galería de trabajos`
        );
        break;
      default:
        Alert.alert('Funcionalidad', 'En desarrollo');
    }
  };

  const menuItems = [
    { icon: User, title: t('edit_profile'), subtitle: t('update_personal_info'), action: 'edit_profile' },
    ...(user?.userType === 'client' ? [{ icon: CreditCard, title: t('my_wallet'), subtitle: t('manage_credits_payments'), action: 'wallet' }] : []),
    { icon: History, title: t('historical'), subtitle: t('view_previous_bookings'), action: 'history' },
    ...(user?.userType !== 'provider' ? [{ icon: Settings, title: t('configurations'), subtitle: t('app_preferences'), action: 'settings' }] : []),
  ];

  if (user?.userType === 'provider') {
    menuItems.splice(2, 0, 
      { icon: Calendar, title: t('my_calendar'), subtitle: t('manage_availability'), action: 'calendar' },
      { icon: Users, title: t('collaborators'), subtitle: t('manage_team'), action: 'collaborators' }
    );
  }

  if (user?.userType === 'admin') {
    menuItems.splice(1, 0,
      { icon: Shield, title: t('admin_panel'), subtitle: t('manage_platform'), action: 'admin_panel' }
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || t('user')}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.userTypeBadge}>
            <Text style={styles.userTypeText}>
              {user?.userType === 'client' && t('client_mikompa')}
              {user?.userType === 'provider' && t('provider_2kompa')}
              {user?.userType === 'admin' && t('administrator')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {user?.userType === 'client' && (
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <CreditCard size={24} color="#D81B60" />
              <Text style={styles.walletTitle}>{t('my_wallet')}</Text>
            </View>
            <Text style={styles.walletBalance}>₡25,000</Text>
            <Text style={styles.walletSubtitle}>{t('available_credits')}</Text>
            <TouchableOpacity style={styles.addCreditsButton}>
              <Text style={styles.addCreditsText}>{t('add_credits')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {user?.userType === 'provider' && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>{t('statistics')}</Text>
            <View style={styles.statsRow}>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => handleMenuPress('rating')}
              >
                <Star size={20} color="#FFD700" />
                <Text style={styles.statNumber}>4.8</Text>
                <Text style={styles.statLabel}>Calificación</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => handleMenuPress('services')}
              >
                <BarChart3 size={20} color="#2196F3" />
                <Text style={styles.statNumber}>127</Text>
                <Text style={styles.statLabel}>Servicios</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => handleMenuPress('revenue')}
              >
                <TrendingUp size={20} color="#4CAF50" />
                <Text style={styles.statNumber}>₡450K</Text>
                <Text style={styles.statLabel}>Ingresos</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.action)}
              >
                <IconComponent size={24} color="#D81B60" />
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#FF4444" />
          <Text style={styles.signOutText}>{t('sign_out')}</Text>
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
    backgroundColor: '#D81B60',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  userTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  walletCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 4,
  },
  walletSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  addCreditsButton: {
    backgroundColor: '#D81B60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addCreditsText: {
    color: 'white',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
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
  },
  menuSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});