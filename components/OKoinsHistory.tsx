import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Coins, TrendingUp, TrendingDown, X } from 'lucide-react-native';
import { useOKoins } from '@/contexts/OKoinsContext';
import { CATEGORY_COLORS, CATEGORY_LABELS, OKoinsCategory } from '@/constants/okoins';

interface OKoinsTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent';
  reason: string;
  timestamp: Date;
  category?: OKoinsCategory;
}

interface OKoinsHistoryProps {
  onClose?: () => void;
}

export default function OKoinsHistory({ onClose }: OKoinsHistoryProps) {
  const { balance, getTransactionHistory } = useOKoins();
  const transactions = getTransactionHistory();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getCategoryColor = (category?: OKoinsCategory) => {
    if (!category) return '#6c757d';
    return CATEGORY_COLORS[category];
  };

  const getCategoryLabel = (category?: OKoinsCategory) => {
    if (!category) return 'General';
    return CATEGORY_LABELS[category];
  };

  const renderTransaction = ({ item }: { item: OKoinsTransaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionIcon}>
          {item.type === 'earned' ? (
            <TrendingUp size={20} color="#28a745" />
          ) : (
            <TrendingDown size={20} color="#dc3545" />
          )}
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionReason}>{item.reason}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.timestamp)}</Text>
          {item.category && (
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
              <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                {getCategoryLabel(item.category)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.amountText,
            { color: item.type === 'earned' ? '#28a745' : '#dc3545' }
          ]}>
            {item.type === 'earned' ? '+' : '-'}{item.amount}
          </Text>
          <Text style={styles.okoinsLabel}>OKoins</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Coins size={64} color="#dee2e6" />
      <Text style={styles.emptyTitle}>No hay transacciones</Text>
      <Text style={styles.emptyDescription}>
        Tus transacciones de OKoins aparecerán aquí cuando empieces a ganar y usar tus puntos.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Coins size={24} color="#FFD700" />
          <Text style={styles.title}>Historial de OKoins</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color="#6c757d" />
          </TouchableOpacity>
        )}
      </View>

      {/* Balance Summary */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance Actual</Text>
        <Text style={styles.balanceAmount}>{balance.toLocaleString()} OKoins</Text>
      </View>

      {/* Transaction Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {transactions.filter(t => t.type === 'earned').length}
          </Text>
          <Text style={styles.statLabel}>Ganados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {transactions.filter(t => t.type === 'spent').length}
          </Text>
          <Text style={styles.statLabel}>Gastados</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {transactions.reduce((sum, t) => t.type === 'earned' ? sum + t.amount : sum, 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Ganado</Text>
        </View>
      </View>

      {/* Transactions List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Transacciones Recientes</Text>
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={transactions.length === 0 ? styles.emptyListContainer : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionReason: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  okoinsLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});