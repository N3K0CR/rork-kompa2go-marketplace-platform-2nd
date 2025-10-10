import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { HelpArticle, SupportTicket, SupportMessage, FAQ } from '@/src/shared/types';

const HELP_ARTICLES_COLLECTION = 'helpArticles';
const SUPPORT_TICKETS_COLLECTION = 'supportTickets';
const FAQS_COLLECTION = 'faqs';

export class HelpService {
  async getHelpArticles(category?: string, language: 'es' | 'en' = 'es'): Promise<HelpArticle[]> {
    try {
      let q = query(
        collection(db, HELP_ARTICLES_COLLECTION),
        where('status', '==', 'published'),
        where('language', '==', language)
      );

      if (category) {
        q = query(q, where('category', '==', category));
      }

      q = query(q, orderBy('views', 'desc'), limit(20));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as HelpArticle[];
    } catch (error) {
      console.error('Error getting help articles:', error);
      throw error;
    }
  }

  async getHelpArticle(articleId: string): Promise<HelpArticle | null> {
    try {
      const docRef = doc(db, HELP_ARTICLES_COLLECTION, articleId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      await updateDoc(docRef, {
        views: increment(1),
      });

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
      } as HelpArticle;
    } catch (error) {
      console.error('Error getting help article:', error);
      throw error;
    }
  }

  async searchHelpArticles(searchTerm: string, language: 'es' | 'en' = 'es'): Promise<HelpArticle[]> {
    try {
      const q = query(
        collection(db, HELP_ARTICLES_COLLECTION),
        where('status', '==', 'published'),
        where('language', '==', language),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const articles = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as HelpArticle[];

      const searchLower = searchTerm.toLowerCase();
      return articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower) ||
          article.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error('Error searching help articles:', error);
      throw error;
    }
  }

  async markArticleHelpful(articleId: string, helpful: boolean): Promise<void> {
    try {
      const docRef = doc(db, HELP_ARTICLES_COLLECTION, articleId);
      await updateDoc(docRef, {
        [helpful ? 'helpful' : 'notHelpful']: increment(1),
      });
    } catch (error) {
      console.error('Error marking article helpful:', error);
      throw error;
    }
  }

  async createSupportTicket(
    ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>
  ): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, SUPPORT_TICKETS_COLLECTION), {
        ...ticketData,
        messages: [],
        createdAt: now,
        updatedAt: now,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  async getSupportTicket(ticketId: string): Promise<SupportTicket | null> {
    try {
      const docRef = doc(db, SUPPORT_TICKETS_COLLECTION, ticketId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
        resolvedAt: docSnap.data().resolvedAt?.toDate(),
        messages: docSnap.data().messages?.map((msg: any) => ({
          ...msg,
          createdAt: msg.createdAt?.toDate(),
        })),
      } as SupportTicket;
    } catch (error) {
      console.error('Error getting support ticket:', error);
      throw error;
    }
  }

  async getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
    try {
      const q = query(
        collection(db, SUPPORT_TICKETS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        resolvedAt: doc.data().resolvedAt?.toDate(),
        messages: doc.data().messages?.map((msg: any) => ({
          ...msg,
          createdAt: msg.createdAt?.toDate(),
        })),
      })) as SupportTicket[];
    } catch (error) {
      console.error('Error getting user support tickets:', error);
      throw error;
    }
  }

  async addMessageToTicket(
    ticketId: string,
    message: Omit<SupportMessage, 'id' | 'createdAt'>
  ): Promise<void> {
    try {
      const docRef = doc(db, SUPPORT_TICKETS_COLLECTION, ticketId);
      await runTransaction(db, async (transaction) => {
        const ticketDoc = await transaction.get(docRef);
        if (!ticketDoc.exists()) {
          throw new Error('Ticket not found');
        }

        const messages = ticketDoc.data().messages || [];
        const newMessage = {
          ...message,
          id: `msg_${Date.now()}`,
          createdAt: Timestamp.now(),
        };

        transaction.update(docRef, {
          messages: [...messages, newMessage],
          updatedAt: Timestamp.now(),
        });
      });
    } catch (error) {
      console.error('Error adding message to ticket:', error);
      throw error;
    }
  }

  async updateTicketStatus(
    ticketId: string,
    status: SupportTicket['status'],
    resolution?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, SUPPORT_TICKETS_COLLECTION, ticketId);
      const updateData: any = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = Timestamp.now();
        if (resolution) {
          updateData.resolution = resolution;
        }
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  }

  async rateTicketResolution(ticketId: string, rating: number): Promise<void> {
    try {
      const docRef = doc(db, SUPPORT_TICKETS_COLLECTION, ticketId);
      await updateDoc(docRef, {
        satisfactionRating: rating,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error rating ticket resolution:', error);
      throw error;
    }
  }

  async getFAQs(category?: string, language: 'es' | 'en' = 'es'): Promise<FAQ[]> {
    try {
      let q = query(
        collection(db, FAQS_COLLECTION),
        where('status', '==', 'published'),
        where('language', '==', language)
      );

      if (category) {
        q = query(q, where('category', '==', category));
      }

      q = query(q, orderBy('order', 'asc'));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as FAQ[];
    } catch (error) {
      console.error('Error getting FAQs:', error);
      throw error;
    }
  }

  async markFAQHelpful(faqId: string, helpful: boolean): Promise<void> {
    try {
      const docRef = doc(db, FAQS_COLLECTION, faqId);
      await updateDoc(docRef, {
        [helpful ? 'helpful' : 'notHelpful']: increment(1),
      });
    } catch (error) {
      console.error('Error marking FAQ helpful:', error);
      throw error;
    }
  }
}

export const helpService = new HelpService();
