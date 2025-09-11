import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react-native';
import { useTeamCalendar } from '@/contexts/TeamCalendarContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConsolidatedTeamViewProps {
  onEventPress?: (eventId: string) => void;
  maxEvents?: number;
}

export default function ConsolidatedTeamView({ onEventPress, maxEvents = 15 }: ConsolidatedTeamViewProps) {
  const { consolidatedData, collaborators, getOptimizedEventSummary } = useTeamCalendar();
  const { t } = useLanguage();

  const optimizedEvents = getOptimizedEventSummary(maxEvents);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'kompa2go': return '#D81B60';
      case 'manual': return '#2196F3';
      case 'blocked': return '#FF9800';
      case 'dayoff': return '#9E9E9E';
      default: return '#666';
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('tomorrow');
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Users size={24} color="#D81B60" />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('consolidated_team_calendar')}</Text>
          <Text style={styles.headerSubtitle}>
            {consolidatedData.totalEvents} {t('total_events')} • {collaborators.filter(c => c.isActive).length} {t('active_members')}
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Calendar size={16} color="#D81B60" />
          <Text style={styles.statNumber}>{consolidatedData.todayEvents.length}</Text>
          <Text style={styles.statLabel}>{t('today')}</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={16} color="#2196F3" />
          <Text style={styles.statNumber}>{consolidatedData.weekEvents.length}</Text>
          <Text style={styles.statLabel}>{t('this_week')}</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={16} color="#4CAF50" />
          <Text style={styles.statNumber}>{consolidatedData.eventsByType.kompa2go || 0}</Text>
          <Text style={styles.statLabel}>Kompa2Go</Text>
        </View>
      </View>

      {/* Event Type Distribution */}
      <View style={styles.distributionContainer}>
        <Text style={styles.sectionTitle}>{t('event_distribution')}</Text>
        <View style={styles.distributionRow}>
          {Object.entries(consolidatedData.eventsByType).map(([type, count]) => (
            <View key={type} style={styles.distributionItem}>
              <View style={[styles.distributionDot, { backgroundColor: getEventTypeColor(type) }]} />
              <Text style={styles.distributionText}>
                {type === 'kompa2go' ? 'K2G' : 
                 type === 'manual' ? t('manual') : 
                 type === 'blocked' ? t('blocked') : 
                 type === 'dayoff' ? t('day_off') : type} ({count})
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Optimized Event List */}
      <View style={styles.eventsContainer}>
        <Text style={styles.sectionTitle}>
          {t('upcoming_events')} ({optimizedEvents.length}/{consolidatedData.upcomingEvents.length})
        </Text>
        <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
          {optimizedEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => onEventPress?.(event.id)}
            >
              <View style={styles.eventHeader}>
                <View style={styles.eventTime}>
                  <Text style={styles.eventDate}>{formatEventDate(event.date)}</Text>
                  <Text style={styles.eventTimeText}>{event.time}</Text>
                </View>
                <View style={[styles.eventTypeIndicator, { backgroundColor: getEventTypeColor(event.type) }]} />
              </View>
              <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
              <Text style={styles.eventService} numberOfLines={1}>{event.service}</Text>
              {event.collaboratorName && event.collaboratorName !== 'Sin asignar' && (
                <Text style={styles.eventCollaborator}>👤 {event.collaboratorName}</Text>
              )}
            </TouchableOpacity>
          ))}
          
          {optimizedEvents.length === 0 && (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>{t('no_upcoming_events')}</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Data Optimization Notice */}
      {consolidatedData.upcomingEvents.length > maxEvents && (
        <View style={styles.optimizationNotice}>
          <Text style={styles.optimizationText}>
            📊 {t('showing_optimized_view')} ({maxEvents}/{consolidatedData.upcomingEvents.length})
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#D81B60',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  distributionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  distributionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distributionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  distributionText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  eventsContainer: {
    flex: 1,
  },
  eventsList: {
    maxHeight: 300,
  },
  eventCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D81B60',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDate: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  eventTimeText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  eventTypeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  eventService: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  eventCollaborator: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  optimizationNotice: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
  },
  optimizationText: {
    fontSize: 11,
    color: '#1976D2',
    textAlign: 'center',
    fontWeight: '500',
  },
});