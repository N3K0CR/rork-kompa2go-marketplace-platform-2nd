import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { NotificationService } from '@/src/modules/notifications/services/notification-service';
import type { PushNotification, NotificationPreferences } from '@/src/shared/types/notification-types';
import { useFirebaseAuth } from './FirebaseAuthContext';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

interface NotificationContextValue {
  notifications: PushNotification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: string | null;
  
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export const [NotificationContext, useNotifications] = createContextHook<NotificationContextValue>(() => {
  const { firebaseUser } = useFirebaseAuth();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    console.log('Setting up notifications for user:', firebaseUser.uid);
    
    NotificationService.registerDeviceToken(firebaseUser.uid).catch((err: unknown) => {
      console.error('Error registering device token:', err);
    });

    const unsubscribe = NotificationService.subscribeToNotifications(
      firebaseUser.uid,
      (userNotifications: PushNotification[]) => {
        console.log('Notifications updated:', userNotifications.length);
        setNotifications(userNotifications);
        const unread = userNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    );

    NotificationService.getPreferences(firebaseUser.uid).then((prefs) => {
      setPreferences(prefs);
    }).catch((err: unknown) => {
      console.error('Error loading preferences:', err);
    });

    return () => {
      console.log('Unsubscribing from notifications');
      unsubscribe();
    };
  }, [firebaseUser?.uid]);

  useEffect(() => {
    const cleanup = NotificationService.setupNotificationListeners(
      (notification: Notifications.Notification) => {
        console.log('Notification received:', notification);
      },
      (response: Notifications.NotificationResponse) => {
        console.log('Notification response:', response);
        const data = response.notification.request.content.data;
        
        if (data?.type && data?.relatedId) {
          switch (data.type) {
            case 'trip':
              router.push(`/commute/trip/${data.relatedId}`);
              break;
            case 'chat':
              router.push(`/chat/conversation?chatId=${data.relatedId}`);
              break;
            case 'payment':
              router.push('/client/payment-methods');
              break;
            case 'service':
              router.push(`/provider/${data.relatedId}`);
              break;
            case 'rating':
              router.push('/client/kommute-history');
              break;
            case 'emergency':
              console.log('Emergency notification received');
              break;
          }
        }
      }
    );

    return cleanup;
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      setLoading(true);
      setError(null);
      await NotificationService.markAsRead(notificationId);
      console.log('Notification marked as read');
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err.message : 'Error al marcar notificación');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!firebaseUser?.uid) return;

    try {
      setLoading(true);
      setError(null);
      await NotificationService.markAllAsRead(firebaseUser.uid);
      console.log('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err instanceof Error ? err.message : 'Error al marcar todas las notificaciones');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [firebaseUser?.uid]);

  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    if (!firebaseUser?.uid) return;

    try {
      setLoading(true);
      setError(null);
      await NotificationService.updatePreferences(firebaseUser.uid, prefs);
      const updated = await NotificationService.getPreferences(firebaseUser.uid);
      setPreferences(updated);
      console.log('Preferences updated');
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar preferencias');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [firebaseUser?.uid]);

  const refreshNotifications = useCallback(async () => {
    if (!firebaseUser?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const count = await NotificationService.getUnreadCount(firebaseUser.uid);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error refreshing notifications:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser?.uid]);

  return useMemo(() => ({
    notifications,
    unreadCount,
    preferences,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    refreshNotifications,
  }), [notifications, unreadCount, preferences, loading, error, markAsRead, markAllAsRead, updatePreferences, refreshNotifications]);
});
