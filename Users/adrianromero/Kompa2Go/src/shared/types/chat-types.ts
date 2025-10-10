export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'client' | 'kommuter' | 'provider' | 'admin';
  content: string;
  type: 'text' | 'image' | 'location' | 'system';
  imageUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  participants: {
    userId: string;
    userName: string;
    userRole: 'client' | 'kommuter' | 'provider' | 'admin';
    photoUrl?: string;
  }[];
  type: 'client-kommuter' | 'client-provider' | 'support';
  relatedTo?: {
    type: 'trip' | 'service' | 'support';
    id: string;
  };
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Date;
  };
  unreadCount: {
    [userId: string]: number;
  };
  status: 'active' | 'archived' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatNotification {
  id: string;
  userId: string;
  chatId: string;
  messageId: string;
  senderName: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: Date;
}
