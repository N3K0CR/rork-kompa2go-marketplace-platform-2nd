export interface LogoServiceRequest {
  id?: string;
  clientInfo: {
    name: string;
    email: string;
    phone: string;
    companyName: string;
  };
  projectDetails: {
    businessType: string;
    targetAudience: string;
    preferredColors: string[];
    stylePreferences: ('modern' | 'classic' | 'minimalist' | 'bold' | 'playful')[];
    inspirationReferences?: string;
    additionalNotes?: string;
  };
  payment: {
    method: 'sinpe' | 'kash';
    advanceAmount: number;
    remainingAmount: number;
    totalAmount: number;
    advancePaid: boolean;
    remainingPaid: boolean;
    advancePaymentDate?: Date;
    remainingPaymentDate?: Date;
    transactionReference?: string;
  };
  status: 'pending_payment' | 'in_progress' | 'proposals_ready' | 'revision' | 'completed' | 'cancelled';
  proposals?: LogoProposal[];
  selectedProposal?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveryDate?: Date;
}

export interface LogoProposal {
  id: string;
  imageUrl: string;
  description: string;
  variations: string[];
  fileFormats: ('png' | 'svg' | 'pdf' | 'ai')[];
  createdAt: Date;
}

export interface PaymentInfo {
  method: 'sinpe' | 'kash';
  accountNumber: string;
  accountHolder: string;
  amount: number;
  reference: string;
}

export interface ProformaDocument {
  requestId: string;
  clientName: string;
  companyName: string;
  date: Date;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentTerms: string;
  validUntil: Date;
}

export interface SpecificationDocument {
  requestId: string;
  companyName: string;
  businessType: string;
  targetAudience: string;
  colorPalette: string[];
  stylePreferences: string[];
  deliveryFormat: string[];
  deliveryDate: Date;
  revisions: number;
  additionalNotes?: string;
}
