import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Platform, Modal, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';

import { useOKoins } from '@/contexts/OKoinsContext';
import { TrendingUp, DollarSign, Gift, History, Star, Coins } from 'lucide-react-native';
import FloatingKompi from '@/components/FloatingKompi';
import { router } from 'expo-router';



export default function ProgramasScreen() {
  const { user } = useAuth();
  const { balance, getTransactionHistory, isLoading } = useOKoins();
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Show different content for providers
  if (user?.userType === 'provider') {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <LinearGradient
            colors={['#D81B60', '#E91E63']}
            style={styles.header}
          >
            <Text style={styles.title}>Programas</Text>
            <Text style={styles.subtitle}>Próximamente disponible</Text>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.comingSoonProviderCard}>
              <Gift size={48} color="#D81B60" />
              <Text style={styles.comingSoonProviderTitle}>Programas de Participación</Text>
              <Text style={styles.comingSoonProviderDescription}>
                Pronto estarán disponibles programas de participación para aumentar su visibilidad y audiencia.
              </Text>
              <Text style={styles.comingSoonProviderSubtext}>
                Manténgase atento a las actualizaciones.
              </Text>
            </View>
          </View>
        </ScrollView>
        <FloatingKompi isVisible={true} />
      </View>
    );
  }

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
    console.log('🚀 Refiere amigos button pressed');
    
    try {
      const referralLink = `https://kompa2go.com/referral/${user?.id || 'guest'}`;
      console.log('🔗 Generated referral link:', referralLink);
      
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected - copying link');
        
        // Para web: copiar enlace y mostrar modal simple
        setReferralLink(referralLink);
        setShowReferralModal(true);
        
        // Intentar copiar al portapapeles sin usar la API problemática
        try {
          // Crear elemento temporal para copiar
          const textArea = document.createElement('textarea');
          textArea.value = referralLink;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          console.log('✅ Link copied using fallback method');
        } catch (copyError) {
          console.log('📋 Copy fallback failed, user will copy manually');
        }
        
      } else {
        console.log('📱 Mobile platform detected - showing native modal');
        
        // Para móvil: mostrar modal nativo del sistema operativo
        setReferralLink(referralLink);
        setShowReferralModal(true);
      }
      
    } catch (generalError) {
      console.error('❌ General error:', generalError);
      setErrorMessage('Ocurrió un error. Intenta de nuevo.');
      setShowErrorModal(true);
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
          <View style={styles.comingSoonCard}>
            <Gift size={32} color="#D81B60" />
            <Text style={styles.comingSoonTitle}>Próximamente</Text>
            <Text style={styles.comingSoonDescription}>
              Pronto estarán disponibles programas especiales para usar tus OKoins y obtener beneficios exclusivos.
            </Text>
          </View>
        </View>
      </ScrollView>
      <FloatingKompi isVisible={true} />
      
      {/* Referral Modal */}
      <Modal
        animationType={Platform.OS === 'ios' ? 'slide' : 'fade'}
        transparent={true}
        visible={showReferralModal}
        onRequestClose={() => setShowReferralModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            Platform.OS === 'ios' && styles.iosModalContent,
            Platform.OS === 'android' && styles.androidModalContent,
            Platform.OS === 'web' && styles.webModalContent
          ]}>
            <Text style={styles.modalTitle}>🎉 ¡Refiere amigos y gana OKoins!</Text>
            <Text style={styles.modalDescription}>
              {Platform.OS === 'web' 
                ? 'Tu enlace de referido se ha copiado automáticamente:'
                : 'Comparte este enlace con tus amigos:'
              }
            </Text>
            
            <View style={styles.linkContainer}>
              <Text style={styles.linkText} selectable={true}>
                {referralLink}
              </Text>
            </View>
            
            <Text style={styles.modalSubtext}>
              ¡Gana 100 OKoins por cada amigo que se registre usando tu enlace!
            </Text>
            
            <View style={styles.modalButtons}>
              {Platform.OS !== 'web' && (
                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={async () => {
                    const message = `¡Únete a Kompa2Go y gana 100 OKoins gratis! 🎉\n\nUsa mi código de referido:\n${referralLink}\n\n¡Descarga la app y comienza a ganar OKoins hoy!`;
                    
                    try {
                      const result = await Share.share({
                        message: message,
                        url: referralLink,
                        title: 'Únete a Kompa2Go'
                      });
                      
                      if (result.action === Share.sharedAction) {
                        console.log('✅ Content shared successfully');
                      }
                    } catch (shareError) {
                      console.error('❌ Share error:', shareError);
                      Alert.alert('Error', 'No se pudo compartir el enlace');
                    }
                    
                    setShowReferralModal(false);
                  }}
                >
                  <Text style={styles.shareButtonText}>📤 Compartir</Text>
                </TouchableOpacity>
              )}
              
              {Platform.OS !== 'web' && (
                <TouchableOpacity 
                  style={styles.copyButton}
                  onPress={async () => {
                    try {
                      await Clipboard.setString(referralLink);
                      Alert.alert('¡Copiado!', 'El enlace se ha copiado al portapapeles');
                    } catch (error) {
                      Alert.alert('Error', 'No se pudo copiar el enlace');
                    }
                    setShowReferralModal(false);
                  }}
                >
                  <Text style={styles.copyButtonText}>📋 Copiar enlace</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowReferralModal(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Error Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showErrorModal}
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Error</Text>
            <Text style={styles.modalDescription}>
              {errorMessage}
            </Text>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  comingSoonProviderCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 20,
  },
  comingSoonProviderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D81B60',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonProviderDescription: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  comingSoonProviderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D81B60',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  linkContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  linkText: {
    fontSize: 14,
    color: '#D81B60',
    textAlign: 'center',
    fontWeight: '600',
  },
  modalSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    gap: 12,
  },
  iosModalContent: {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  androidModalContent: {
    borderRadius: 8,
    elevation: 16,
  },
  webModalContent: {
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  shareButton: {
    backgroundColor: '#D81B60',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: 16,
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  copyButton: {
    backgroundColor: '#2196F3',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: 16,
    alignItems: 'center',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});