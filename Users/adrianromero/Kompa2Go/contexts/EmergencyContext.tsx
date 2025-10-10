import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { emergencyService } from '@/src/modules/emergency/services/emergency-service';
import { EmergencyAlert, EmergencyContact, SafetySettings } from '@/src/shared/types';
import { useFirebaseAuth } from './FirebaseAuthContext';
import * as Location from 'expo-location';

export const [EmergencyContext, useEmergency] = createContextHook(() => {
  const { user } = useFirebaseAuth();
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [settings, setSettings] = useState<SafetySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadActiveAlerts = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const alerts = await emergencyService.getUserActiveAlerts(user.uid);
      setActiveAlerts(alerts);
    } catch (error) {
      console.error('Error loading active alerts:', error);
    }
  }, [user?.uid]);

  const loadContacts = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const userContacts = await emergencyService.getUserEmergencyContacts(user.uid);
      setContacts(userContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }, [user?.uid]);

  const loadSettings = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const userSettings = await emergencyService.getSafetySettings(user.uid);
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadActiveAlerts();
      loadContacts();
      loadSettings();
    }
  }, [user?.uid, loadActiveAlerts, loadContacts, loadSettings]);

  const triggerPanicButton = useCallback(async (
    type: EmergencyAlert['type'] = 'panic',
    description?: string
  ): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const alertId = await emergencyService.createEmergencyAlert({
        userId: user.uid,
        userName: user.displayName || 'Usuario',
        userRole: 'client',
        type,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address[0]
            ? `${address[0].street}, ${address[0].city}, ${address[0].region}`
            : undefined,
          accuracy: location.coords.accuracy || undefined,
        },
        description,
        contacts,
        status: 'active',
        priority: 'critical',
        timeline: [],
      });

      await loadActiveAlerts();
      return alertId;
    } catch (error) {
      console.error('Error triggering panic button:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, user?.displayName, contacts, loadActiveAlerts]);

  const updateAlertStatus = useCallback(async (
    alertId: string,
    status: EmergencyAlert['status']
  ): Promise<void> => {
    try {
      await emergencyService.updateAlertStatus(alertId, status);
      await loadActiveAlerts();
    } catch (error) {
      console.error('Error updating alert status:', error);
      throw error;
    }
  }, [loadActiveAlerts]);

  const addContact = useCallback(async (
    contactData: Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    try {
      setLoading(true);
      const contactId = await emergencyService.addEmergencyContact(contactData);
      await loadContacts();
      return contactId;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadContacts]);

  const updateContact = useCallback(async (
    contactId: string,
    updates: Partial<Omit<EmergencyContact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> => {
    try {
      await emergencyService.updateEmergencyContact(contactId, updates);
      await loadContacts();
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }, [loadContacts]);

  const deleteContact = useCallback(async (contactId: string): Promise<void> => {
    try {
      await emergencyService.deleteEmergencyContact(contactId);
      await loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }, [loadContacts]);

  const updateSettings = useCallback(async (
    newSettings: Partial<Omit<SafetySettings, 'userId' | 'updatedAt'>>
  ): Promise<void> => {
    if (!user?.uid) return;
    try {
      await emergencyService.updateSafetySettings(user.uid, newSettings);
      await loadSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }, [user?.uid, loadSettings]);

  return useMemo(() => ({
    activeAlerts,
    contacts,
    settings,
    loading,
    triggerPanicButton,
    updateAlertStatus,
    addContact,
    updateContact,
    deleteContact,
    updateSettings,
    refreshAlerts: loadActiveAlerts,
    refreshContacts: loadContacts,
    refreshSettings: loadSettings,
  }), [activeAlerts, contacts, settings, loading, triggerPanicButton, updateAlertStatus, addContact, updateContact, deleteContact, updateSettings, loadActiveAlerts, loadContacts, loadSettings]);
});
