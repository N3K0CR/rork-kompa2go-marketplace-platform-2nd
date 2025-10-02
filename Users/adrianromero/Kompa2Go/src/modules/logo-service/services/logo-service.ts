import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  LogoServiceRequest,
  LogoProposal,
  PaymentInfo,
  ProformaDocument,
  SpecificationDocument,
} from '@/src/shared/types';

const LOGO_REQUESTS_COLLECTION = 'logo_requests';

export class LogoService {
  static readonly ADVANCE_AMOUNT = 13000;
  static readonly REMAINING_AMOUNT = 12000;
  static readonly TOTAL_AMOUNT = 25000;
  static readonly DELIVERY_HOURS = 72;

  static async createLogoRequest(
    clientInfo: LogoServiceRequest['clientInfo'],
    projectDetails: LogoServiceRequest['projectDetails'],
    paymentMethod: 'sinpe' | 'kash'
  ): Promise<string> {
    try {
      const requestId = `logo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const deliveryDate = new Date();
      deliveryDate.setHours(deliveryDate.getHours() + this.DELIVERY_HOURS);

      const logoRequest: LogoServiceRequest = {
        id: requestId,
        clientInfo,
        projectDetails,
        payment: {
          method: paymentMethod,
          advanceAmount: this.ADVANCE_AMOUNT,
          remainingAmount: this.REMAINING_AMOUNT,
          totalAmount: this.TOTAL_AMOUNT,
          advancePaid: false,
          remainingPaid: false,
        },
        status: 'pending_payment',
        createdAt: new Date(),
        updatedAt: new Date(),
        deliveryDate,
      };

      await setDoc(doc(db, LOGO_REQUESTS_COLLECTION, requestId), {
        ...logoRequest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('Logo request created successfully:', requestId);
      return requestId;
    } catch (error) {
      console.error('Error creating logo request:', error);
      throw new Error('Failed to create logo request');
    }
  }

  static async updatePaymentStatus(
    requestId: string,
    paymentType: 'advance' | 'remaining',
    transactionReference: string
  ): Promise<void> {
    try {
      const requestRef = doc(db, LOGO_REQUESTS_COLLECTION, requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error('Logo request not found');
      }

      const updates: any = {
        updatedAt: serverTimestamp(),
      };

      if (paymentType === 'advance') {
        updates['payment.advancePaid'] = true;
        updates['payment.advancePaymentDate'] = serverTimestamp();
        updates['payment.transactionReference'] = transactionReference;
        updates.status = 'in_progress';
      } else {
        updates['payment.remainingPaid'] = true;
        updates['payment.remainingPaymentDate'] = serverTimestamp();
      }

      await updateDoc(requestRef, updates);
      console.log('Payment status updated:', requestId, paymentType);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  static async addProposals(
    requestId: string,
    proposals: Omit<LogoProposal, 'id' | 'createdAt'>[]
  ): Promise<void> {
    try {
      const requestRef = doc(db, LOGO_REQUESTS_COLLECTION, requestId);
      
      const proposalsWithIds: LogoProposal[] = proposals.map((proposal) => ({
        ...proposal,
        id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      }));

      await updateDoc(requestRef, {
        proposals: proposalsWithIds,
        status: 'proposals_ready',
        updatedAt: serverTimestamp(),
      });

      console.log('Proposals added successfully:', requestId);
    } catch (error) {
      console.error('Error adding proposals:', error);
      throw error;
    }
  }

  static async selectProposal(requestId: string, proposalId: string): Promise<void> {
    try {
      const requestRef = doc(db, LOGO_REQUESTS_COLLECTION, requestId);
      
      await updateDoc(requestRef, {
        selectedProposal: proposalId,
        status: 'revision',
        updatedAt: serverTimestamp(),
      });

      console.log('Proposal selected:', requestId, proposalId);
    } catch (error) {
      console.error('Error selecting proposal:', error);
      throw error;
    }
  }

  static async completeRequest(requestId: string): Promise<void> {
    try {
      const requestRef = doc(db, LOGO_REQUESTS_COLLECTION, requestId);
      
      await updateDoc(requestRef, {
        status: 'completed',
        updatedAt: serverTimestamp(),
      });

      console.log('Request completed:', requestId);
    } catch (error) {
      console.error('Error completing request:', error);
      throw error;
    }
  }

  static async cancelRequest(requestId: string): Promise<void> {
    try {
      const requestRef = doc(db, LOGO_REQUESTS_COLLECTION, requestId);
      const requestDoc = await getDoc(requestRef);

      if (!requestDoc.exists()) {
        throw new Error('Logo request not found');
      }

      const requestData = requestDoc.data() as LogoServiceRequest;

      if (requestData.payment.advancePaid) {
        console.warn('Advance payment is non-refundable');
      }

      await updateDoc(requestRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });

      console.log('Request cancelled:', requestId);
    } catch (error) {
      console.error('Error cancelling request:', error);
      throw error;
    }
  }

  static async getLogoRequest(requestId: string): Promise<LogoServiceRequest | null> {
    try {
      const requestDoc = await getDoc(doc(db, LOGO_REQUESTS_COLLECTION, requestId));
      if (!requestDoc.exists()) return null;
      return requestDoc.data() as LogoServiceRequest;
    } catch (error) {
      console.error('Error getting logo request:', error);
      return null;
    }
  }

  static async getClientRequests(email: string): Promise<LogoServiceRequest[]> {
    try {
      const requestsQuery = query(
        collection(db, LOGO_REQUESTS_COLLECTION),
        where('clientInfo.email', '==', email)
      );

      const snapshot = await getDocs(requestsQuery);
      return snapshot.docs.map((doc) => doc.data() as LogoServiceRequest);
    } catch (error) {
      console.error('Error getting client requests:', error);
      return [];
    }
  }

  static getPaymentInfo(method: 'sinpe' | 'kash', amount: number): PaymentInfo {
    if (method === 'sinpe') {
      return {
        method: 'sinpe',
        accountNumber: '8888-8888',
        accountHolder: 'Kompa2Go S.A.',
        amount,
        reference: `LOGO-${Date.now()}`,
      };
    } else {
      return {
        method: 'kash',
        accountNumber: 'kompa2go@kash.cr',
        accountHolder: 'Kompa2Go',
        amount,
        reference: `LOGO-${Date.now()}`,
      };
    }
  }

  static generateProforma(request: LogoServiceRequest): ProformaDocument {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 15);

    return {
      requestId: request.id!,
      clientName: request.clientInfo.name,
      companyName: request.clientInfo.companyName,
      date: request.createdAt,
      items: [
        {
          description: 'Diseño de Logo Profesional - 3 Propuestas',
          quantity: 1,
          unitPrice: this.TOTAL_AMOUNT,
          total: this.TOTAL_AMOUNT,
        },
      ],
      subtotal: this.TOTAL_AMOUNT,
      tax: 0,
      total: this.TOTAL_AMOUNT,
      paymentTerms: `Adelanto: ₡${this.ADVANCE_AMOUNT.toLocaleString()} (no reembolsable)\nSaldo: ₡${this.REMAINING_AMOUNT.toLocaleString()} (al aprobar propuesta)`,
      validUntil,
    };
  }

  static generateSpecification(request: LogoServiceRequest): SpecificationDocument {
    return {
      requestId: request.id!,
      companyName: request.clientInfo.companyName,
      businessType: request.projectDetails.businessType,
      targetAudience: request.projectDetails.targetAudience,
      colorPalette: request.projectDetails.preferredColors,
      stylePreferences: request.projectDetails.stylePreferences,
      deliveryFormat: ['PNG', 'SVG', 'PDF', 'AI'],
      deliveryDate: request.deliveryDate!,
      revisions: 2,
      additionalNotes: request.projectDetails.additionalNotes,
    };
  }
}
