import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Linking, Platform } from 'react-native';
import { Plus, Clock, X, Calendar as CalendarIcon, Users, Award, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, XCircle, RotateCcw, Phone, MessageCircle, Settings } from 'lucide-react-native';
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
  const { addAppointment, updateAppointment, getAppointmentsForDate, getTodayAppointments, refreshAppointments, setUserTypeAndReload } = useAppointments();
  const { collaborators, consolidatedData } = useTeamCalendar();
  
  // Initialize appointments context with correct user type
  useEffect(() => {
    if (user?.userType) {
      console.log('🔄 Setting user type in appointments context:', user.userType);
      setUserTypeAndReload(user.userType);
    }
  }, [user?.userType, setUserTypeAndReload]);

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
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  
  // Debug state logging
  useEffect(() => {
    console.log('🔍 Modal state changed - showReservationModal:', showReservationModal);
    console.log('🔍 Modal state changed - selectedReservation:', selectedReservation?.id || 'null');
  }, [showReservationModal, selectedReservation]);

  // Force re-render when modal state changes
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Enhanced communication handlers - MOVED UP TO AVOID DEPENDENCY ISSUES
  const handlePhoneCall = useCallback((phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    const telUrl = `tel:${cleanPhone}`;
    
    Alert.alert(
      'Realizar Llamada',
      `¿Deseas llamar a ${phoneNumber}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Llamar',
          onPress: () => {
            Linking.openURL(telUrl).catch(() => {
              Alert.alert('Error', 'No se pudo realizar la llamada. Verifica que tu dispositivo soporte llamadas.');
            });
          }
        }
      ]
    );
  }, []);
  
  // Chat options handler
  const handleChatOptions = useCallback((appointment: any) => {
    Alert.alert(
      'Opciones de Chat',
      `Selecciona cómo deseas contactar a ${appointment.clientName}:`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Chat Kompa2Go',
          onPress: () => {
            // Navigate to in-app chat
            Alert.alert(
              'Chat Kompa2Go',
              'Función de chat interno en desarrollo. Por ahora usa WhatsApp.',
              [{ text: 'Entendido', style: 'default' }]
            );
          }
        },
        {
          text: 'WhatsApp',
          onPress: () => {
            const phoneNumber = appointment.clientPhone?.replace(/[^0-9]/g, '') || '50688880000';
            const message = encodeURIComponent(
              `Hola ${appointment.clientName}, te contacto desde Kompa2Go sobre tu reserva del ${new Date(appointment.date).toLocaleDateString('es-ES')} a las ${appointment.time} para ${appointment.service}.`
            );
            const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${message}`;
            const whatsappWebUrl = `https://wa.me/${phoneNumber}?text=${message}`;
            
            Linking.openURL(whatsappUrl).catch(() => {
              // Fallback to WhatsApp Web
              Linking.openURL(whatsappWebUrl).catch(() => {
                Alert.alert('Error', 'No se pudo abrir WhatsApp. Verifica que esté instalado.');
              });
            });
          }
        }
      ]
    );
  }, []);
  
  // Handle reservation options button press - SIMPLIFIED VERSION
  const handleReservationOptions = useCallback((appointment: any) => {
    console.log('🎯 SIMPLIFIED: Opening reservation options for appointment:', appointment.id);
    console.log('🎯 SIMPLIFIED: Appointment data:', JSON.stringify(appointment, null, 2));
    
    // Direct alert for immediate feedback
    Alert.alert(
      'Opciones de Reserva',
      `Reserva: ${appointment.service}\nFecha: ${new Date(appointment.date).toLocaleDateString('es-ES')}\nHora: ${appointment.time}\nEstado: ${appointment.status}\n\n¿Qué deseas hacer?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '✅ Confirmar Reserva',
          style: 'default',
          onPress: async () => {
            await updateAppointment(appointment.id, { status: 'confirmed' });
            Alert.alert('✅ Confirmado', 'Tu reserva ha sido confirmada exitosamente.');
          }
        },
        {
          text: '🔄 Reprogramar',
          style: 'default',
          onPress: () => {
            Alert.alert(
              'Reprogramar Cita',
              'Para reprogramar, contacta al proveedor directamente.',
              [
                { text: 'Entendido', style: 'default' },
                {
                  text: '📞 Llamar',
                  style: 'default',
                  onPress: () => handlePhoneCall(appointment.clientPhone || '+506 8888-0000')
                }
              ]
            );
          }
        },
        {
          text: '❌ Cancelar Reserva',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '⚠️ Cancelar Reserva',
              'ATENCIÓN: La comisión pagada NO será reembolsada.\n\n¿Confirmas la cancelación?',
              [
                { text: 'No, Mantener', style: 'cancel' },
                {
                  text: 'Sí, Cancelar',
                  style: 'destructive',
                  onPress: async () => {
                    await updateAppointment(appointment.id, { 
                      status: 'cancelled',
                      notes: (appointment.notes || '') + ' [Cancelada - Sin reembolso]'
                    });
                    Alert.alert('❌ Cancelada', 'Tu reserva ha sido cancelada.');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  }, [updateAppointment, handlePhoneCall, handleChatOptions]);
  const [showPersonalTaskModal, setShowPersonalTaskModal] = useState(false);
  const [newPersonalTask, setNewPersonalTask] = useState({
    title: '',
    time: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [showDateDetailModal, setShowDateDetailModal] = useState(false);
  const [selectedDateForDetail, setSelectedDateForDetail] = useState('');

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
      case 'personal': return '#9C27B0';
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

  // Chat options handler




  const handleAddPersonalTask = async () => {
    if (!newPersonalTask.title || !newPersonalTask.time) {
      Alert.alert('Error', 'Por favor completa el título y la hora');
      return;
    }
    
    try {
      await addAppointment({
        date: newPersonalTask.date,
        time: newPersonalTask.time,
        duration: 60,
        clientName: 'Tarea Personal',
        service: newPersonalTask.title,
        type: 'personal',
        status: 'confirmed',
        notes: newPersonalTask.notes
      });
      
      setShowPersonalTaskModal(false);
      setNewPersonalTask({ 
        title: '', 
        time: '', 
        notes: '', 
        date: new Date().toISOString().split('T')[0]
      });
      Alert.alert('Éxito', 'Tarea personal agregada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar la tarea personal');
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
              setSelectedDateForDetail(dayData.dateString);
              setShowDateDetailModal(true);
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
                       appointment.type === 'personal' ? 
                       (appointment.service.length > 6 ? appointment.service.substring(0, 6) + '...' : appointment.service) :
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
                       appointment.type === 'dayoff' ? 'OFF' :
                       appointment.type === 'personal' ? 'PER' : 'UNK'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.appointmentDetailClient}>
                  {appointment.type === 'personal' ? 'Tarea Personal' : appointment.clientName}
                </Text>
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
                
                {/* Enhanced management actions for kompa2go appointments */}
                {appointment.type === 'kompa2go' && (
                  <View style={styles.clientAppointmentActions}>
                    <TouchableOpacity 
                      style={[styles.clientActionButton, styles.reservationOptionsButton]}
                      onPress={() => {
                        console.log('🔥 DIRECT PRESS: Reservation options button pressed!');
                        handleReservationOptions(appointment);
                      }}
                      activeOpacity={0.7}
                      testID={`reservation-options-${appointment.id}`}
                    >
                      <Settings size={16} color="white" />
                      <Text style={styles.clientActionText}>Opciones de Reserva</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.clientActionButton, styles.callButton]}
                      onPress={() => {
                        console.log('Call button pressed for:', appointment.clientPhone);
                        handlePhoneCall(appointment.clientPhone || '+506 8888-0000');
                      }}
                      activeOpacity={0.7}
                    >
                      <Phone size={16} color="white" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.clientActionButton, styles.chatButton]}
                      onPress={() => {
                        console.log('Chat button pressed for appointment:', appointment.id);
                        handleChatOptions(appointment);
                      }}
                      activeOpacity={0.7}
                    >
                      <MessageCircle size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Simplified test button */}
                <TouchableOpacity 
                  style={[styles.clientActionButton, { backgroundColor: '#4CAF50', marginTop: 8, width: '100%' }]}
                  onPress={() => {
                    console.log('🟢 SIMPLIFIED TEST: Button working!');
                    Alert.alert(
                      '✅ Sistema Funcionando', 
                      `Reserva: ${appointment.service}\nHora: ${appointment.time}\nEstado: ${appointment.status}\n\nEl sistema está funcionando correctamente.`,
                      [
                        { text: 'Perfecto', style: 'default' },
                        {
                          text: 'Probar Opciones',
                          style: 'default',
                          onPress: () => handleReservationOptions(appointment)
                        }
                      ]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Settings size={16} color="white" />
                  <Text style={styles.clientActionText}>✅ SISTEMA OK - PROBAR</Text>
                </TouchableOpacity>
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
                    const isSelected = showPersonalTaskModal ? 
                      newPersonalTask.time === timeString : 
                      newAppointment.time === timeString;
                    return (
                      <TouchableOpacity
                        key={timeString}
                        style={[
                          styles.timePickerOption,
                          isSelected && styles.timePickerOptionSelected
                        ]}
                        onPress={() => {
                          if (showPersonalTaskModal) {
                            setNewPersonalTask({...newPersonalTask, time: timeString});
                          } else {
                            setNewAppointment({...newAppointment, time: timeString});
                          }
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
      
      {/* Reservation Management Modal for Clients */}
      <Modal
        visible={showReservationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          console.log('🔧 Closing reservation modal via onRequestClose');
          setShowReservationModal(false);
          setSelectedReservation(null);
        }}
        key={`reservation-modal-${forceUpdate}`}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            console.log('🔧 Closing modal via overlay press');
            setShowReservationModal(false);
            setSelectedReservation(null);
          }}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContentContainer}
          >
          {selectedReservation ? (
            <View style={styles.reservationModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Opciones de Reserva</Text>
                <TouchableOpacity onPress={() => {
                  console.log('🎯 Closing reservation options modal via X button');
                  setShowReservationModal(false);
                  setSelectedReservation(null);
                }}>
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.reservationDetails}>
                <Text style={styles.reservationDetailTitle}>Detalles de la Reserva</Text>
                <View style={styles.reservationDetailRow}>
                  <Text style={styles.reservationDetailLabel}>Fecha:</Text>
                  <Text style={styles.reservationDetailValue}>
                    {new Date(selectedReservation.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={styles.reservationDetailRow}>
                  <Text style={styles.reservationDetailLabel}>Hora:</Text>
                  <Text style={styles.reservationDetailValue}>{selectedReservation.time}</Text>
                </View>
                <View style={styles.reservationDetailRow}>
                  <Text style={styles.reservationDetailLabel}>Servicio:</Text>
                  <Text style={styles.reservationDetailValue}>{selectedReservation.service}</Text>
                </View>
                <View style={styles.reservationDetailRow}>
                  <Text style={styles.reservationDetailLabel}>Proveedor:</Text>
                  <Text style={styles.reservationDetailValue}>{selectedReservation.clientName}</Text>
                </View>
                <View style={styles.reservationDetailRow}>
                  <Text style={styles.reservationDetailLabel}>Estado:</Text>
                  <View style={[
                    styles.statusBadge,
                    selectedReservation.status === 'confirmed' && styles.statusConfirmed,
                    selectedReservation.status === 'pending' && styles.statusPending,
                    selectedReservation.status === 'cancelled' && styles.statusCancelled
                  ]}>
                    <Text style={styles.statusText}>
                      {selectedReservation.status === 'confirmed' ? 'Confirmada' :
                       selectedReservation.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.reservationActions}>
                {/* Enhanced Confirmation Process */}
                {selectedReservation.status === 'pending' && (
                  <TouchableOpacity 
                    style={[styles.reservationActionButton, styles.confirmButton]}
                    onPress={async () => {
                      Alert.alert(
                        'Confirmar Reserva',
                        `¿Confirmas tu cita para el ${new Date(selectedReservation.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${selectedReservation.time}?\n\nServicio: ${selectedReservation.service}\nProveedor: ${selectedReservation.clientName}\n\nAl confirmar, tu cita quedará asegurada y el proveedor será notificado inmediatamente.`,
                        [
                          { text: 'Revisar Más', style: 'cancel' },
                          {
                            text: 'Sí, Confirmar',
                            style: 'default',
                            onPress: async () => {
                              await updateAppointment(selectedReservation.id, { 
                                status: 'confirmed',
                                notes: (selectedReservation.notes || '') + ' [Confirmada por cliente]'
                              });
                              setShowReservationModal(false);
                              Alert.alert(
                                '✅ Reserva Confirmada', 
                                'Tu reserva ha sido confirmada exitosamente.\n\n• El proveedor ha sido notificado\n• Tu cita está asegurada\n• Recibirás un recordatorio 24h antes\n\n¡Gracias por usar Kompa2Go!',
                                [{ text: 'Perfecto', style: 'default' }]
                              );
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <CheckCircle size={20} color="white" />
                    <Text style={styles.reservationActionText}>Confirmar Reserva</Text>
                  </TouchableOpacity>
                )}
                
                {/* Improved Rescheduling Flow */}
                <TouchableOpacity 
                  style={[styles.reservationActionButton, styles.rescheduleButton]}
                  onPress={() => {
                    setShowReservationModal(false);
                    Alert.alert(
                      'Reprogramar Cita', 
                      `Para reprogramar tu cita del ${new Date(selectedReservation.date).toLocaleDateString('es-ES')} necesitas coordinar directamente con ${selectedReservation.clientName}.\n\n¿Cómo prefieres contactarlos?`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { 
                          text: '📞 Llamar Ahora', 
                          style: 'default',
                          onPress: () => handlePhoneCall(selectedReservation.clientPhone || '+506 8888-0000')
                        },
                        {
                          text: '💬 WhatsApp',
                          style: 'default',
                          onPress: () => handleChatOptions(selectedReservation)
                        }
                      ]
                    );
                  }}
                >
                  <RotateCcw size={20} color="white" />
                  <Text style={styles.reservationActionText}>Reprogramar</Text>
                </TouchableOpacity>
                
                {/* Commission-Aware Cancellation */}
                {selectedReservation.status !== 'cancelled' && (
                  <TouchableOpacity 
                    style={[styles.reservationActionButton, styles.cancelReservationButton]}
                    onPress={() => {
                      Alert.alert(
                        '⚠️ Cancelar Reserva',
                        `POLÍTICA DE CANCELACIÓN:\n\n• La comisión pagada NO será reembolsada\n• El proveedor será notificado inmediatamente\n• Esta acción no se puede deshacer\n\nReserva: ${selectedReservation.service}\nFecha: ${new Date(selectedReservation.date).toLocaleDateString('es-ES')}\nHora: ${selectedReservation.time}\n\n¿Estás completamente seguro?`,
                        [
                          { text: 'No, Mantener Reserva', style: 'cancel' },
                          {
                            text: 'Sí, Cancelar (Sin Reembolso)',
                            style: 'destructive',
                            onPress: () => {
                              // Double confirmation for cancellation
                              Alert.alert(
                                'Confirmación Final',
                                'Esta es tu última oportunidad para mantener la reserva.\n\n¿Proceder con la cancelación SIN reembolso de comisión?',
                                [
                                  { text: 'No, Mantener', style: 'cancel' },
                                  {
                                    text: 'Sí, Cancelar Definitivamente',
                                    style: 'destructive',
                                    onPress: async () => {
                                      await updateAppointment(selectedReservation.id, { 
                                        status: 'cancelled',
                                        notes: (selectedReservation.notes || '') + ` [Cancelada por cliente ${new Date().toLocaleString('es-ES')} - Comisión no reembolsable]`
                                      });
                                      setShowReservationModal(false);
                                      Alert.alert(
                                        '❌ Reserva Cancelada', 
                                        'Tu reserva ha sido cancelada exitosamente.\n\n• El proveedor ha sido notificado\n• La comisión no es reembolsable\n• Puedes hacer una nueva reserva cuando gustes\n\nGracias por usar Kompa2Go.',
                                        [{ text: 'Entendido', style: 'default' }]
                                      );
                                    }
                                  }
                                ]
                              );
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <XCircle size={20} color="white" />
                    <Text style={styles.reservationActionText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
                
                {/* Better Action Visibility - Contact Options */}
                <View style={styles.contactActionsSection}>
                  <Text style={styles.contactSectionTitle}>Contactar Proveedor:</Text>
                  <View style={styles.contactButtonsRow}>
                    <TouchableOpacity 
                      style={[styles.contactActionButton, styles.callContactButton]}
                      onPress={() => handlePhoneCall(selectedReservation.clientPhone || '+506 8888-0000')}
                    >
                      <Phone size={18} color="white" />
                      <Text style={styles.contactActionText}>Llamar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.contactActionButton, styles.chatContactButton]}
                      onPress={() => handleChatOptions(selectedReservation)}
                    >
                      <MessageCircle size={18} color="white" />
                      <Text style={styles.contactActionText}>Chat</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.reservationModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Error: No hay datos de reserva</Text>
                <TouchableOpacity onPress={() => {
                  console.log('🔧 Closing error modal');
                  setShowReservationModal(false);
                  setSelectedReservation(null);
                }}>
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <Text>No se pudieron cargar los datos de la reserva. Por favor, inténtalo de nuevo.</Text>
            </View>
          )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      
      {/* Date Detail Modal */}
      <Modal
        visible={showDateDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateDetailModalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {new Date(selectedDateForDetail).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {getAppointmentsForDate(selectedDateForDetail).length} eventos programados
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDateDetailModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dateDetailContent}>
              {/* Existing Appointments */}
              {getAppointmentsForDate(selectedDateForDetail).length > 0 ? (
                <View style={styles.existingAppointmentsSection}>
                  <Text style={styles.sectionTitle}>Eventos del Día</Text>
                  {getAppointmentsForDate(selectedDateForDetail)
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((appointment) => (
                    <View key={appointment.id} style={[
                      styles.appointmentCard,
                      { borderLeftColor: getEventColor(appointment.type) }
                    ]}>
                      <View style={styles.appointmentCardHeader}>
                        <View style={styles.appointmentTimeInfo}>
                          <Text style={styles.appointmentCardTime}>{appointment.time}</Text>
                          <Text style={styles.appointmentCardDuration}>({appointment.duration} min)</Text>
                        </View>
                        <View style={[
                          styles.appointmentStatusBadge,
                          appointment.status === 'confirmed' && styles.statusConfirmed,
                          appointment.status === 'pending' && styles.statusPending,
                          appointment.status === 'cancelled' && styles.statusCancelled
                        ]}>
                          <Text style={styles.appointmentStatusText}>
                            {appointment.status === 'confirmed' ? 'Confirmado' :
                             appointment.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={styles.appointmentCardTitle}>
                        {appointment.type === 'personal' ? appointment.service : appointment.clientName}
                      </Text>
                      <Text style={styles.appointmentCardService}>{appointment.service}</Text>
                      
                      {appointment.notes && (
                        <Text style={styles.appointmentCardNotes}>📝 {appointment.notes}</Text>
                      )}
                      
                      {/* Enhanced action buttons for kompa2go appointments (client view) */}
                      {user?.userType === 'client' && appointment.type === 'kompa2go' && (
                        <View style={styles.appointmentActions}>
                          {appointment.status === 'pending' && (
                            <TouchableOpacity 
                              style={[styles.appointmentActionButton, styles.confirmActionButton]}
                              onPress={async () => {
                                await updateAppointment(appointment.id, { status: 'confirmed' });
                                Alert.alert(
                                  'Reserva Confirmada', 
                                  'Tu reserva ha sido confirmada exitosamente. El proveedor será notificado.',
                                  [{ text: 'Perfecto', style: 'default' }]
                                );
                              }}
                            >
                              <CheckCircle size={16} color="white" />
                              <Text style={styles.appointmentActionText}>Confirmar</Text>
                            </TouchableOpacity>
                          )}
                          
                          <TouchableOpacity 
                            style={[styles.appointmentActionButton, styles.rescheduleActionButton]}
                            onPress={() => {
                              Alert.alert(
                                'Reprogramar Cita', 
                                'Para reprogramar, contacta al proveedor directamente. Ellos te ayudarán a encontrar una nueva fecha.',
                                [
                                  { text: 'Entendido', style: 'default' },
                                  { 
                                    text: 'Contactar', 
                                    style: 'default',
                                    onPress: () => Alert.alert('Contactando...', `Llamando a ${appointment.clientName}...`)
                                  }
                                ]
                              );
                            }}
                          >
                            <RotateCcw size={16} color="white" />
                            <Text style={styles.appointmentActionText}>Reprogramar</Text>
                          </TouchableOpacity>
                          
                          {appointment.status !== 'cancelled' && (
                            <TouchableOpacity 
                              style={[styles.appointmentActionButton, styles.cancelActionButton]}
                              onPress={() => {
                                Alert.alert(
                                  'Cancelar Reserva',
                                  'ATENCIÓN: La comisión pagada NO será reembolsada.\n\n¿Confirmas la cancelación?',
                                  [
                                    { text: 'No, Mantener', style: 'cancel' },
                                    {
                                      text: 'Sí, Cancelar',
                                      style: 'destructive',
                                      onPress: async () => {
                                        await updateAppointment(appointment.id, { 
                                          status: 'cancelled',
                                          notes: (appointment.notes || '') + ' [Cancelada - Sin reembolso de comisión]'
                                        });
                                        Alert.alert(
                                          'Reserva Cancelada', 
                                          'Tu reserva ha sido cancelada. La comisión no es reembolsable.',
                                          [{ text: 'Entendido', style: 'default' }]
                                        );
                                      }
                                    }
                                  ]
                                );
                              }}
                            >
                              <XCircle size={16} color="white" />
                              <Text style={styles.appointmentActionText}>Cancelar</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyDaySection}>
                  <CalendarIcon size={48} color="#ccc" />
                  <Text style={styles.emptyDayTitle}>Día Libre</Text>
                  <Text style={styles.emptyDaySubtitle}>No tienes eventos programados para este día</Text>
                </View>
              )}
              
              {/* Add New Task Section */}
              <View style={styles.addTaskSection}>
                <Text style={styles.sectionTitle}>Agregar Nuevo Evento</Text>
                <TouchableOpacity 
                  style={styles.addTaskButton}
                  onPress={() => {
                    setNewPersonalTask({
                      title: '',
                      time: '',
                      notes: '',
                      date: selectedDateForDetail,
                    });
                    setShowDateDetailModal(false);
                    setShowPersonalTaskModal(true);
                  }}
                >
                  <Plus size={20} color="white" />
                  <Text style={styles.addTaskButtonText}>Agregar Tarea Personal</Text>
                </TouchableOpacity>
                
                {user?.userType === 'provider' && (
                  <TouchableOpacity 
                    style={[styles.addTaskButton, { backgroundColor: '#2196F3' }]}
                    onPress={() => {
                      setNewAppointment({
                        client: '',
                        service: '',
                        time: '',
                        date: selectedDateForDetail,
                      });
                      setShowDateDetailModal(false);
                      setShowAddModal(true);
                    }}
                  >
                    <Plus size={20} color="white" />
                    <Text style={styles.addTaskButtonText}>Agregar Cita Manual</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Personal Task Modal */}
      <Modal
        visible={showPersonalTaskModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPersonalTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Tarea Personal</Text>
              <TouchableOpacity onPress={() => setShowPersonalTaskModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Título de la Tarea *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newPersonalTask.title}
                  onChangeText={(text) => setNewPersonalTask({...newPersonalTask, title: text})}
                  placeholder="Ej: Reunión, Ejercicio, Compras..."
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hora *</Text>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Clock size={20} color="#666" />
                  <Text style={styles.timeButtonText}>
                    {newPersonalTask.time || 'Seleccionar hora'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notas (Opcional)</Text>
                <TextInput
                  style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                  value={newPersonalTask.notes}
                  onChangeText={(text) => setNewPersonalTask({...newPersonalTask, notes: text})}
                  placeholder="Agregar detalles adicionales..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fecha</Text>
                <View style={styles.dateDisplay}>
                  <Text style={styles.dateDisplayText}>
                    {new Date(newPersonalTask.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPersonalTaskModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: '#9C27B0' }]}
                onPress={handleAddPersonalTask}
              >
                <Text style={styles.saveButtonText}>Agregar Tarea</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
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
    flex: 1,
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
    alignItems: 'stretch',
  },
  clientActionButton: {
    flex: 1,
    backgroundColor: '#D81B60',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reservationOptionsButton: {
    flex: 2,
    backgroundColor: '#D81B60',
  },
  callButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  chatButton: {
    flex: 1,
    backgroundColor: '#2196F3',
  },
  clientActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  reservationModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  reservationDetails: {
    marginBottom: 24,
  },
  reservationDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  reservationDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reservationDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  reservationDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusConfirmed: {
    backgroundColor: '#4CAF50',
  },
  statusPending: {
    backgroundColor: '#FF9800',
  },
  statusCancelled: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  reservationActions: {
    gap: 12,
  },
  reservationActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  rescheduleButton: {
    backgroundColor: '#2196F3',
  },
  cancelReservationButton: {
    backgroundColor: '#F44336',
  },
  reservationActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dateDisplay: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dateDisplayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  // Date Detail Modal Styles
  dateDetailModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    width: '95%',
    maxWidth: 450,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dateDetailContent: {
    flex: 1,
    padding: 20,
  },
  existingAppointmentsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  appointmentCard: {
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
  appointmentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentCardTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentCardDuration: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  appointmentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  appointmentStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  appointmentCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  appointmentCardService: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  appointmentCardNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  appointmentActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  confirmActionButton: {
    backgroundColor: '#4CAF50',
  },
  rescheduleActionButton: {
    backgroundColor: '#2196F3',
  },
  cancelActionButton: {
    backgroundColor: '#F44336',
  },
  appointmentActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyDaySection: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 24,
  },
  emptyDayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDaySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  addTaskSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 20,
  },
  addTaskButton: {
    backgroundColor: '#9C27B0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  addTaskButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Enhanced contact and action styles
  contactActionsSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  contactSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  callContactButton: {
    backgroundColor: '#4CAF50',
  },
  chatContactButton: {
    backgroundColor: '#25D366', // WhatsApp green
  },
  contactActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});