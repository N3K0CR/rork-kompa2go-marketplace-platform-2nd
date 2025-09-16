import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';

import { useOKoins } from '@/contexts/OKoinsContext';
import { TrendingUp, DollarSign, Gift, History, Star, Coins } from 'lucide-react-native';
import FloatingKompi from '@/components/FloatingKompi';
import { router } from 'expo-router';



export default function ProgramasScreen() {
  const { user } = useAuth();

  const { balance, getTransactionHistory, isLoading } = useOKoins();

  // Only show for clients
  if (user?.userType !== 'client') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Esta función no está disponible para tu tipo de usuario</Text>
      </View>
    );
  }

  const recentTransactions = getTransactionHistory().slice(0, 5);
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={['#D81B60', '#E91E63']}
          style={styles.header}
        >
          <Text style={styles.title}>Programas</Text>
          <Text style={styles.subtitle}>OKoins y beneficios especiales</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* OKoins Balance Card */}
          <View style={styles.okoinsCard}>
            <View style={styles.okoinsHeader}>
              <View style={styles.okoinsIconContainer}>
                <Coins size={32} color="#FFD700" />
              </View>
              <View style={styles.okoinsInfo}>
                <Text style={styles.okoinsLabel}>Tu saldo OKoins</Text>
                <Text style={styles.okoinsBalance}>{isLoading ? '...' : balance.toLocaleString()}</Text>
              </View>
            </View>
            <Text style={styles.okoinsDescription}>
              Usa OKoins para obtener descuentos, acceder a servicios premium y participar en rifas especiales.
            </Text>
          </View>

          {/* How to Earn OKoins */}
          <View style={styles.earnSection}>
            <Text style={styles.sectionTitle}>¿Cómo ganar OKoins?</Text>
            <View style={styles.earnMethods}>
              <TouchableOpacity 
                style={styles.earnMethod}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Star size={20} color="#FFD700" />
                <Text style={styles.earnMethodText}>Completa servicios (+50 OKoins)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.earnMethod}
                onPress={() => {
                  router.push('/(tabs)/profile');
                  // Navigate to history section within profile
                  setTimeout(() => {
                    router.push('/client/history');
                  }, 100);
                }}
              >
                <Star size={20} color="#FFD700" />
                <Text style={styles.earnMethodText}>Califica proveedores (+10 OKoins)</Text>
              </TouchableOpacity>
