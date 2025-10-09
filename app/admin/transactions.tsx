import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Stack } from 'expo-router';
import { ArrowUpCircle, ArrowDownCircle, Clock } from 'lucide-react-native';
import { useAdmin } from '@/contexts/AdminContext';

export default function TransactionsScreen() {
  const { allTransactions, isLoading, error, refreshTransactions } = useAdmin();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTransactions();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString('es-CR')}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'recharge':
        return <ArrowDownCircle size={24} color="#34C759" />;
      case 'trip_payment':
      case 'trip_hold':
        return <ArrowUpCircle size={24} color="#FF3B30" />;
      case 'trip_release':
      case 'refund':
        return <ArrowDownCircle size={24} color="#007AFF" />;
      default:
        return <Clock size={24} color="#8E8E93" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      recharge: 'Recarga',
      trip_payment: 'Pago de Viaje',
      trip_hold: 'Retención de Fondos',
      trip_release: 'Liberación de Fondos',
      refund: 'Reembolso'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Transacciones', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando transacciones...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Transacciones', headerShown: true }} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{allTransactions.length}</Text>
            <Text style={styles.statLabel}>Total Transacciones</Text>
          </View>
        </View>

        {allTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Clock size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No hay transacciones</Text>
            <Text style={styles.emptyText}>
              Las transacciones aparecerán aquí
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsContainer}>
            {allTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  {getTransactionIcon(transaction.type)}
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>
                      {getTransactionTypeLabel(transaction.type)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text
                      style={[
                        styles.amountText,
                        transaction.type === 'recharge' || transaction.type === 'refund'
                          ? styles.positiveAmount
                          : styles.negativeAmount
                      ]}
                    >
                      {transaction.type === 'recharge' || transaction.type === 'refund' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.transactionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Usuario:</Text>
                    <Text style={styles.detailValue}>{transaction.userId.slice(0, 8)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Saldo Anterior:</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(transaction.balanceBefore)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Saldo Nuevo:</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(transaction.balanceAfter)}
                    </Text>
                  </View>
                  {transaction.description && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionText}>{transaction.description}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93'
  },
  scrollView: {
    flex: 1
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 12
  },
  errorText: {
    color: '#C62828',
    fontSize: 14
  },
  statsContainer: {
    padding: 16
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000'
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 64
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 16
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center'
  },
  transactionsContainer: {
    padding: 16,
    gap: 12
  },
  transactionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  },
  transactionInfo: {
    flex: 1
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000'
  },
  transactionDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2
  },
  transactionAmount: {
    alignItems: 'flex-end'
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700'
  },
  positiveAmount: {
    color: '#34C759'
  },
  negativeAmount: {
    color: '#FF3B30'
  },
  transactionDetails: {
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93'
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000'
  },
  descriptionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8
  },
  descriptionText: {
    fontSize: 14,
    color: '#000'
  }
});
