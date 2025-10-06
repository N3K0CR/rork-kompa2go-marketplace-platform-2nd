import { db } from '@/lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import type { 
  SecurityQuestion,
  KommuterSecuritySettings,
  AlertVerification
} from '@/src/shared/types/alert-types';

export const PREDEFINED_PRIMARY_QUESTIONS: Omit<SecurityQuestion, 'id' | 'answer'>[] = [
  {
    question: 'El gato tiene atrapado al ratón',
    category: 'primary',
    isCostaRicanContext: false
  },
  {
    question: 'El águila vuela al amanecer',
    category: 'primary',
    isCostaRicanContext: false
  },
  {
    question: 'La luna brilla en el océano',
    category: 'primary',
    isCostaRicanContext: false
  },
  {
    question: 'El lobo aúlla en la montaña',
    category: 'primary',
    isCostaRicanContext: false
  },
  {
    question: 'El río corre hacia el norte',
    category: 'primary',
    isCostaRicanContext: false
  }
];

export const PREDEFINED_SECONDARY_QUESTIONS: Omit<SecurityQuestion, 'id' | 'answer'>[] = [
  {
    question: 'Siempre estamos para caer en la Calle',
    category: 'secondary',
    isCostaRicanContext: true
  },
  {
    question: 'El casado casa quiere',
    category: 'secondary',
    isCostaRicanContext: true
  },
  {
    question: 'Más vale pájaro en mano que cien volando',
    category: 'secondary',
    isCostaRicanContext: true
  },
  {
    question: 'Pura vida mae',
    category: 'secondary',
    isCostaRicanContext: true
  },
  {
    question: 'Tuanis la fiesta del sábado',
    category: 'secondary',
    isCostaRicanContext: true
  },
  {
    question: 'El perro se comió las chanclas',
    category: 'secondary',
    isCostaRicanContext: true
  },
  {
    question: 'La abuela hizo arroz con pollo',
    category: 'secondary',
    isCostaRicanContext: true
  },
  {
    question: 'El gato se subió al techo otra vez',
    category: 'secondary',
    isCostaRicanContext: true
  }
];

export class SecurityVerificationService {
  async saveKommuterSecuritySettings(
    kommuterId: string,
    primaryQuestion: Omit<SecurityQuestion, 'id'>,
    secondaryQuestion: Omit<SecurityQuestion, 'id'>
  ): Promise<void> {
    try {
      console.log('[SecurityVerification] Saving security settings for kommuter:', kommuterId);
      
      const settingsRef = doc(db, 'kommuter_security_settings', kommuterId);
      
      const settings: Omit<KommuterSecuritySettings, 'primaryQuestion' | 'secondaryQuestion'> & {
        primaryQuestion: any;
        secondaryQuestion: any;
      } = {
        kommuterId,
        primaryQuestion: {
          ...primaryQuestion,
          id: `primary_${Date.now()}`
        },
        secondaryQuestion: {
          ...secondaryQuestion,
          id: `secondary_${Date.now()}`
        },
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any
      };
      
      await setDoc(settingsRef, settings);
      console.log('[SecurityVerification] ✅ Security settings saved');
    } catch (error) {
      console.error('[SecurityVerification] ❌ Error saving security settings:', error);
      throw new Error(`Failed to save security settings: ${error}`);
    }
  }

  async getKommuterSecuritySettings(kommuterId: string): Promise<KommuterSecuritySettings | null> {
    try {
      console.log('[SecurityVerification] Getting security settings for kommuter:', kommuterId);
      
      const settingsRef = doc(db, 'kommuter_security_settings', kommuterId);
      const settingsDoc = await getDoc(settingsRef);
      
      if (!settingsDoc.exists()) {
        console.log('[SecurityVerification] No security settings found');
        return null;
      }
      
      const data = settingsDoc.data();
      return {
        kommuterId: data.kommuterId,
        primaryQuestion: data.primaryQuestion,
        secondaryQuestion: data.secondaryQuestion,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };
    } catch (error) {
      console.error('[SecurityVerification] ❌ Error getting security settings:', error);
      throw error;
    }
  }

  async startVerification(
    alertId: string,
    verifiedBy: string
  ): Promise<SecurityQuestion> {
    try {
      console.log('[SecurityVerification] Starting verification for alert:', alertId);
      
      const alertRef = doc(db, 'driver_alerts', alertId);
      const alertDoc = await getDoc(alertRef);
      
      if (!alertDoc.exists()) {
        throw new Error('Alert not found');
      }
      
      const alertData = alertDoc.data();
      const driverId = alertData.driverId;
      
      const securitySettings = await this.getKommuterSecuritySettings(driverId);
      
      if (!securitySettings) {
        throw new Error('No security settings found for this driver');
      }
      
      const verification: Omit<AlertVerification, 'firstQuestionAsked' | 'verificationCompleted'> & {
        firstQuestionAsked: any;
      } = {
        alertId,
        currentStep: 'first_question',
        firstQuestionAsked: Timestamp.now(),
        verifiedBy
      };
      
      await updateDoc(alertRef, {
        status: 'awaiting_verification',
        verification: verification,
        updatedAt: Timestamp.now()
      });
      
      console.log('[SecurityVerification] ✅ Verification started');
      return securitySettings.primaryQuestion;
    } catch (error) {
      console.error('[SecurityVerification] ❌ Error starting verification:', error);
      throw error;
    }
  }

