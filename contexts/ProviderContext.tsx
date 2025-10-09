import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { providerServiceManager } from '@/src/modules/provider/services/firestore-provider-service';
import type { ProviderService, ServiceModificationRequest, ProviderProfile } from '@/src/shared/types/provider-types';
import { useFirebaseAuth } from './FirebaseAuthContext';

export const [ProviderContext, useProvider] = createContextHook(() => {
  const { firebaseUser } = useFirebaseAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [modificationRequests, setModificationRequests] = useState<ServiceModificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProviderProfile = useCallback(async (providerId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ProviderContext] Loading provider profile:', providerId);
      
      const profileData = await providerServiceManager.getProviderProfile(providerId);
      setProfile(profileData);
      
      console.log('[ProviderContext] Profile loaded successfully');
    } catch (err) {
      console.error('[ProviderContext] Error loading profile:', err);
      setError('Error al cargar el perfil del proveedor');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadServices = useCallback(async (providerId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ProviderContext] Loading services for provider:', providerId);
      
      const servicesData = await providerServiceManager.getProviderServices(providerId);
      setServices(servicesData);
      
      console.log('[ProviderContext] Services loaded:', servicesData.length);
    } catch (err) {
      console.error('[ProviderContext] Error loading services:', err);
      setError('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadModificationRequests = useCallback(async (providerId: string) => {
    try {
      console.log('[ProviderContext] Loading modification requests for provider:', providerId);
      
      const requests = await providerServiceManager.getPriceModificationRequests(providerId);
      setModificationRequests(requests);
      
      console.log('[ProviderContext] Modification requests loaded:', requests.length);
    } catch (err) {
      console.error('[ProviderContext] Error loading modification requests:', err);
    }
  }, []);

  const addService = useCallback(async (
    providerId: string,
    service: Omit<ProviderService, 'id' | 'providerId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ProviderContext] Adding new service');
      
      const serviceId = await providerServiceManager.addService(providerId, service);
      await loadServices(providerId);
      
      console.log('[ProviderContext] Service added successfully:', serviceId);
      return serviceId;
    } catch (err: any) {
      console.error('[ProviderContext] Error adding service:', err);
      setError(err.message || 'Error al agregar el servicio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadServices]);

  const updateService = useCallback(async (serviceId: string, updates: Partial<ProviderService>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ProviderContext] Updating service:', serviceId);
      
      await providerServiceManager.updateService(serviceId, updates);
      
      if (profile) {
        await loadServices(profile.userId);
      }
      
      console.log('[ProviderContext] Service updated successfully');
    } catch (err: any) {
      console.error('[ProviderContext] Error updating service:', err);
      setError(err.message || 'Error al actualizar el servicio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profile, loadServices]);

  const deleteService = useCallback(async (serviceId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ProviderContext] Deleting service:', serviceId);
      
      await providerServiceManager.deleteService(serviceId);
      
      if (profile) {
        await loadServices(profile.userId);
      }
      
      console.log('[ProviderContext] Service deleted successfully');
    } catch (err: any) {
      console.error('[ProviderContext] Error deleting service:', err);
      setError(err.message || 'Error al eliminar el servicio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profile, loadServices]);

  const toggleServiceStatus = useCallback(async (serviceId: string, isActive: boolean): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ProviderContext] Toggling service status:', serviceId, isActive);
      
      await providerServiceManager.toggleServiceStatus(serviceId, isActive);
      
      if (profile) {
        await loadServices(profile.userId);
      }
      
      console.log('[ProviderContext] Service status toggled successfully');
    } catch (err: any) {
      console.error('[ProviderContext] Error toggling service status:', err);
      setError(err.message || 'Error al cambiar el estado del servicio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profile, loadServices]);

  const requestPriceModification = useCallback(async (
    providerId: string,
    serviceId: string,
    serviceName: string,
    oldPrice: number,
    newPrice: number,
    priceUpdateUrl: string
  ): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ProviderContext] Requesting price modification');
      
      const requestId = await providerServiceManager.requestPriceModification(
        providerId,
        serviceId,
        serviceName,
        oldPrice,
        newPrice,
        priceUpdateUrl
      );
      
      await loadModificationRequests(providerId);
      
      console.log('[ProviderContext] Price modification requested successfully:', requestId);
      return requestId;
    } catch (err: any) {
      console.error('[ProviderContext] Error requesting price modification:', err);
      setError(err.message || 'Error al solicitar modificación de precio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadModificationRequests]);

  const uploadServicePhoto = useCallback(async (
    providerId: string,
    serviceId: string,
    photoUri: string
  ): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ProviderContext] Uploading service photo');
      
      const photoUrl = await providerServiceManager.uploadServicePhoto(providerId, serviceId, photoUri);
      
      console.log('[ProviderContext] Photo uploaded successfully');
      return photoUrl;
    } catch (err: any) {
      console.error('[ProviderContext] Error uploading photo:', err);
      setError(err.message || 'Error al subir la foto');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteServicePhoto = useCallback(async (photoUrl: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ProviderContext] Deleting service photo');
      
      await providerServiceManager.deleteServicePhoto(photoUrl);
      
      console.log('[ProviderContext] Photo deleted successfully');
    } catch (err: any) {
      console.error('[ProviderContext] Error deleting photo:', err);
      setError(err.message || 'Error al eliminar la foto');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProviderProfile = useCallback(async (providerId: string, updates: Partial<ProviderProfile>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ProviderContext] Updating provider profile');
      
      await providerServiceManager.updateProviderProfile(providerId, updates);
      await loadProviderProfile(providerId);
      
      console.log('[ProviderContext] Provider profile updated successfully');
    } catch (err: any) {
      console.error('[ProviderContext] Error updating provider profile:', err);
      setError(err.message || 'Error al actualizar el perfil');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadProviderProfile]);

  useEffect(() => {
    if (firebaseUser && firebaseUser.uid) {
      loadProviderProfile(firebaseUser.uid);
      loadServices(firebaseUser.uid);
      loadModificationRequests(firebaseUser.uid);
    }
  }, [firebaseUser, loadProviderProfile, loadServices, loadModificationRequests]);

  return useMemo(() => ({
    profile,
    services,
    modificationRequests,
    loading,
    error,
    loadProviderProfile,
    loadServices,
    loadModificationRequests,
    addService,
    updateService,
    deleteService,
    toggleServiceStatus,
    requestPriceModification,
    uploadServicePhoto,
    deleteServicePhoto,
    updateProviderProfile,
  }), [
    profile,
    services,
    modificationRequests,
    loading,
    error,
    loadProviderProfile,
    loadServices,
    loadModificationRequests,
    addService,
    updateService,
    deleteService,
    toggleServiceStatus,
    requestPriceModification,
    uploadServicePhoto,
    deleteServicePhoto,
    updateProviderProfile,
  ]);
});
