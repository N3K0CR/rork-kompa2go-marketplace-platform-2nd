import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { helpService } from '@/src/modules/help/services/help-service';
import { HelpArticle, SupportTicket, FAQ } from '@/src/shared/types';
import { useFirebaseAuth } from './FirebaseAuthContext';

export const [HelpContext, useHelp] = createContextHook(() => {
  const { user } = useFirebaseAuth();
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadArticles = useCallback(async (category?: string, language: 'es' | 'en' = 'es') => {
    try {
      setLoading(true);
      const data = await helpService.getHelpArticles(category, language);
      setArticles(data);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchArticles = useCallback(async (searchTerm: string, language: 'es' | 'en' = 'es') => {
    try {
      setLoading(true);
      const data = await helpService.searchHelpArticles(searchTerm, language);
      setArticles(data);
    } catch (error) {
      console.error('Error searching articles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserTickets = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const data = await helpService.getUserSupportTickets(user.uid);
      setTickets(data);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const loadFAQs = useCallback(async (category?: string, language: 'es' | 'en' = 'es') => {
    try {
      setLoading(true);
      const data = await helpService.getFAQs(category, language);
      setFAQs(data);
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (
    ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>
  ): Promise<string> => {
    try {
      setLoading(true);
      const ticketId = await helpService.createSupportTicket(ticketData);
      await loadUserTickets();
      return ticketId;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadUserTickets]);

  const addMessageToTicket = useCallback(async (
    ticketId: string,
    content: string
  ): Promise<void> => {
    if (!user?.uid) return;
    try {
      await helpService.addMessageToTicket(ticketId, {
        ticketId,
        senderId: user.uid,
        senderName: user.displayName || 'Usuario',
        senderRole: 'user',
        content,
        internal: false,
      });
      await loadUserTickets();
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }, [user?.uid, user?.displayName, loadUserTickets]);

  const markArticleHelpful = useCallback(async (articleId: string, helpful: boolean) => {
    try {
      await helpService.markArticleHelpful(articleId, helpful);
    } catch (error) {
      console.error('Error marking article helpful:', error);
    }
  }, []);

  const markFAQHelpful = useCallback(async (faqId: string, helpful: boolean) => {
    try {
      await helpService.markFAQHelpful(faqId, helpful);
    } catch (error) {
      console.error('Error marking FAQ helpful:', error);
    }
  }, []);

  return useMemo(() => ({
    articles,
    tickets,
    faqs,
    loading,
    loadArticles,
    searchArticles,
    loadUserTickets,
    loadFAQs,
    createTicket,
    addMessageToTicket,
    markArticleHelpful,
    markFAQHelpful,
  }), [articles, tickets, faqs, loading, loadArticles, searchArticles, loadUserTickets, loadFAQs, createTicket, addMessageToTicket, markArticleHelpful, markFAQHelpful]);
});
