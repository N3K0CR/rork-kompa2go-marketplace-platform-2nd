import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOKoins } from '@/contexts/OKoinsContext';
import { BarChart3, Users, DollarSign, Calendar, TrendingUp, AlertTriangle, CheckCircle, Package, Lock, Crown, Truck, Gift, Award, Coins, History, Star } from 'lucide-react-native';
import FloatingKompi from '@/components/FloatingKompi';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface Program {
  id: string;
  name: string;
  description: string;
  cost: string;
  requirements: string[];
  isLocked: boolean;
  icon: any;
  color: string;
}

const programs: Program[] = [
  {
    id: 'sakura_contigo',
    name: 'Sakura Contigo',
    description: 'Certificación premium que desbloquea funciones avanzadas y mejor comisión compartida.',
    cost: '₡20,000',
    requirements: ['Logro K2G-Ultra', 'Calificación 4.8+', '100+ servicios completados'],
    isLocked: true,
    icon: Crown,
    color: '#FFD700'
  },
  {
    id: 'kompa2door',
    name: 'Kompa2Door',
    description: 'Servicio de entrega integrado con seguimiento en tiempo real para proveedores que venden productos.',
    cost: 'Gratis',
    requirements: ['Logro K2G-Gold', 'Venta de productos habilitada'],
    isLocked: true,
    icon: Truck,
    color: '#2196F3'
  },
  {
    id: 'kraffles',
    name: 'Kraffles',
    description: 'Sistema de rifas donde puedes vender boletos por productos o servicios usando OKoins.',
    cost: 'Comisión 5%',
    requirements: ['Logro K2G-Plus', 'Perfil verificado'],
    isLocked: true,
    icon: Gift,
    color: '#FF9800'
  }
];