  async verifyFirstQuestion(
    alertId: string,
    answer: string
  ): Promise<{ correct: boolean; nextQuestion?: SecurityQuestion }> {
    try {
      console.log('[SecurityVerification] Verifying first question for alert:', alertId);
      
      const alertRef = doc(db, 'driver_alerts', alertId);
      const alertDoc = await getDoc(alertRef);
      
      if (!alertDoc.exists()) {
        throw new Error('Alert not found');
      }
      
      const alertData = alertDoc.data();
      const driverId = alertData.driverId;
      
      const securitySettings = await this.getKommuterSecuritySettings(driverId);
      
      if (!securitySettings) {
        throw new Error('No security settings found');
      }
      
      const isCorrect = answer.toLowerCase().trim() === securitySettings.primaryQuestion.answer.toLowerCase().trim();
      
      if (isCorrect) {
        await updateDoc(alertRef, {
          'verification.firstQuestionAnswer': answer,
          'verification.firstQuestionCorrect': true,
          'verification.currentStep': 'second_question',
          'verification.secondQuestionAsked': Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        console.log('[SecurityVerification] ✅ First question correct, moving to second question');
        return {
          correct: true,
          nextQuestion: securitySettings.secondaryQuestion
        };
      } else {
        await updateDoc(alertRef, {
          'verification.firstQuestionAnswer': answer,
          'verification.firstQuestionCorrect': false,
          'verification.currentStep': 'failed',
          'verification.verificationCompleted': Timestamp.now(),
          status: 'resolved',
          'resolution.resolvedAt': Timestamp.now(),
          'resolution.notes': 'Verificación fallida - Primera pregunta incorrecta',
          updatedAt: Timestamp.now()
        });
        
        console.log('[SecurityVerification] ❌ First question incorrect, alert dismissed');
        return { correct: false };
      }
    } catch (error) {
      console.error('[SecurityVerification] ❌ Error verifying first question:', error);
      throw error;
    }
  }

  async verifySecondQuestion(
    alertId: string,
    answer: string
  ): Promise<{ correct: boolean; action: 'enable_tracking' | 'call_911' | 'dismissed' }> {
    try {
      console.log('[SecurityVerification] Verifying second question for alert:', alertId);
      
      const alertRef = doc(db, 'driver_alerts', alertId);
      const alertDoc = await getDoc(alertRef);
      
      if (!alertDoc.exists()) {
        throw new Error('Alert not found');
      }
      
      const alertData = alertDoc.data();
      const driverId = alertData.driverId;
      
      const securitySettings = await this.getKommuterSecuritySettings(driverId);
      
      if (!securitySettings) {
        throw new Error('No security settings found');
      }
      
      const isCorrect = answer.toLowerCase().trim() === securitySettings.secondaryQuestion.answer.toLowerCase().trim();
      
      if (isCorrect) {
        await updateDoc(alertRef, {
          'verification.secondQuestionAnswer': answer,
          'verification.secondQuestionCorrect': true,
          'verification.currentStep': 'completed',
          'verification.verificationCompleted': Timestamp.now(),
          'verification.actionTaken': 'call_911',
          status: 'investigating',
          updatedAt: Timestamp.now()
        });
        
        console.log('[SecurityVerification] ✅ Second question correct, initiating 911 protocol');
        return {
          correct: true,
          action: 'call_911'
        };
      } else {
        await updateDoc(alertRef, {
          'verification.secondQuestionAnswer': answer,
          'verification.secondQuestionCorrect': false,
          'verification.currentStep': 'failed',
          'verification.verificationCompleted': Timestamp.now(),
          status: 'resolved',
          'resolution.resolvedAt': Timestamp.now(),
          'resolution.notes': 'Verificación fallida - Segunda pregunta incorrecta',
          updatedAt: Timestamp.now()
        });
        
        console.log('[SecurityVerification] ❌ Second question incorrect, alert dismissed');
        return {
          correct: false,
          action: 'dismissed'
        };
      }
    } catch (error) {
      console.error('[SecurityVerification] ❌ Error verifying second question:', error);
      throw error;
    }
  }

  async getAlertVerificationStatus(alertId: string): Promise<AlertVerification | null> {
    try {
      const alertRef = doc(db, 'driver_alerts', alertId);
      const alertDoc = await getDoc(alertRef);
      
      if (!alertDoc.exists()) {
        return null;
      }
      
      const data = alertDoc.data();
      if (!data.verification) {
        return null;
      }
      
      const verification = data.verification;
      return {
        alertId: verification.alertId,
        currentStep: verification.currentStep,
        firstQuestionAsked: verification.firstQuestionAsked?.toDate(),
        firstQuestionAnswer: verification.firstQuestionAnswer,
        firstQuestionCorrect: verification.firstQuestionCorrect,
        secondQuestionAsked: verification.secondQuestionAsked?.toDate(),
        secondQuestionAnswer: verification.secondQuestionAnswer,
        secondQuestionCorrect: verification.secondQuestionCorrect,
        verificationCompleted: verification.verificationCompleted?.toDate(),
        actionTaken: verification.actionTaken,
        verifiedBy: verification.verifiedBy
      };
    } catch (error) {
      console.error('[SecurityVerification] Error getting verification status:', error);
      throw error;
    }
  }
}

export const securityVerificationService = new SecurityVerificationService();
