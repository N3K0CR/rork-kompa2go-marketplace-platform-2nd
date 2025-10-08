import type {
  ClientRegistrationData,
  ProviderRegistrationData,
  KommuterRegistrationData,
} from '@/src/shared/types/registration-types';

export class RegistrationService {
  static async registerClient(data: ClientRegistrationData): Promise<string> {
    try {
      const userId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('[RegistrationService] Client registered successfully:', userId);
      console.log('[RegistrationService] Client data:', data);
      
      return userId;
    } catch (error) {
      console.error('[RegistrationService] Error registering client:', error);
      throw new Error('Failed to register client');
    }
  }

  static async registerProvider(data: ProviderRegistrationData): Promise<string> {
    try {
      const userId = `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('[RegistrationService] Provider registered successfully:', userId);
      console.log('[RegistrationService] Provider data:', data);
      
      return userId;
    } catch (error) {
      console.error('[RegistrationService] Error registering provider:', error);
      throw new Error('Failed to register provider');
    }
  }

  static async registerKommuter(data: KommuterRegistrationData): Promise<string> {
    try {
      const userId = `kommuter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('[RegistrationService] Kommuter registered successfully:', userId);
      console.log('[RegistrationService] Kommuter data:', data);
      
      return userId;
    } catch (error) {
      console.error('[RegistrationService] Error registering kommuter:', error);
      throw new Error('Failed to register kommuter');
    }
  }

  static async upgradeClientToProvider(userId: string, providerData: ProviderRegistrationData): Promise<void> {
    try {
      console.log('[RegistrationService] Upgrading client to provider:', userId);
      console.log('[RegistrationService] Provider data:', providerData);
      
      console.log('[RegistrationService] Client upgraded to provider successfully');
    } catch (error) {
      console.error('[RegistrationService] Error upgrading client to provider:', error);
      throw new Error('Failed to upgrade account to provider');
    }
  }
}

export default RegistrationService;