<TouchableOpacity 
  style={styles.earnMethod}
  onPress={async () => {
    console.log('Refiere amigos button pressed');
    
    try {
      const referralLink = `https://kompa2go.com/referral/${user?.id || 'guest'}`;
      const message = `¡Únete a Kompa2Go y gana 100 OKoins gratis! 🎉\n\nUsa mi código de referido para obtener beneficios exclusivos:\n${referralLink}\n\n¡Descarga la app y comienza a ganar OKoins hoy!`;
      
      console.log('About to share:', { message, referralLink });
      
      if (Platform.OS === 'web') {
        // Para web, mostrar el enlace en un alert simple
        const shortMessage = `¡Únete a Kompa2Go y gana 100 OKoins gratis! 🎉`;
        
        Alert.alert(
          'Compartir enlace de referido',
          `${shortMessage}\n\nTu enlace de referido:\n${referralLink}\n\n¡Compártelo en tus redes sociales para ganar 100 OKoins por cada amigo que se registre!`,
          [
            {
              text: 'WhatsApp',
              onPress: () => {
                console.log('Opening WhatsApp share');
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shortMessage + ' ' + referralLink)}`;
                try {
                  if (typeof window !== 'undefined') {
                    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                  }
                } catch (error) {
                  console.error('Error opening WhatsApp:', error);
                  Alert.alert('Error', 'No se pudo abrir WhatsApp');
                }
              }
            },
            {
              text: 'Copiar enlace',
              onPress: async () => {
                console.log('Copying link');
                try {
                  if (navigator.clipboard) {
                    await navigator.clipboard.writeText(referralLink);
                    Alert.alert('¡Copiado!', 'El enlace se ha copiado al portapapeles');
                  } else {
                    // Fallback para navegadores más antiguos
                    Alert.alert(
                      'Enlace de referido',
                      `Copia este enlace manualmente:\n\n${referralLink}`,
                      [{ text: 'OK' }]
                    );
                  }
                } catch (error) {
                  console.error('Error copying:', error);
                  Alert.alert(
                    'Enlace de referido',
                    `Copia este enlace manualmente:\n\n${referralLink}`,
                    [{ text: 'OK' }]
                  );
                }
              }
            },
            { text: 'Cerrar', style: 'cancel' }
          ]
        );
      } else {
        // Para móvil - usar Share nativo
        try {
          const result = await Share.share({
            message: message,
            url: referralLink,
            title: 'Únete a Kompa2Go'
          });
          
          console.log('Share result:', result);
          
          if (result.action === Share.sharedAction) {
            console.log('Content was shared successfully');
          } else if (result.action === Share.dismissedAction) {
            console.log('Share dialog was dismissed');
          }
        } catch (error) {
          console.error('Share error:', error);
          Alert.alert(
            'Error al compartir',
            'No se pudo abrir el diálogo de compartir. Tu enlace de referido es:\n\n' + referralLink,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error general en compartir:', error);
      Alert.alert('Error', 'Ocurrió un error al intentar compartir. Intenta de nuevo.');
    }
  }}
>
  <Star size={20} color="#FFD700" />
  <Text style={styles.earnMethodText}>Refiere amigos (+100 OKoins)</Text>
</TouchableOpacity>
              <View style={styles.earnMethod}>
                <Star size={20} color="#FFD700" />
                <Text style={styles.earnMethodText}>Bono diario de login y reserva (+5 OKoins)</Text>
              </View>
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.transactionsHeader}>
              <Text style={styles.sectionTitle}>Historial Reciente</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>Ver todo</Text>
              </TouchableOpacity>
            </View>
            
            {recentTransactions.length > 0 ? (
              <View style={styles.transactionsList}>
                {recentTransactions.map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={[
                      styles.transactionIcon,
                      transaction.type === 'earned' ? styles.earnedIcon : styles.spentIcon
                    ]}>
                      {transaction.type === 'earned' ? (
                        <TrendingUp size={16} color="white" />
                      ) : (
                        <DollarSign size={16} color="white" />
                      )}
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionReason}>{transaction.reason}</Text>
                      <Text style={styles.transactionDate}>
                        {transaction.timestamp.toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[
                      styles.transactionAmount,
                      transaction.type === 'earned' ? styles.earnedAmount : styles.spentAmount
                    ]}>
                      {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyTransactions}>
                <History size={48} color="#CCC" />
                <Text style={styles.emptyTransactionsText}>No hay transacciones aún</Text>
                <Text style={styles.emptyTransactionsSubtext}>Completa tu primer servicio para ganar OKoins</Text>
              </View>
            )}
          </View>

          {/* Special Programs */}
          <Text style={styles.sectionTitle}>Programas Especiales</Text>
          <Text style={styles.sectionDescription}>
            Próximamente: Kraffles, descuentos exclusivos y más beneficios con OKoins.
          </Text>

          <View style={styles.comingSoonCard}>
            <Gift size={32} color="#D81B60" />
            <Text style={styles.comingSoonTitle}>Kraffles</Text>
            <Text style={styles.comingSoonDescription}>
              Participa en rifas exclusivas usando tus OKoins. ¡Próximamente disponible!
            </Text>
          </View>
        </View>
      </ScrollView>
      <FloatingKompi isVisible={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  // OKoins specific styles
  okoinsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  okoinsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  okoinsIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  okoinsInfo: {
    flex: 1,
  },
  okoinsLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  okoinsBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D81B60',
  },
  okoinsDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  earnSection: {
    marginBottom: 24,
  },
  earnMethods: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earnMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  earnMethodText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  transactionsSection: {
    marginBottom: 24,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#D81B60',
    fontWeight: '600',
  },
  transactionsList: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  earnedIcon: {
    backgroundColor: '#4CAF50',
  },
  spentIcon: {
    backgroundColor: '#FF5722',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionReason: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  earnedAmount: {
    color: '#4CAF50',
  },
  spentAmount: {
    color: '#FF5722',
  },
  emptyTransactions: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTransactionsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTransactionsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  comingSoonCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    borderStyle: 'dashed',
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D81B60',
    marginTop: 12,
    marginBottom: 8,
  },
  comingSoonDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});