const mockAnalytics = {
  totalUsers: 1247,
  totalProviders: 89,
  totalBookings: 3456,
  totalRevenue: 2847500,
  monthlyGrowth: 12.5,
  activeUsers: 892,
  pendingApprovals: 7,
  complaints: 3,
  topServices: [
    { name: 'Limpieza', bookings: 1234, revenue: 987600 },
    { name: 'Plomería', bookings: 567, revenue: 680400 },
    { name: 'Electricidad', bookings: 432, revenue: 518400 },
    { name: 'Jardinería', bookings: 321, revenue: 385200 },
  ],
  recentActivity: [
    { type: 'booking', message: 'Nueva reserva: María González - Limpieza', time: '2 min' },
    { type: 'provider', message: 'Nuevo proveedor registrado: Carlos Méndez', time: '15 min' },
    { type: 'complaint', message: 'Queja reportada: Servicio de plomería', time: '1 hora' },
    { type: 'payment', message: 'Pago aprobado: ₡15,000 - Ana Jiménez', time: '2 horas' },
  ]
};

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { balance, transactions, getTransactionHistory, isLoading } = useOKoins();

  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString()}`;
  };

  const handleProgramPress = (program: Program) => {
    if (program.isLocked) {
      Alert.alert(
        t('program_locked'),
        `${program.description}\n\n${t('unlock_requirements')}:\n${program.requirements.join('\n')}\n\n${t('cost')}: ${program.cost}`,
        [{ text: t('ok'), style: 'default' }]
      );
    } else {
      // Handle program activation
      Alert.alert(
        program.name,
        `¿Deseas activar ${program.name}?`,
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('confirm'), style: 'default' }
        ]
      );
    }
  };

  // Client Programs View (OKoins focused)
  if (user?.userType === 'client') {
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
                <View style={styles.earnMethod}>
                  <Star size={20} color="#FFD700" />
                  <Text style={styles.earnMethodText}>Completa servicios (+50 OKoins)</Text>
                </View>
                <View style={styles.earnMethod}>
                  <Star size={20} color="#FFD700" />
                  <Text style={styles.earnMethodText}>Califica proveedores (+10 OKoins)</Text>
                </View>
                <View style={styles.earnMethod}>
                  <Star size={20} color="#FFD700" />
                  <Text style={styles.earnMethodText}>Refiere amigos (+100 OKoins)</Text>
                </View>
                <View style={styles.earnMethod}>
                  <Star size={20} color="#FFD700" />
                  <Text style={styles.earnMethodText}>Bono diario de login (+5 OKoins)</Text>
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

  // Provider Programs View
  if (user?.userType === 'provider') {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <LinearGradient
            colors={['#D81B60', '#E91E63']}
            style={styles.header}
          >
            <Text style={styles.title}>Programas</Text>
            <Text style={styles.subtitle}>Programas especiales disponibles</Text>
          </LinearGradient>

          <View style={styles.content}>
            <TouchableOpacity 
              style={styles.achievementsButton}
              onPress={() => router.push('/achievements')}
            >
              <View style={styles.achievementsButtonContent}>
                <Award size={24} color="#D81B60" />
                <View style={styles.achievementsButtonText}>
                  <Text style={styles.achievementsButtonTitle}>Sistema de Logros</Text>
                  <Text style={styles.achievementsButtonSubtitle}>Descubre cómo desbloquear beneficios</Text>
                </View>
              </View>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Programas Especiales</Text>
            <Text style={styles.sectionDescription}>
              Desbloquea funciones avanzadas y mejores beneficios completando logros y cumpliendo requisitos.
            </Text>

            {programs.map((program) => {
              const IconComponent = program.icon;
              return (
                <TouchableOpacity
                  key={program.id}
                  style={[
                    styles.programCard,
                    program.isLocked && styles.programCardLocked
                  ]}
                  onPress={() => handleProgramPress(program)}
                >
                  <View style={styles.programHeader}>
                    <View style={[
                      styles.programIconContainer,
                      { backgroundColor: program.isLocked ? '#F5F5F5' : `${program.color}20` }
                    ]}>
                      <IconComponent 
                        size={24} 
                        color={program.isLocked ? '#999' : program.color} 
                      />
                      {program.isLocked && (
                        <View style={styles.lockOverlay}>
                          <Lock size={16} color="#666" />
                        </View>
                      )}
                    </View>
                    <View style={styles.programInfo}>
                      <Text style={[
                        styles.programName,
                        program.isLocked && styles.programNameLocked
                      ]}>
                        {program.name}
                      </Text>
                      <Text style={styles.programCost}>{program.cost}</Text>
                    </View>
                  </View>
                  
                  <Text style={[
                    styles.programDescription,
                    program.isLocked && styles.programDescriptionLocked
                  ]}>
                    {program.description}
                  </Text>
                  
                  {program.isLocked && (
                    <View style={styles.requirementsContainer}>
                      <Text style={styles.requirementsTitle}>{t('achievements_required')}:</Text>
                      {program.requirements.map((req, index) => (
                        <Text key={index} style={styles.requirementItem}>• {req}</Text>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <FloatingKompi isVisible={true} />
      </View>
    );
  }

  // Admin View (existing functionality)
  if (user?.userType !== 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Esta función no está disponible para tu tipo de usuario</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#D81B60', '#E91E63']}
        style={styles.adminHeader}
      >
        <Text style={styles.adminTitle}>Panel de Administración</Text>
        <Text style={styles.adminSubtitle}>Resumen del sistema</Text>
      </LinearGradient>

      <View style={styles.adminContent}>
        {/* Key Metrics Grid */}
        <View style={styles.compactMetricsGrid}>
          <View style={styles.compactMetricCard}>
            <Users size={20} color="#D81B60" />
            <Text style={styles.compactMetricValue}>{mockAnalytics.totalUsers.toLocaleString()}</Text>
            <Text style={styles.compactMetricLabel}>Usuarios</Text>
          </View>

          <View style={styles.compactMetricCard}>
            <BarChart3 size={20} color="#4CAF50" />
            <Text style={styles.compactMetricValue}>{mockAnalytics.totalProviders}</Text>
            <Text style={styles.compactMetricLabel}>Proveedores</Text>
          </View>

          <View style={styles.compactMetricCard}>
            <Calendar size={20} color="#FF9800" />
            <Text style={styles.compactMetricValue}>{mockAnalytics.totalBookings.toLocaleString()}</Text>
            <Text style={styles.compactMetricLabel}>Reservas</Text>
          </View>

          <View style={styles.compactMetricCard}>
            <DollarSign size={20} color="#2196F3" />
            <Text style={styles.compactMetricValue}>{formatCurrency(mockAnalytics.totalRevenue)}</Text>
            <Text style={styles.compactMetricLabel}>Ingresos</Text>
          </View>

          <View style={styles.compactMetricCard}>
            <TrendingUp size={20} color="#9C27B0" />
            <Text style={styles.compactMetricValue}>+{mockAnalytics.monthlyGrowth}%</Text>
            <Text style={styles.compactMetricLabel}>Crecimiento</Text>
          </View>

          <View style={styles.compactMetricCard}>
            <CheckCircle size={20} color="#4CAF50" />
            <Text style={styles.compactMetricValue}>{mockAnalytics.activeUsers}</Text>
            <Text style={styles.compactMetricLabel}>Activos</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.gridSectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.compactActionCard}>
            <CheckCircle size={24} color="#4CAF50" />
            <Text style={styles.compactActionTitle}>Aprobar</Text>
            <Text style={styles.compactActionSubtitle}>Proveedores</Text>
            {mockAnalytics.pendingApprovals > 0 && (
              <View style={styles.compactBadge}>
                <Text style={styles.compactBadgeText}>{mockAnalytics.pendingApprovals}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.compactActionCard}>
            <AlertTriangle size={24} color="#FF5722" />
            <Text style={styles.compactActionTitle}>Quejas</Text>
            <Text style={styles.compactActionSubtitle}>Revisar</Text>
            {mockAnalytics.complaints > 0 && (
              <View style={[styles.compactBadge, styles.warningBadge]}>
                <Text style={styles.compactBadgeText}>{mockAnalytics.complaints}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.compactActionCard}>
            <DollarSign size={24} color="#2196F3" />
            <Text style={styles.compactActionTitle}>Pagos</Text>
            <Text style={styles.compactActionSubtitle}>Pendientes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.compactActionCard}>
            <Package size={24} color="#9C27B0" />
            <Text style={styles.compactActionTitle}>Productos</Text>
            <Text style={styles.compactActionSubtitle}>Gestionar</Text>
          </TouchableOpacity>
        </View>

        {/* Top Services Grid */}
        <Text style={styles.gridSectionTitle}>Servicios Populares</Text>
        <View style={styles.servicesGrid}>
          {mockAnalytics.topServices.map((service, index) => (
            <View key={index} style={styles.compactServiceCard}>
              <Text style={styles.compactServiceName}>{service.name}</Text>
              <Text style={styles.compactServiceBookings}>{service.bookings}</Text>
              <Text style={styles.compactServiceLabel}>reservas</Text>
              <Text style={styles.compactServiceRevenue}>{formatCurrency(service.revenue)}</Text>
            </View>
          ))}
        </View>

        {/* System Status Grid */}
        <Text style={styles.gridSectionTitle}>Estado del Sistema</Text>
        <View style={styles.statusCompactGrid}>
          <View style={styles.compactStatusCard}>
            <View style={[styles.compactStatusIndicator, styles.statusOnline]} />
            <Text style={styles.compactStatusLabel}>Servidor</Text>
            <Text style={styles.compactStatusValue}>Online</Text>
          </View>
          
          <View style={styles.compactStatusCard}>
            <View style={[styles.compactStatusIndicator, styles.statusOnline]} />
            <Text style={styles.compactStatusLabel}>Base Datos</Text>
            <Text style={styles.compactStatusValue}>Estable</Text>
          </View>
          
          <View style={styles.compactStatusCard}>
            <View style={[styles.compactStatusIndicator, styles.statusWarning]} />
            <Text style={styles.compactStatusLabel}>Pagos</Text>
            <Text style={styles.compactStatusValue}>Lento</Text>
          </View>
          
          <View style={styles.compactStatusCard}>
            <View style={[styles.compactStatusIndicator, styles.statusOnline]} />
            <Text style={styles.compactStatusLabel}>Notificaciones</Text>
            <Text style={styles.compactStatusValue}>Activo</Text>
          </View>
        </View>

        {/* Recent Activity Compact */}
        <Text style={styles.gridSectionTitle}>Actividad Reciente</Text>
        <View style={styles.compactActivityCard}>
          {mockAnalytics.recentActivity.slice(0, 4).map((activity, index) => (
            <View key={index} style={styles.compactActivityItem}>
              <View style={[styles.compactActivityDot, getActivityColor(activity.type)]} />
              <View style={styles.compactActivityContent}>
                <Text style={styles.compactActivityMessage} numberOfLines={1}>{activity.message}</Text>
                <Text style={styles.compactActivityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <FloatingKompi isVisible={true} />
    </ScrollView>
  );
}

function getActivityColor(type: string) {
  switch (type) {
    case 'booking': return { backgroundColor: '#4CAF50' };
    case 'provider': return { backgroundColor: '#2196F3' };
    case 'complaint': return { backgroundColor: '#FF5722' };
    case 'payment': return { backgroundColor: '#FF9800' };
    default: return { backgroundColor: '#666' };
  }
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
  // Programs specific styles
  programCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  programCardLocked: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  programIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  programNameLocked: {
    color: '#999',
  },
  programCost: {
    fontSize: 14,
    color: '#D81B60',
    fontWeight: '600',
  },
  programDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  programDescriptionLocked: {
    color: '#999',
  },
  requirementsContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  requirementItem: {
    fontSize: 12,
    color: '#BF360C',
    marginBottom: 4,
    lineHeight: 16,
  },
  achievementsButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#D81B60',
  },
  achievementsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementsButtonText: {
    flex: 1,
    marginLeft: 16,
  },
  achievementsButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 4,
  },
  achievementsButtonSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  adminHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  adminTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  adminSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  adminContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: (width - 52) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricIcon: {
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickActions: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#D81B60',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    backgroundColor: '#FF5722',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  warningBadge: {
    backgroundColor: '#FF9800',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  servicesChart: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceItem: {
    marginBottom: 16,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  serviceStats: {
    fontSize: 14,
    color: '#666',
  },
  serviceBar: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  serviceBarFill: {
    height: '100%',
    backgroundColor: '#D81B60',
    borderRadius: 4,
  },
  activityList: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusOnline: {
    backgroundColor: '#4CAF50',
  },
  statusWarning: {
    backgroundColor: '#FF9800',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  // Compact Admin Styles
  compactMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  compactMetricCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: (width - 48) / 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 6,
    marginBottom: 2,
  },
  compactMetricLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  gridSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  compactActionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: (width - 48) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  compactActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 6,
  },
  compactActionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  compactBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF5722',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
  },
  compactBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  compactServiceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: (width - 48) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactServiceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  compactServiceBookings: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D81B60',
    marginBottom: 2,
  },
  compactServiceLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  compactServiceRevenue: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  statusCompactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  compactStatusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: (width - 48) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  compactStatusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    textAlign: 'center',
  },
  compactStatusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  compactActivityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  compactActivityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactActivityContent: {
    flex: 1,
  },
  compactActivityMessage: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  compactActivityTime: {
    fontSize: 10,
    color: '#666',
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