import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Linking, Platform } from 'react-native';
import { Plus, Clock, X, Calendar as CalendarIcon, Users, Award, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, XCircle, RotateCcw, Phone, MessageCircle, Settings, Sun, Moon, Coffee } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppointments, Appointment } from '@/contexts/AppointmentsContext';
import { useTeamCalendar } from '@/contexts/TeamCalendarContext';
import { useChat } from '@/contexts/ChatContext';
import { router } from 'expo-router';
import FloatingKompi from '@/components/FloatingKompi';
import ReservationDetailCard from '@/components/ReservationDetailCard';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { addAppointment, getAppointmentsForDate, getTodayAppointments, refreshAppointments, setUserTypeAndReload } = useAppointments();
  const { collaborators } = useTeamCalendar();
  const scrollViewRef = useRef<ScrollView>(null);
  const personalAgendaSectionRef = useRef<View>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [modalState, setModalState] = useState({
    personalTask: false,
    reservationDetails: false,
    timePicker: false,
  });

  const [selectedReservation, setSelectedReservation] = useState<Appointment | null>(null);
  const [newPersonalTask, setNewPersonalTask] = useState({ 
    title: '', 
    time: '', 
    notes: '', 
    date: selectedDate,
    timeBlock: null as 'morning' | 'afternoon' | 'evening' | null,
  });

  useEffect(() => {
    if (user?.userType) {
      setUserTypeAndReload(user.userType);
    }
  }, [user?.userType, setUserTypeAndReload]);

  const selectedDateAppointments = useMemo(() => {
    return getAppointmentsForDate(selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedDate, getAppointmentsForDate]);

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    return Array.from({ length: 42 }).map((_, i) => {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const dateString = current.toISOString().split('T')[0];
      return {
        date: current,
        dateString,
        isCurrentMonth: current.getMonth() === month,
        isToday: dateString === new Date().toISOString().split('T')[0],
        isSelected: dateString === selectedDate,
        appointments: getAppointmentsForDate(dateString),
        isBlocked: getAppointmentsForDate(dateString).some(app => app.type === 'dayoff'),
      };
    });
  }, [currentDate, selectedDate, getAppointmentsForDate]);

  const getEventColor = (type: string) => ({
    'kompa2go': '#D81B60', 'manual': '#2196F3', 'blocked': '#FF9800', 'dayoff': '#9E9E9E', 'personal': '#9C27B0'
  }[type] || '#666');

  const goToPreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const handleDatePress = (dateString: string) => {
    setSelectedDate(dateString);
    if (user?.userType === 'client' && getAppointmentsForDate(dateString).length === 0) {
      setTimeout(() => {
        personalAgendaSectionRef.current?.measureLayout(
          scrollViewRef.current?.getInnerViewNode(),
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y, animated: true });
          }
        );
      }, 150);
    }
  };

  const handleAddPersonalTask = async () => {
    if (!newPersonalTask.title || (!newPersonalTask.time && !newPersonalTask.timeBlock)) {
      Alert.alert('Error', 'Por favor completa el título y selecciona una hora o un bloque de tiempo.');
      return;
    }
    
    let appointmentToAdd: Omit<Appointment, 'id'>;

    if (newPersonalTask.timeBlock) {
      const blocks = {
        morning: { time: '08:00', duration: 240, title: 'Mañana Ocupada' }, // 8am - 12pm
        afternoon: { time: '13:00', duration: 240, title: 'Tarde Ocupada' }, // 1pm - 5pm
        evening: { time: '18:00', duration: 180, title: 'Noche Ocupada' }, // 6pm - 9pm
      };
      const block = blocks[newPersonalTask.timeBlock];
      appointmentToAdd = {
        date: newPersonalTask.date,
        time: block.time,
        duration: block.duration,
        clientName: user?.name || 'Cliente',
        service: newPersonalTask.title || block.title,
        type: 'blocked',
        status: 'confirmed',
        notes: newPersonalTask.notes,
      };
    } else {
      appointmentToAdd = {
        date: newPersonalTask.date,
        time: newPersonalTask.time,
        duration: 60, // Default duration for single task
        clientName: user?.name || 'Cliente',
        service: newPersonalTask.title,
        type: 'personal',
        status: 'confirmed',
        notes: newPersonalTask.notes,
      };
    }

    try {
      await addAppointment(appointmentToAdd);
      setModalState(prev => ({ ...prev, personalTask: false }));
      setNewPersonalTask({ title: '', time: '', notes: '', date: selectedDate, timeBlock: null });
      Alert.alert('Éxito', 'Tu agenda personal ha sido actualizada.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el evento.');
    }
  };

  const renderClientCalendarView = () => (
    <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Mi Calendario</Text>
          <Text style={styles.subtitle}>Mis citas y agenda personal</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={async () => { setIsRefreshing(true); await refreshAppointments(); setIsRefreshing(false); }} disabled={isRefreshing}>
          <RefreshCw size={20} color={isRefreshing ? '#999' : '#D81B60'} />
        </TouchableOpacity>
      </View>

      <View style={styles.customCalendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}><ChevronLeft size={24} color="#333" /></TouchableOpacity>
          <View style={styles.monthYearContainer}>
            <Text style={styles.monthYearText}>{currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</Text>
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}><Text style={styles.todayButtonText}>Hoy</Text></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}><ChevronRight size={24} color="#333" /></TouchableOpacity>
        </View>
        <View style={styles.daysHeader}>
          {['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'].map(day => <View key={day} style={styles.dayHeaderCell}><Text style={styles.dayHeaderText}>{day}</Text></View>)}
        </View>
        <View style={styles.calendarGrid}>
          {calendarData.map((dayData) => (
            <TouchableOpacity key={dayData.dateString} style={[styles.dayCell, !dayData.isCurrentMonth && styles.dayCellOtherMonth, dayData.isToday && styles.dayCellToday, dayData.isSelected && styles.dayCellSelected]} onPress={() => handleDatePress(dayData.dateString)}>
              <Text style={[styles.dayNumber, !dayData.isCurrentMonth && styles.dayNumberOtherMonth, dayData.isToday && styles.dayNumberToday, dayData.isSelected && styles.dayNumberSelected]}>{dayData.date.getDate()}</Text>
              <View style={styles.eventsContainer}>
                {dayData.appointments.slice(0, 2).map(app => <View key={app.id} style={[styles.eventIndicator, { backgroundColor: getEventColor(app.type) }]} />)}
                {dayData.appointments.length > 2 && <View style={[styles.eventIndicator, styles.moreEventsIndicator]}><Text style={styles.moreEventsText}>+{dayData.appointments.length - 2}</Text></View>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedDateAppointments.length > 0 && (
        <View style={styles.selectedDateSection}>
          <Text style={styles.selectedDateTitle}>Eventos para el {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</Text>
          {selectedDateAppointments.map(app => (
            <TouchableOpacity key={app.id} style={[styles.appointmentDetailCard, { borderLeftColor: getEventColor(app.type) }]} onPress={() => { setSelectedReservation(app); setModalState(prev => ({ ...prev, reservationDetails: true })); }}>
              <View style={styles.appointmentTimeContainer}><Text style={styles.appointmentDetailTime}>{app.time}</Text></View>
              <Text style={styles.appointmentDetailClient}>{app.type === 'personal' || app.type === 'blocked' ? 'Evento Personal' : `Proveedor: ${app.clientName}`}</Text>
              <Text style={styles.appointmentDetailService}>{app.service}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View ref={personalAgendaSectionRef} style={styles.personalAgendaSection}>
        {selectedDateAppointments.length === 0 && (
          <View style={styles.emptyDaySection}>
            <CalendarIcon size={48} color="#ccc" />
            <Text style={styles.emptyDayTitle}>Día Libre</Text>
            <Text style={styles.emptyDaySubtitle}>No tienes eventos para este día.</Text>
          </View>
        )}
        <TouchableOpacity style={styles.addPersonalAgendaButton} onPress={() => { setNewPersonalTask(prev => ({ ...prev, date: selectedDate, time: '', timeBlock: null })); setModalState(prev => ({ ...prev, personalTask: true })); }}>
          <Plus size={20} color="white" />
          <Text style={styles.addPersonalAgendaText}>Agregar Agenda Personal</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {user?.userType === 'client' ? renderClientCalendarView() : <Text style={styles.loadingText}>Cargando calendario de proveedor...</Text>}
      <FloatingKompi isVisible={true} />
      
      <Modal visible={modalState.reservationDetails} transparent animationType="slide" onRequestClose={() => setModalState(prev => ({ ...prev, reservationDetails: false }))}>
        <View style={styles.modalOverlay}>
          <View style={styles.reservationDetailsModalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Detalles de Reserva</Text><TouchableOpacity onPress={() => setModalState(prev => ({ ...prev, reservationDetails: false }))}><X size={24} color="#666" /></TouchableOpacity></View>
            {selectedReservation && <ReservationDetailCard reservation={selectedReservation} onClose={() => setModalState(prev => ({ ...prev, reservationDetails: false }))} showHeader={false} />}
          </View>
        </View>
      </Modal>

      <Modal visible={modalState.personalTask} transparent animationType="slide" onRequestClose={() => setModalState(prev => ({ ...prev, personalTask: false }))}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Agregar Tarea Personal</Text><TouchableOpacity onPress={() => setModalState(prev => ({ ...prev, personalTask: false }))}><X size={24} color="#666" /></TouchableOpacity></View>
            <ScrollView>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Título de la Tarea *</Text><TextInput style={styles.textInput} value={newPersonalTask.title} onChangeText={text => setNewPersonalTask(prev => ({ ...prev, title: text }))} placeholder="Ej: Cita médica, Almuerzo, Estudiar" /></View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bloquear Horario (Opcional)</Text>
                <View style={styles.timeBlockContainer}>
                  <TouchableOpacity style={[styles.timeBlockButton, newPersonalTask.timeBlock === 'morning' && styles.timeBlockSelected]} onPress={() => setNewPersonalTask(prev => ({...prev, timeBlock: 'morning', time: ''}))}><Sun size={16} color={newPersonalTask.timeBlock === 'morning' ? 'white' : '#666'} /><Text style={[styles.timeBlockText, newPersonalTask.timeBlock === 'morning' && styles.timeBlockTextSelected]}>Mañana (8am-12pm)</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.timeBlockButton, newPersonalTask.timeBlock === 'afternoon' && styles.timeBlockSelected]} onPress={() => setNewPersonalTask(prev => ({...prev, timeBlock: 'afternoon', time: ''}))}><Coffee size={16} color={newPersonalTask.timeBlock === 'afternoon' ? 'white' : '#666'} /><Text style={[styles.timeBlockText, newPersonalTask.timeBlock === 'afternoon' && styles.timeBlockTextSelected]}>Tarde (1pm-5pm)</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.timeBlockButton, newPersonalTask.timeBlock === 'evening' && styles.timeBlockSelected]} onPress={() => setNewPersonalTask(prev => ({...prev, timeBlock: 'evening', time: ''}))}><Moon size={16} color={newPersonalTask.timeBlock === 'evening' ? 'white' : '#666'} /><Text style={[styles.timeBlockText, newPersonalTask.timeBlock === 'evening' && styles.timeBlockTextSelected]}>Noche (6pm-9pm)</Text></TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}><Text style={styles.inputLabel}>O seleccionar una hora específica *</Text><TouchableOpacity style={styles.timeButton} onPress={() => setModalState(prev => ({ ...prev, timePicker: true }))} disabled={!!newPersonalTask.timeBlock}><Text style={styles.timeButtonText}>{newPersonalTask.time || 'Seleccionar hora'}</Text></TouchableOpacity></View>
              <View style={styles.inputGroup}><Text style={styles.inputLabel}>Notas</Text><TextInput style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]} value={newPersonalTask.notes} onChangeText={text => setNewPersonalTask(prev => ({ ...prev, notes: text }))} multiline /></View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalState(prev => ({ ...prev, personalTask: false }))}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddPersonalTask}><Text style={styles.saveButtonText}>Guardar Tarea</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalState.timePicker} transparent animationType="fade" onRequestClose={() => setModalState(prev => ({...prev, timePicker: false}))}>
        <View style={styles.timePickerOverlay}>
            <View style={styles.timePickerContainer}>
              <Text style={styles.timePickerTitle}>Seleccionar Hora</Text>
              <ScrollView>
                <View style={styles.timePickerGrid}>
                  {Array.from({ length: 13 }, (_, i) => i + 8).flatMap(hour => [0, 30].map(minute => {
                    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    return (
                      <TouchableOpacity key={timeString} style={styles.timePickerOption} onPress={() => { setNewPersonalTask(prev => ({ ...prev, time: timeString, timeBlock: null })); setModalState(prev => ({...prev, timePicker: false})); }}>
                        <Text style={styles.timePickerOptionText}>{timeString}</Text>
                      </TouchableOpacity>
                    );
                  }))}
                </View>
              </ScrollView>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingText: { flex: 1, textAlign: 'center', textAlignVertical: 'center' },
  scrollContainer: { flex: 1 },
  header: { backgroundColor: 'white', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5E5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  refreshButton: { padding: 8, borderRadius: 8, backgroundColor: '#F8F9FA' },
  widgetsContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  widget: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  widgetNumber: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 8 },
  widgetLabel: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' },
  customCalendarContainer: { backgroundColor: 'white', borderRadius: 12, marginHorizontal: 16, marginBottom: 16, elevation: 2 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  navButton: { padding: 8 },
  monthYearContainer: { alignItems: 'center', gap: 4 },
  monthYearText: { fontSize: 18, fontWeight: 'bold', color: '#333', textTransform: 'capitalize' },
  todayButton: { backgroundColor: '#D81B60', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  todayButtonText: { fontSize: 12, color: 'white', fontWeight: '600' },
  daysHeader: { flexDirection: 'row', backgroundColor: '#F8F9FA' },
  dayHeaderCell: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  dayHeaderText: { fontSize: 12, fontWeight: '600', color: '#666', textTransform: 'uppercase' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100/7}%`, height: 80, padding: 4, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#E5E5E5' },
  dayCellOtherMonth: { backgroundColor: '#FAFAFA' },
  dayCellToday: { backgroundColor: '#FFF8E1' },
  dayCellSelected: { backgroundColor: '#E3F2FD', borderWidth: 2, borderColor: '#2196F3' },
  dayCellBlocked: { backgroundColor: '#F5F5F5', opacity: 0.6 },
  dayNumber: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 2 },
  dayNumberOtherMonth: { color: '#999' },
  dayNumberToday: { color: '#D81B60', fontWeight: 'bold' },
  dayNumberSelected: { color: '#2196F3', fontWeight: 'bold' },
  eventsContainer: { flex: 1, gap: 2, paddingTop: 2 },
  eventIndicator: { height: 6, borderRadius: 3, marginBottom: 1 },
  moreEventsIndicator: { backgroundColor: '#666', alignItems: 'center', justifyContent: 'center' },
  moreEventsText: { color: 'white', fontSize: 8, fontWeight: 'bold' },
  selectedDateSection: { paddingHorizontal: 20, marginBottom: 16 },
  selectedDateTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  appointmentDetailCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, elevation: 2 },
  appointmentDetailHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  appointmentTimeContainer: {},
  appointmentDetailTime: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  appointmentDuration: { fontSize: 12, color: '#666' },
  appointmentTypeIndicator: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  appointmentTypeText: { fontSize: 10, fontWeight: 'bold', color: 'white' },
  appointmentDetailClient: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 8, marginBottom: 4 },
  appointmentDetailService: { fontSize: 14, color: '#666' },
  personalAgendaSection: { backgroundColor: 'white', marginHorizontal: 16, marginVertical: 16, borderRadius: 12, padding: 20, elevation: 2 },
  emptyDaySection: { alignItems: 'center', paddingVertical: 20 },
  emptyDayTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8 },
  emptyDaySubtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  addPersonalAgendaButton: { backgroundColor: '#9C27B0', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  addPersonalAgendaText: { color: 'white', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '90%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  textInput: { borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, padding: 12, fontSize: 16, color: '#333' },
  timeButton: { padding: 12, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, alignItems: 'center' },
  timeButtonText: { fontSize: 16 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, color: '#666', fontWeight: '600' },
  saveButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#9C27B0', alignItems: 'center' },
  saveButtonText: { fontSize: 16, color: 'white', fontWeight: '600' },
  timePickerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  timePickerContainer: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: '90%', maxHeight: '60%' },
  timePickerTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  timePickerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  timePickerOption: { padding: 12, borderRadius: 8, margin: 4, backgroundColor: '#F5F5F5' },
  timePickerOptionText: { fontSize: 16 },
  reservationDetailsModalContent: { backgroundColor: 'white', borderRadius: 20, width: '95%', maxHeight: '90%', overflow: 'hidden' },
  timeBlockContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  timeBlockButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E5E5' },
  timeBlockSelected: { backgroundColor: '#9C27B0', borderColor: '#9C27B0' },
  timeBlockText: { fontSize: 12, fontWeight: '600', color: '#666' },
  timeBlockTextSelected: { color: 'white' },
});