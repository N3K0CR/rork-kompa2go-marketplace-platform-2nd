export interface HelpArticle {
  id: string;
  category: 'getting-started' | 'trips' | 'payments' | 'services' | 'account' | 'safety' | 'faq';
  title: string;
  content: string;
  tags: string[];
  relatedArticles: string[];
  helpful: number;
  notHelpful: number;
  views: number;
  language: 'es' | 'en';
  status: 'published' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'client' | 'kommuter' | 'provider';
  category: 'technical' | 'payment' | 'trip' | 'service' | 'account' | 'safety' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  attachments?: string[];
  relatedTo?: {
    type: 'trip' | 'service' | 'payment';
    id: string;
  };
  status: 'open' | 'in-progress' | 'waiting-user' | 'resolved' | 'closed';
  assignedTo?: string;
  messages: SupportMessage[];
  resolution?: string;
  satisfactionRating?: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'support' | 'system';
  content: string;
  attachments?: string[];
  internal: boolean;
  createdAt: Date;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  helpful: number;
  notHelpful: number;
  language: 'es' | 'en';
  status: 'published' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}
