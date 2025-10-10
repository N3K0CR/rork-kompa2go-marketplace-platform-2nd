export interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: {
    type: 'trip' | 'chat' | 'payment' | 'service' | 'rating' | 'emergency' | 'general';
    relatedId?: string;
    action?: string;
  };
  priority: 'high' | 'normal' | 'low';
  read: boolean;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  categories: {
    trips: boolean;
    chats: boolean;
    payments: boolean;
    services: boolean;
    ratings: boolean;
    promotions: boolean;
    emergency: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  updatedAt: Date;
}

export interface DeviceToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId: string;
  active: boolean;
  createdAt: Date;
  lastUsed: Date;
}
