import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Plus, Clock, X, Calendar as CalendarIcon, Users, Award, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppointments } from '@/contexts/AppointmentsContext';
import { useTeamCalendar } from '@/contexts/TeamCalendarContext';
import FloatingKompi from '@/components/FloatingKompi';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { addAppointment, getAppointmentsForDate, getTodayAppointments, refreshAppointments } = useAppointments();
  const { collaborators, consolidatedData } = useTeamCalendar();
  
  // Simplified state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    client: '',
    service: '',
    time: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get appointments for selected date
  const selectedDateAppointments = useMemo(() => {
    return getAppointmentsForDate(selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDate, getAppointmentsForDate]);

  // Available services
  const availableServices = [
    'Limpieza General',
    'Limpieza Profunda', 
    'Limpieza de Oficina',
    'Organización',
    'Limpieza de Ventanas'
  ];

  // Check if day is blocked
  const isDayBlocked = useCallback((dateString: string): boolean => {
    const dayAppointments = getAppointmentsForDate(dateString);
    return dayAppointments.some(appointment => appointment.type === 'dayoff');
  }, [getAppointmentsForDate]);

  // Calendar data generation
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateString = current.toISOString().split('T')[0];
      const dayAppointments = getAppointmentsForDate(dateString);
      const isBlocked = isDayBlocked(dateString);
      
      days.push({
        date: new Date(current),
        dateString,
        isCurrentMonth: current.getMonth() === month,
        isToday: dateString === new Date().toISOString().split('T')[0],
        isSelected: dateString === selectedDate,
        appointments: dayAppointments.slice(0, 2), // Limit to 2 appointments
        isBlocked
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate, selectedDate, getAppointmentsForDate, isDayBlocked]);
  
  // Get event color
  const getEventColor = (type: string) => {
    switch (type) {
      case 'kompa2go': return '#D81B60';
      case 'manual': return '#2196F3';
      case 'blocked': return '#FF9800';
      case 'dayoff': return '#9E9E9E';
      default: return '#666';
    }
  };
  
  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const handleAddAppointment = async () => {
    if (!newAppointment.client || !newAppointment.service || !newAppointment.time) {
      Alert.alert(t('error'), 'Por favor completa todos los campos requeridos');
      return;
    }
    
    try {
      await addAppointment({
        date: newAppointment.date,
        time: newAppointment.time,
        duration: 60,
        clientName: newAppointment.client,
        service: newAppointment.service,
        type: 'manual',
        status: 'confirmed'
      });
      
      setShowAddModal(false);
      setNewAppointment({ 
        client: '', 
        service: '', 
        time: '', 
        date: new Date().toISOString().split('T')[0]
      });
      Alert.alert('Éxito', 'Cita agregada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar la cita');
    }
  };

  const renderDashboardWidgets = () => (
    <View style={styles.widgetsContainer}>
      <TouchableOpacity 
        style={styles.widget}
        onPress={() => {
          const today = new Date().toISOString().split('T')[0];
          setSelectedDate(today);
        }}
      >
        <CalendarIcon size={24} color="#D81B60" />
        <Text style={styles.widgetNumber}>{getTodayAppointments().length}</Text>
        <Text style={styles.widgetLabel}>Citas Hoy</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.widget}
        onPress={() => {
          Alert.alert('Calificación', 'Calificación promedio: 4.8/5.0');
        }}
      >
        <Award size={24} color="#4CAF50" />
        <Text style={styles.widgetNumber}>4.8</Text>
        <Text style={styles.widgetLabel}>Calificación</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.widget}>
        <Users size={24} color="#FF9800" />
        <Text style={styles.widgetNumber}>{collaborators.length}</Text>
        <Text style={styles.widgetLabel}>Colaboradores</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render calendar
  const renderCustomCalendar = () => (
    <View style={styles.customCalendarContainer}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <ChevronLeft size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.monthYearContainer}>
          <Text style={styles.monthYearText}>
            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
            <Text style={styles.todayButtonText}>Hoy</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <ChevronRight size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {/* Days header */}
      <View style={styles.daysHeader}>
        {['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'].map((day) => (
          <View key={day} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>
      
      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarData.map((dayData) => (
          <TouchableOpacity
            key={dayData.dateString}
            style={[
              styles.dayCell,
              !dayData.isCurrentMonth && styles.dayCellOtherMonth,
              dayData.isToday && styles.dayCellToday,
              dayData.isSelected && styles.dayCellSelected,
              dayData.isBlocked && styles.dayCellBlocked
            ]}
            onPress={() => {
              setSelectedDate(dayData.dateString);
            }}
          >
            <Text style={[
              styles.dayNumber,
              !dayData.isCurrentMonth && styles.dayNumberOtherMonth,
              dayData.isToday && styles.dayNumberToday,
              dayData.isSelected && styles.dayNumberSelected,
              dayData.isBlocked && styles.dayNumberBlocked
            ]}>
              {dayData.date.getDate()}
            </Text>
            
            {/* Event indicators */}
            <View style={styles.eventsContainer}>
              {dayData.appointments.slice(0, 2).map((appointment) => {
                const eventColor = getEventColor(appointment.type);
                
                return (
                  <View
                    key={appointment.id}
                    style={[
                      styles.eventIndicator,
                      { backgroundColor: eventColor }
                    ]}
                  >
                    <Text style={styles.eventText} numberOfLines={1}>
                      {appointment.type === 'dayoff' ? 'Día libre' : 
                       appointment.clientName.length > 6 ? 
                       appointment.clientName.substring(0, 6) + '...' : 
                       appointment.clientName}
                    </Text>
                  </View>
                );
              })}
              
              {dayData.appointments.length > 2 && (
                <View style={[styles.eventIndicator, styles.moreEventsIndicator]}>
                  <Text style={styles.moreEventsText}>
                    +{dayData.appointments.length - 2}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  
  const renderCalendarView = () => (
    <ScrollView style={styles.scrollContainer}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Mi Calendario</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={async () => {
              setIsRefreshing(true);
              await refreshAppointments();
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
          >
            <RefreshCw 
              size={20} 
              color={isRefreshing ? '#999' : '#D81B60'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {renderDashboardWidgets()}
      {renderCustomCalendar()}
      
      {/* Team Summary */}
      <View style={styles.teamCalendarSection}>
        <Text style={styles.teamCalendarTitle}>Resumen del Equipo</Text>
        <Text style={styles.teamCalendarSubtitle}>
          Vista consolidada - {Math.min(consolidatedData.totalEvents, 20)} eventos
        </Text>
        
        <View style={styles.teamStatsContainer}>
          <View style={styles.teamStatCard}>
            <Text style={styles.teamStatNumber}>{Math.min(consolidatedData.todayEvents.length, 5)}</Text>
            <Text style={styles.teamStatLabel}>Hoy</Text>
          </View>
          <View style={styles.teamStatCard}>
            <Text style={styles.teamStatNumber}>{Math.min(consolidatedData.weekEvents.length, 10)}</Text>
            <Text style={styles.teamStatLabel}>Esta Semana</Text>
          </View>
          <View style={styles.teamStatCard}>
            <Text style={styles.teamStatNumber}>{collaborators.filter(c => c.isActive).length}</Text>
            <Text style={styles.teamStatLabel}>Equipo Activo</Text>
          </View>
        </View>
      </View>

      {/* Selected Date Events */}
      {selectedDateAppointments.length > 0 && (
        <View style={styles.selectedDateSection}>
          <Text style={styles.selectedDateTitle}>
            Eventos para {new Date(selectedDate).toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          <Text style={styles.selectedDateSubtitle}>
            Total de eventos: {selectedDateAppointments.length}
          </Text>
          
          <View style={styles.selectedDateScrollContainer}>
            {selectedDateAppointments.map((appointment) => (
              <View 
                key={appointment.id} 
                style={[
                  styles.appointmentDetailCard,
                  { borderLeftColor: getEventColor(appointment.type) }
                ]}
              >
                <View style={styles.appointmentDetailHeader}>
                  <View style={styles.appointmentTimeContainer}>
                    <Text style={styles.appointmentDetailTime}>{appointment.time}</Text>
                    <Text style={styles.appointmentDuration}>({appointment.duration} min)</Text>
                  </View>
                  <View style={[
                    styles.appointmentTypeIndicator,
                    { backgroundColor: getEventColor(appointment.type) }
                  ]}>
                    <Text style={styles.appointmentTypeText}>
                      {appointment.type === 'kompa2go' ? 'K2G' :
                       appointment.type === 'manual' ? 'MAN' : 
                       appointment.type === 'blocked' ? 'BLK' : 
                       appointment.type === 'dayoff' ? 'OFF' : 'UNK'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.appointmentDetailClient}>{appointment.clientName}</Text>
                <Text style={styles.appointmentDetailService}>{appointment.service}</Text>
                
                {appointment.clientPhone && (
                  <Text style={styles.appointmentDetailPhone}>📞 {appointment.clientPhone}</Text>
                )}
                
                {appointment.notes && (
                  <Text style={styles.appointmentDetailNotes}>📝 {appointment.notes}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.persistentActions}>
        <TouchableOpacity 
          style={styles.addAppointmentButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="white" />
          <Text style={styles.addAppointmentText}>Agregar Cita Manual</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Client view - show their appointments and booking history
  const renderClientCalendarView = () => (
    <ScrollView style={styles.scrollContainer}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Mi Calendario</Text>
          <Text style={styles.subtitle}>Mis citas y reservas</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={async () => {
              setIsRefreshing(true);
              await refreshAppointments();
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
          >
            <RefreshCw 
              size={20} 
              color={isRefreshing ? '#999' : '#D81B60'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Client Dashboard Widgets */}
      <View style={styles.widgetsContainer}>
        <TouchableOpacity 
          style={styles.widget}
          onPress={() => {
            const today = new Date().toISOString().split('T')[0];
            setSelectedDate(today);
          }}
        >
          <CalendarIcon size={24} color="#D81B60" />
          <Text style={styles.widgetNumber}>{getTodayAppointments().length}</Text>
          <Text style={styles.widgetLabel}>Citas Hoy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.widget}
          onPress={() => {
            Alert.alert('Historial', 'Total de servicios completados: 12');
          }}
        >
          <Clock size={24} color="#4CAF50" />
          <Text style={styles.widgetNumber}>12</Text>
          <Text style={styles.widgetLabel}>Completados</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.widget}
          onPress={() => {
            Alert.alert('Próximas Citas', 'Tienes 3 citas programadas esta semana');
          }}
        >
          <Users size={24} color="#FF9800" />
          <Text style={styles.widgetNumber}>3</Text>
          <Text style={styles.widgetLabel}>Próximas</Text>
        </TouchableOpacity>
      </View>

      {renderCustomCalendar()}
      
      {/* Client-specific sections */}
      <View style={styles.clientSection}>
        <Text style={styles.clientSectionTitle}>Mis Reservas</Text>
        <Text style={styles.clientSectionSubtitle}>
          Aquí puedes ver todas tus citas programadas
        </Text>
        
        <View style={styles.clientStatsContainer}>
          <View style={styles.clientStatCard}>
            <Text style={styles.clientStatNumber}>2</Text>
            <Text style={styles.clientStatLabel}>Esta Semana</Text>
          </View>
          <View style={styles.clientStatCard}>
            <Text style={styles.clientStatNumber}>5</Text>
            <Text style={styles.clientStatLabel}>Este Mes</Text>
          </View>
          <View style={styles.clientStatCard}>
            <Text style={styles.clientStatNumber}>4.9</Text>
            <Text style={styles.clientStatLabel}>Mi Calificación</Text>
          </View>
        </View>
      </View>

      {/* Selected Date Events for Client */}
      {selectedDateAppointments.length > 0 && (
        <View style={styles.selectedDateSection}>
          <Text style={styles.selectedDateTitle}>
            Mis citas para {new Date(selectedDate).toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          <Text style={styles.selectedDateSubtitle}>
            Total de citas: {selectedDateAppointments.length}
          </Text>
          
          <View style={styles.selectedDateScrollContainer}>
            {selectedDateAppointments.map((appointment) => (
              <View 
                key={appointment.id} 
                style={[
                  styles.appointmentDetailCard,
                  { borderLeftColor: getEventColor(appointment.type) }
                ]}
              >
                <View style={styles.appointmentDetailHeader}>
                  <View style={styles.appointmentTimeContainer}>
                    <Text style={styles.appointmentDetailTime}>{appointment.time}</Text>
                    <Text style={styles.appointmentDuration}>({appointment.duration} min)</Text>
                  </View>
                  <View style={[
                    styles.appointmentTypeIndicator,
                    { backgroundColor: getEventColor(appointment.type) }
                  ]}>
                    <Text style={styles.appointmentTypeText}>
                      {appointment.status === 'confirmed' ? 'CONF' :
                       appointment.status === 'pending' ? 'PEND' : 
                       appointment.status === 'cancelled' ? 'CANC' : 'UNK'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.appointmentDetailClient}>Proveedor: {appointment.clientName}</Text>
                <Text style={styles.appointmentDetailService}>{appointment.service}</Text>
                
                {appointment.clientPhone && (
                  <Text style={styles.appointmentDetailPhone}>📞 {appointment.clientPhone}</Text>
                )}
                
                {appointment.notes && (
                  <Text style={styles.appointmentDetailNotes}>📝 {appointment.notes}</Text>
                )}
                
                <View style={styles.clientAppointmentActions}>
                  <TouchableOpacity 
                    style={styles.clientActionButton}
                    onPress={() => Alert.alert('Contactar', 'Función de contacto próximamente')}
                  >
                    <Text style={styles.clientActionText}>Contactar</Text>
                  </TouchableOpacity>
                  
                  {appointment.status === 'confirmed' && (
                    <TouchableOpacity 
                      style={[styles.clientActionButton, styles.cancelButton]}
                      onPress={() => Alert.alert('Cancelar', '¿Estás seguro de cancelar esta cita?')}
                    >
                      <Text style={[styles.clientActionText, styles.cancelButtonText]}>Cancelar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );

  if (user?.userType !== 'provider') {
    return (
      <View style={styles.container}>
        {renderClientCalendarView()}
        <FloatingKompi isVisible={true} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderCalendarView()}

      {/* Add Appointment Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Cita Manual</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cliente *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newAppointment.client}
                  onChangeText={(text) => setNewAppointment({...newAppointment, client: text})}
                  placeholder="Nombre del cliente"
                  placeholderTextColor="#666"
                />
              </View>

              {/* Service Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Servicio *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceSelector}>
                  {availableServices.map((service) => (
                    <TouchableOpacity
                      key={service}
                      style={[
                        styles.serviceOption,
                        newAppointment.service === service && styles.serviceOptionSelected
                      ]}
                      onPress={() => setNewAppointment({...newAppointment, service})}
                    >
                      <Text style={[
                        styles.serviceOptionText,
                        newAppointment.service === service && styles.serviceOptionTextSelected
                      ]}>
                        {service}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Time Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hora *</Text>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Clock size={20} color="#666" />
                  <Text style={styles.timeButtonText}>
                    {newAppointment.time || 'Seleccionar hora'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleAddAppointment}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.timePickerOverlay}>
            <View style={styles.timePickerContainer}>
              <Text style={styles.timePickerTitle}>Seleccionar Hora</Text>
              <ScrollView style={styles.timePickerScroll}>
                {Array.from({ length: 10 }, (_, i) => i + 8).map((hour) => {
                  return [0, 30].map((minute) => {
                    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    const isSelected = newAppointment.time === timeString;
                    return (
                      <TouchableOpacity
                        key={timeString}
                        style={[
                          styles.timePickerOption,
                          isSelected && styles.timePickerOptionSelected
                        ]}
                        onPress={() => {
                          setNewAppointment({...newAppointment, time: timeString});
                          setShowTimePicker(false);
                        }}
                      >
                        <Text style={[
                          styles.timePickerOptionText,
                          isSelected && styles.timePickerOptionTextSelected
                        ]}>
                          {timeString}
                        </Text>
                      </TouchableOpacity>
                    );
                  });
                }).flat()}
              </ScrollView>
              <TouchableOpacity 
                style={styles.timePickerCloseButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.timePickerCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      
      <FloatingKompi isVisible={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  widgetsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  widget: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  widgetNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  widgetLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  customCalendarContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  monthYearContainer: {
    alignItems: 'center',
    gap: 4,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  todayButton: {
    backgroundColor: '#D81B60',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  daysHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
  },
  dayHeaderCell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
  },
  dayCell: {
    width: `${100/7}%`,
    height: 80,
    padding: 4,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#E5E5E5',
    backgroundColor: 'white',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  dayCellOtherMonth: {
    backgroundColor: '#FAFAFA',
  },
  dayCellToday: {
    backgroundColor: '#FFF8E1',
  },
  dayCellSelected: {
    backgroundColor: '#E8F5E8',
  },
  dayCellBlocked: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  dayNumberOtherMonth: {
    color: '#999',
  },
  dayNumberToday: {
    color: '#D81B60',
    fontWeight: 'bold',
  },
  dayNumberSelected: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  dayNumberBlocked: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  eventsContainer: {
    flex: 1,
    gap: 1,
    paddingHorizontal: 1,
  },
  eventIndicator: {
    backgroundColor: '#D81B60',
    borderRadius: 2,
    paddingHorizontal: 2,
    paddingVertical: 1,
    minHeight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventText: {
    fontSize: 8,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  moreEventsIndicator: {
    backgroundColor: '#666',
  },
  moreEventsText: {
    fontSize: 7,
    color: 'white',
    fontWeight: '500',
  },
  teamCalendarSection: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  teamCalendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  teamCalendarSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  teamStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  teamStatCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#D81B60',
  },
  teamStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  teamStatLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  selectedDateSection: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  selectedDateSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  selectedDateScrollContainer: {
    // Container for appointment cards
  },
  appointmentDetailCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  appointmentDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentDetailTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentDuration: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  appointmentTypeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  appointmentTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  appointmentDetailClient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  appointmentDetailService: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  appointmentDetailPhone: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  appointmentDetailNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  persistentActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    gap: 12,
  },
  addAppointmentButton: {
    backgroundColor: '#D81B60',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  addAppointmentText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalForm: {
    maxHeight: 300,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  serviceSelector: {
    flexDirection: 'row',
  },
  serviceOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  serviceOptionSelected: {
    backgroundColor: '#D81B60',
    borderColor: '#D81B60',
  },
  serviceOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  serviceOptionTextSelected: {
    color: 'white',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 8,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#D81B60',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
    maxHeight: '70%',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  timePickerScroll: {
    maxHeight: 300,
  },
  timePickerOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  timePickerOptionSelected: {
    backgroundColor: '#D81B60',
  },
  timePickerOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  timePickerOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  timePickerCloseButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  timePickerCloseText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  clientSection: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clientSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  clientSectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  clientStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  clientStatCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  clientStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clientStatLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  clientAppointmentActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  clientActionButton: {
    flex: 1,
    backgroundColor: '#D81B60',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  clientActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});