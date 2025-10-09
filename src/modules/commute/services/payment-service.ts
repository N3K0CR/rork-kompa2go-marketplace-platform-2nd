import AsyncStorage from '@react-native-async-storage/async-storage';

const PAYMENT_METHODS_KEY = '@kommute_payment_methods';

export type PaymentMethodType = 'cash' | 'card' | 'sinpe' | 'wallet';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  isDefault: boolean;
  details?: {
    cardNumber?: string;
    cardHolder?: string;
    expiryDate?: string;
    sinpePhone?: string;
  };
  createdAt: Date;
}

class PaymentService {
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const data = await AsyncStorage.getItem(`${PAYMENT_METHODS_KEY}_${userId}`);
      if (!data) {
        return this.getDefaultPaymentMethods();
      }
      
      const methods: PaymentMethod[] = JSON.parse(data);
      return methods.map(method => ({
        ...method,
        createdAt: new Date(method.createdAt),
      }));
    } catch (error) {
      console.error('[PaymentService] Error getting payment methods:', error);
      return this.getDefaultPaymentMethods();
    }
  }

  private getDefaultPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'cash_default',
        type: 'cash',
        name: 'Efectivo',
        isDefault: true,
        createdAt: new Date(),
      },
    ];
  }

  async addPaymentMethod(userId: string, method: Omit<PaymentMethod, 'id' | 'createdAt'>): Promise<PaymentMethod> {
    try {
      const methods = await this.getPaymentMethods(userId);
      
      const newMethod: PaymentMethod = {
        ...method,
        id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      };
      
      if (newMethod.isDefault) {
        methods.forEach(m => m.isDefault = false);
      }
      
      const updatedMethods = [...methods, newMethod];
      
      await AsyncStorage.setItem(
        `${PAYMENT_METHODS_KEY}_${userId}`,
        JSON.stringify(updatedMethods)
      );
      
      console.log('[PaymentService] Payment method added:', newMethod.id);
      return newMethod;
    } catch (error) {
      console.error('[PaymentService] Error adding payment method:', error);
      throw error;
    }
  }

  async updatePaymentMethod(
    userId: string,
    methodId: string,
    updates: Partial<PaymentMethod>
  ): Promise<void> {
    try {
      const methods = await this.getPaymentMethods(userId);
      
      if (updates.isDefault) {
        methods.forEach(m => m.isDefault = false);
      }
      
      const updatedMethods = methods.map(method =>
        method.id === methodId ? { ...method, ...updates } : method
      );
      
      await AsyncStorage.setItem(
        `${PAYMENT_METHODS_KEY}_${userId}`,
        JSON.stringify(updatedMethods)
      );
      
      console.log('[PaymentService] Payment method updated:', methodId);
    } catch (error) {
      console.error('[PaymentService] Error updating payment method:', error);
      throw error;
    }
  }

  async deletePaymentMethod(userId: string, methodId: string): Promise<void> {
    try {
      const methods = await this.getPaymentMethods(userId);
      
      const methodToDelete = methods.find(m => m.id === methodId);
      if (methodToDelete?.isDefault && methods.length > 1) {
        throw new Error('No puedes eliminar el método de pago predeterminado. Primero establece otro como predeterminado.');
      }
      
      const updatedMethods = methods.filter(method => method.id !== methodId);
      
      await AsyncStorage.setItem(
        `${PAYMENT_METHODS_KEY}_${userId}`,
        JSON.stringify(updatedMethods)
      );
      
      console.log('[PaymentService] Payment method deleted:', methodId);
    } catch (error) {
      console.error('[PaymentService] Error deleting payment method:', error);
      throw error;
    }
  }

  async setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
    try {
      const methods = await this.getPaymentMethods(userId);
      
      const updatedMethods = methods.map(method => ({
        ...method,
        isDefault: method.id === methodId,
      }));
      
      await AsyncStorage.setItem(
        `${PAYMENT_METHODS_KEY}_${userId}`,
        JSON.stringify(updatedMethods)
      );
      
      console.log('[PaymentService] Default payment method set:', methodId);
    } catch (error) {
      console.error('[PaymentService] Error setting default payment method:', error);
      throw error;
    }
  }

  async getDefaultPaymentMethod(userId: string): Promise<PaymentMethod | null> {
    try {
      const methods = await this.getPaymentMethods(userId);
      return methods.find(method => method.isDefault) || methods[0] || null;
    } catch (error) {
      console.error('[PaymentService] Error getting default payment method:', error);
      return null;
    }
  }

  getPaymentMethodIcon(type: PaymentMethodType): string {
    switch (type) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'sinpe':
        return '📱';
      case 'wallet':
        return '👛';
      default:
        return '💰';
    }
  }

  getPaymentMethodLabel(type: PaymentMethodType): string {
    switch (type) {
      case 'cash':
        return 'Efectivo';
      case 'card':
        return 'Tarjeta';
      case 'sinpe':
        return 'SINPE Móvil';
      case 'wallet':
        return 'Billetera Digital';
      default:
        return 'Otro';
    }
  }

  maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 4) return cardNumber;
    return `•••• ${cardNumber.slice(-4)}`;
  }

  maskSinpePhone(phone: string): string {
    if (!phone || phone.length < 4) return phone;
    return `•••• ${phone.slice(-4)}`;
  }
}

export const paymentService = new PaymentService();
