import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs,
  serverTimestamp,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { 
  PushNotification, 
  NotificationPreferences, 
  DeviceToken 
} from '@/src/shared/types/notification-types';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NOTIFICATIONS_COLLECTION = 'notifications';
const PREFERENCES_COLLECTION = 'notificationPreferences';
const DEVICE_TOKENS_COLLECTION = 'deviceTokens';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('Push notifications not supported on web');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission not granted for notifications');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async registerDeviceToken(userId: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      const deviceId = await this.getDeviceId();

      const tokenData: Omit<DeviceToken, 'createdAt' | 'lastUsed'> = {
        userId,
        token,
        platform: Platform.OS as 'ios' | 'android',
        deviceId,
        active: true,
      };

      const tokensRef = collection(db, DEVICE_TOKENS_COLLECTION);
      const q = query(
        tokensRef,
        where('userId', '==', userId),
        where('deviceId', '==', deviceId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(tokensRef, {
          ...tokenData,
          createdAt: serverTimestamp(),
          lastUsed: serverTimestamp(),
        });
      } else {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          token,
          active: true,
          lastUsed: serverTimestamp(),
        });
      }

      console.log('Device token registered:', token);
      return token;
    } catch (error) {
      console.error('Error registering device token:', error);
      return null;
    }
  }

  static async getDeviceId(): Promise<string> {
    return `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static async sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: PushNotification['data'],
    priority: PushNotification['priority'] = 'normal'
  ): Promise<string> {
    try {
      const notificationData: Omit<PushNotification, 'id' | 'createdAt'> = {
        userId,
        title,
        body,
        data,
        priority,
        read: false,
      };

      const notifRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
        ...notificationData,
        createdAt: serverTimestamp(),
        sentAt: serverTimestamp(),
      });

      if (Platform.OS !== 'web') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: data || {},
            sound: true,
            priority: priority === 'high' ? Notifications.AndroidNotificationPriority.HIGH : Notifications.AndroidNotificationPriority.DEFAULT,
          },
          trigger: null,
        });
      }

      console.log('Notification sent:', notifRef.id);
      return notifRef.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  static async sendBulkNotifications(
    userIds: string[],
    title: string,
    body: string,
    data?: PushNotification['data'],
    priority: PushNotification['priority'] = 'normal'
  ): Promise<void> {
    try {
      const batch = writeBatch(db);
      const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);

      userIds.forEach((userId) => {
        const docRef = doc(notificationsRef);
        batch.set(docRef, {
          userId,
          title,
          body,
          data: data || null,
          priority,
          read: false,
          createdAt: serverTimestamp(),
          sentAt: serverTimestamp(),
        });
      });

      await batch.commit();
      console.log(`Bulk notifications sent to ${userIds.length} users`);
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  static subscribeToNotifications(
    userId: string,
    callback: (notifications: PushNotification[]) => void
  ): () => void {
    const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          sentAt: data.sentAt?.toDate(),
          deliveredAt: data.deliveredAt?.toDate(),
          openedAt: data.openedAt?.toDate(),
        } as PushNotification;
      });
      callback(notifications);
    }, (error) => {
      console.error('Error subscribing to notifications:', error);
      callback([]);
    });
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(notifRef, {
        read: true,
        openedAt: serverTimestamp(),
      });
      console.log('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          openedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      console.log('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const prefsRef = collection(db, PREFERENCES_COLLECTION);
      const q = query(prefsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const data = snapshot.docs[0].data();
      return {
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as NotificationPreferences;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  static async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const prefsRef = collection(db, PREFERENCES_COLLECTION);
      const q = query(prefsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(prefsRef, {
          userId,
          pushEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
          categories: {
            trips: true,
            chats: true,
            payments: true,
            services: true,
            ratings: true,
            promotions: false,
            emergency: true,
          },
          ...preferences,
          updatedAt: serverTimestamp(),
        });
      } else {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          ...preferences,
          updatedAt: serverTimestamp(),
        });
      }

      console.log('Notification preferences updated');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  static setupNotificationListeners(
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationResponse: (response: Notifications.NotificationResponse) => void
  ): () => void {
    if (Platform.OS === 'web') {
      return () => {};
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(onNotificationReceived);
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }
}
