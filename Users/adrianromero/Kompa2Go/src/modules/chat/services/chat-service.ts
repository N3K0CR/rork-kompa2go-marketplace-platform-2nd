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
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat, ChatMessage, TypingIndicator } from '../../../shared/types/chat-types';

const CHATS_COLLECTION = 'chats';
const MESSAGES_COLLECTION = 'messages';
const TYPING_COLLECTION = 'typing';

export class ChatService {
  static async createChat(
    participants: Chat['participants'],
    type: Chat['type'],
    relatedTo?: Chat['relatedTo']
  ): Promise<string> {
    try {
      const chatData = {
        participants,
        type,
        relatedTo: relatedTo || null,
        unreadCount: participants.reduce((acc: Record<string, number>, p: Chat['participants'][0]) => ({ ...acc, [p.userId]: 0 }), {}),
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const chatRef = await addDoc(collection(db, CHATS_COLLECTION), chatData);
      console.log('Chat created:', chatRef.id);
      return chatRef.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  static async findOrCreateChat(
    userId1: string,
    userId2: string,
    type: Chat['type'],
    relatedTo?: Chat['relatedTo']
  ): Promise<string> {
    try {
      const chatsRef = collection(db, CHATS_COLLECTION);
      const q = query(
        chatsRef,
        where('type', '==', type),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      
      const existingChat = snapshot.docs.find(doc => {
        const data = doc.data();
        const participantIds = data.participants.map((p: any) => p.userId);
        return participantIds.includes(userId1) && participantIds.includes(userId2);
      });

      if (existingChat) {
        return existingChat.id;
      }

      return await this.createChat([], type, relatedTo);
    } catch (error) {
      console.error('Error finding or creating chat:', error);
      throw error;
    }
  }

  static async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    senderRole: ChatMessage['senderRole'],
    content: string,
    type: ChatMessage['type'] = 'text',
    additionalData?: Partial<ChatMessage>
  ): Promise<string> {
    try {
      const messageData = {
        chatId,
        senderId,
        senderName,
        senderRole,
        content,
        type,
        ...additionalData,
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const messageRef = await addDoc(collection(db, MESSAGES_COLLECTION), messageData);

      const chatRef = doc(db, CHATS_COLLECTION, chatId);
      const chatDoc = await getDocs(query(collection(db, CHATS_COLLECTION), where('__name__', '==', chatId)));
      
      if (!chatDoc.empty) {
        const chatData = chatDoc.docs[0].data();
        const unreadCount = { ...chatData.unreadCount };
        
        chatData.participants.forEach((p: any) => {
          if (p.userId !== senderId) {
            unreadCount[p.userId] = (unreadCount[p.userId] || 0) + 1;
          }
        });

        await updateDoc(chatRef, {
          lastMessage: {
            content,
            senderId,
            timestamp: serverTimestamp(),
          },
          unreadCount,
          updatedAt: serverTimestamp(),
        });
      }

      console.log('Message sent:', messageRef.id);
      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static subscribeToChat(chatId: string, callback: (chat: Chat | null) => void): () => void {
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    
    return onSnapshot(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          id: snapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastMessage: data.lastMessage ? {
            ...data.lastMessage,
            timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
          } : undefined,
        } as Chat);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error subscribing to chat:', error);
      callback(null);
    });
  }

  static subscribeToMessages(
    chatId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as ChatMessage;
      });
      callback(messages);
    }, (error) => {
      console.error('Error subscribing to messages:', error);
      callback([]);
    });
  }

  static subscribeToUserChats(
    userId: string,
    callback: (chats: Chat[]) => void
  ): () => void {
    const chatsRef = collection(db, CHATS_COLLECTION);
    const q = query(
      chatsRef,
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastMessage: data.lastMessage ? {
              ...data.lastMessage,
              timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
            } : undefined,
          } as Chat;
        })
        .filter(chat => chat.participants.some((p: any) => p.userId === userId));
      
      callback(chats);
    }, (error) => {
      console.error('Error subscribing to user chats:', error);
      callback([]);
    });
  }

  static async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      const messagesRef = collection(db, MESSAGES_COLLECTION);
      const q = query(
        messagesRef,
        where('chatId', '==', chatId),
        where('senderId', '!=', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      const chatRef = doc(db, CHATS_COLLECTION, chatId);
      batch.update(chatRef, {
        [`unreadCount.${userId}`]: 0,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      console.log('Messages marked as read');
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  static async setTypingIndicator(
    chatId: string,
    userId: string,
    userName: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const typingRef = doc(db, TYPING_COLLECTION, `${chatId}_${userId}`);
      
      if (isTyping) {
        await updateDoc(typingRef, {
          chatId,
          userId,
          userName,
          isTyping: true,
          timestamp: serverTimestamp(),
        });
      } else {
        await updateDoc(typingRef, {
          isTyping: false,
          timestamp: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  }

  static subscribeToTypingIndicators(
    chatId: string,
    currentUserId: string,
    callback: (typing: TypingIndicator[]) => void
  ): () => void {
    const typingRef = collection(db, TYPING_COLLECTION);
    const q = query(
      typingRef,
      where('chatId', '==', chatId),
      where('isTyping', '==', true)
    );

    return onSnapshot(q, (snapshot) => {
      const indicators = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
          } as TypingIndicator;
        })
        .filter(indicator => indicator.userId !== currentUserId);
      
      callback(indicators);
    }, (error) => {
      console.error('Error subscribing to typing indicators:', error);
      callback([]);
    });
  }

  static async archiveChat(chatId: string): Promise<void> {
    try {
      const chatRef = doc(db, CHATS_COLLECTION, chatId);
      await updateDoc(chatRef, {
        status: 'archived',
        updatedAt: serverTimestamp(),
      });
      console.log('Chat archived');
    } catch (error) {
      console.error('Error archiving chat:', error);
      throw error;
    }
  }

  static async blockChat(chatId: string): Promise<void> {
    try {
      const chatRef = doc(db, CHATS_COLLECTION, chatId);
      await updateDoc(chatRef, {
        status: 'blocked',
        updatedAt: serverTimestamp(),
      });
      console.log('Chat blocked');
    } catch (error) {
      console.error('Error blocking chat:', error);
      throw error;
    }
  }
}
