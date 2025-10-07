import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from './AuthContext';
import { Platform } from 'react-native';
import { FirestoreProviderService } from '@/src/modules/provider/services/firestore-provider-service';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  isActive: boolean;
}

export interface GalleryMedia {
  id: string;
  uri: string;
  description: string;
  type: 'image' | 'video';
  fileName?: string;
  size?: number;
}

export interface BusinessBranding {
  logo?: string;
  logoFileName?: string;
  logoSize?: number;
  hasCustomLogo: boolean;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface BusinessHours {
  monday: { isOpen: boolean; openTime: string; closeTime: string; };
  tuesday: { isOpen: boolean; openTime: string; closeTime: string; };
  wednesday: { isOpen: boolean; openTime: string; closeTime: string; };
  thursday: { isOpen: boolean; openTime: string; closeTime: string; };
  friday: { isOpen: boolean; openTime: string; closeTime: string; };
  saturday: { isOpen: boolean; openTime: string; closeTime: string; };
  sunday: { isOpen: boolean; openTime: string; closeTime: string; };
}

export interface ServiceArea {
  id: string;
  name: string;
  isActive: boolean;
}

export interface ProviderProfile {
  bio: string;
  experience: string;
  certifications: string[];
  languages: string[];
  rating: number;
  totalReviews: number;
}

export interface SupportTicket {
  id: string;
  type: 'price_change' | 'block_service';
  serviceId?: string;
  serviceName?: string;
  newPriceListUrl?: string;
  justification?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface ProviderData {
  businessName: string;
  services: Service[];
  gallery: GalleryMedia[];
  maxGallerySize: number;
  supportTickets: SupportTicket[];
  businessBranding: BusinessBranding;
  contactInfo: ContactInfo;
  businessHours: BusinessHours;
  serviceAreas: ServiceArea[];
  profile: ProviderProfile;
  isAmbulante: boolean;
  lastSyncTimestamp?: number;
  version?: number;
}

interface SyncOperation {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

interface ProviderContextState {
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  pendingOperations: number;
  lastBackup?: number;
}

const STORAGE_KEY = 'provider_data';
const BACKUP_STORAGE_KEY = 'provider_data_backup';
const SYNC_QUEUE_KEY = 'provider_sync_queue';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;
const BACKUP_INTERVAL = 30000; // 30 seconds

const defaultBusinessHours: BusinessHours = {
  monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
  tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
  wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
  thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
  friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
  saturday: { isOpen: true, openTime: '10:00', closeTime: '15:00' },
  sunday: { isOpen: false, openTime: '10:00', closeTime: '15:00' }
};

const defaultProviderData: ProviderData = {
  businessName: 'Mi Negocio',
  services: [
    {
      id: '1',
      name: 'Limpieza General',
      price: 15000,
      duration: 120,
      description: 'Limpieza completa de espacios residenciales',
      isActive: true
    },
    {
      id: '2',
      name: 'Limpieza Profunda',
      price: 25000,
      duration: 180,
      description: 'Limpieza detallada incluyendo áreas difíciles',
      isActive: true
    },
    {
      id: '3',
      name: 'Organización',
      price: 12000,
      duration: 90,
      description: 'Organización y ordenamiento de espacios',
      isActive: false
    }
  ],
  gallery: [
    {
      id: '1',
      uri: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=200&fit=crop',
      description: 'Limpieza de cocina',
      type: 'image'
    },
    {
      id: '2',
      uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
      description: 'Organización de closet',
      type: 'image'
    },
    {
      id: '3',
      uri: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300&h=200&fit=crop',
      description: 'Limpieza de baño',
      type: 'image'
    },
    {
      id: '4',
      uri: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      description: 'Video de trabajo completado',
      type: 'video'
    }
  ],
  maxGallerySize: 10,
  supportTickets: [],
  businessBranding: {
    hasCustomLogo: false
  },
  contactInfo: {
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  },
  businessHours: defaultBusinessHours,
  serviceAreas: [
    { id: '1', name: 'Centro', isActive: true },
    { id: '2', name: 'Norte', isActive: true },
    { id: '3', name: 'Sur', isActive: false }
  ],
  profile: {
    bio: '',
    experience: '',
    certifications: [],
    languages: ['Español'],
    rating: 0,
    totalReviews: 0
  },
  isAmbulante: false
};

export const [ProviderProvider, useProvider] = createContextHook(() => {
  const { user } = useAuth();
  const [providerData, setProviderData] = useState<ProviderData>(defaultProviderData);
  const [isLoading, setIsLoading] = useState(true);
  const [contextState, setContextState] = useState<ProviderContextState>({
    isOnline: true,
    syncStatus: 'idle',
    pendingOperations: 0
  });
  const [syncQueue, setSyncQueue] = useState<SyncOperation[]>([]);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);

  // Enhanced storage operations with retry and backup
  const saveToStorageWithRetry = useCallback(async (data: ProviderData, retryCount = 0): Promise<boolean> => {
    try {
      if (user?.userType === 'provider' && user.id) {
        const storageKey = `${STORAGE_KEY}_${user.id}`;
        const dataWithMetadata = {
          ...data,
          lastSyncTimestamp: Date.now(),
          version: (data.version || 0) + 1
        };
        
        await AsyncStorage.setItem(storageKey, JSON.stringify(dataWithMetadata));
        console.log('Provider data saved to storage successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error saving provider data (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return saveToStorageWithRetry(data, retryCount + 1);
      }
      
      // If all retries failed, try to save to backup location
      try {
        const backupKey = `${BACKUP_STORAGE_KEY}_${user?.id}`;
        await AsyncStorage.setItem(backupKey, JSON.stringify(data));
        console.log('Data saved to backup storage');
        return true;
      } catch (backupError) {
        console.error('Failed to save to backup storage:', backupError);
        return false;
      }
    }
  }, [user]);

  const saveToStorage = useCallback(async (data: ProviderData) => {
    const success = await saveToStorageWithRetry(data);
    if (!success) {
      setContextState(prev => ({ ...prev, syncStatus: 'error' }));
    }
  }, [saveToStorageWithRetry]);

  const loadProviderData = useCallback(async () => {
    try {
      setIsLoading(true);
      setContextState(prev => ({ ...prev, syncStatus: 'syncing' }));
      
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      // Try to load from Firestore first
      try {
        console.log('🔄 Loading provider data from Firestore...');
        const firestoreData = await FirestoreProviderService.getProviderData(user.id);
        
        if (firestoreData) {
          console.log('✅ Provider data loaded from Firestore');
          setProviderData(firestoreData);
          await saveToStorage(firestoreData);
          setContextState(prev => ({ 
            ...prev, 
            syncStatus: 'success',
            lastBackup: firestoreData.lastSyncTimestamp 
          }));
          await loadSyncQueue();
          setIsLoading(false);
          return;
        }
      } catch (firestoreError) {
        console.error('⚠️ Error loading from Firestore, falling back to local storage:', firestoreError);
      }
      
      // Fallback to AsyncStorage
      const storageKey = `${STORAGE_KEY}_${user.id}`;
      const backupKey = `${BACKUP_STORAGE_KEY}_${user.id}`;
      
      let storedData = await AsyncStorage.getItem(storageKey);
      let dataSource = 'primary';
      
      if (!storedData) {
        storedData = await AsyncStorage.getItem(backupKey);
        dataSource = 'backup';
      }
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setProviderData(parsedData);
        setContextState(prev => ({ 
          ...prev, 
          syncStatus: 'success',
          lastBackup: parsedData.lastSyncTimestamp 
        }));
        console.log(`Provider data loaded from ${dataSource} storage`);
        
        // Sync to Firestore in background
        try {
          await FirestoreProviderService.createProviderData(user.id, parsedData);
          console.log('✅ Local data synced to Firestore');
        } catch (syncError) {
          console.error('⚠️ Error syncing to Firestore:', syncError);
        }
        
        if (dataSource === 'backup') {
          await saveToStorageWithRetry(parsedData);
        }
      } else {
        // First time user - create default data
        const initialData = {
          ...defaultProviderData,
          businessName: user?.name || 'Mi Negocio',
          lastSyncTimestamp: Date.now(),
          version: 1
        };
        setProviderData(initialData);
        await saveToStorage(initialData);
        
        // Create in Firestore
        try {
          await FirestoreProviderService.createProviderData(user.id, initialData);
          console.log('✅ Initial provider data created in Firestore');
        } catch (createError) {
          console.error('⚠️ Error creating in Firestore:', createError);
        }
        
        setContextState(prev => ({ ...prev, syncStatus: 'success' }));
        console.log('Default provider data set for new user');
      }
      
      await loadSyncQueue();
      
    } catch (error) {
      console.error('Error loading provider data:', error);
      setProviderData(defaultProviderData);
      setContextState(prev => ({ ...prev, syncStatus: 'error' }));
    } finally {
      setIsLoading(false);
    }
  }, [user, saveToStorage, saveToStorageWithRetry]);

  // Sync queue management
  const loadSyncQueue = useCallback(async () => {
    try {
      const queueKey = `${SYNC_QUEUE_KEY}_${user?.id}`;
      const queueData = await AsyncStorage.getItem(queueKey);
      if (queueData) {
        const queue = JSON.parse(queueData);
        setSyncQueue(queue);
        setContextState(prev => ({ ...prev, pendingOperations: queue.length }));
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }, [user]);

  const saveSyncQueue = useCallback(async (queue: SyncOperation[]) => {
    try {
      const queueKey = `${SYNC_QUEUE_KEY}_${user?.id}`;
      await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
      setContextState(prev => ({ ...prev, pendingOperations: queue.length }));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }, [user]);

  const addToSyncQueue = useCallback(async (operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>) => {
    const newOperation: SyncOperation = {
      ...operation,
      id: Date.now().toString(),
      timestamp: Date.now(),
      retryCount: 0
    };
    
    const updatedQueue = [...syncQueue, newOperation];
    setSyncQueue(updatedQueue);
    await saveSyncQueue(updatedQueue);
  }, [syncQueue, saveSyncQueue]);

  const processSyncQueue = useCallback(async () => {
    if (isProcessingRef.current || syncQueue.length === 0) return;
    
    isProcessingRef.current = true;
    setContextState(prev => ({ ...prev, syncStatus: 'syncing' }));
    
    try {
      const processedOperations: string[] = [];
      
      for (const operation of syncQueue) {
        try {
          // Simulate processing operation (in real app, this would sync with server)
          await new Promise(resolve => setTimeout(resolve, 100));
          processedOperations.push(operation.id);
          console.log(`Processed sync operation: ${operation.type}`);
        } catch (error) {
          console.error(`Failed to process operation ${operation.id}:`, error);
          
          // Increment retry count
          const updatedQueue = syncQueue.map(op => 
            op.id === operation.id 
              ? { ...op, retryCount: op.retryCount + 1 }
              : op
          );
          setSyncQueue(updatedQueue);
          await saveSyncQueue(updatedQueue);
        }
      }
      
      // Remove successfully processed operations
      const remainingQueue = syncQueue.filter(op => !processedOperations.includes(op.id));
      setSyncQueue(remainingQueue);
      await saveSyncQueue(remainingQueue);
      
      setContextState(prev => ({ 
        ...prev, 
        syncStatus: remainingQueue.length > 0 ? 'error' : 'success'
      }));
      
    } catch (error) {
      console.error('Error processing sync queue:', error);
      setContextState(prev => ({ ...prev, syncStatus: 'error' }));
    } finally {
      isProcessingRef.current = false;
    }
  }, [syncQueue, saveSyncQueue]);

  // Auto-backup mechanism
  const startAutoBackup = useCallback(() => {
    if (backupIntervalRef.current) {
      clearInterval(backupIntervalRef.current);
    }
    
    backupIntervalRef.current = setInterval(async () => {
      try {
        const backupKey = `${BACKUP_STORAGE_KEY}_${user?.id}`;
        await AsyncStorage.setItem(backupKey, JSON.stringify(providerData));
        setContextState(prev => ({ ...prev, lastBackup: Date.now() }));
        console.log('Auto-backup completed');
      } catch (error) {
        console.error('Auto-backup failed:', error);
      }
    }, BACKUP_INTERVAL);
  }, [user, providerData]);

  // Network status monitoring (web only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => {
        setContextState(prev => ({ ...prev, isOnline: true }));
        processSyncQueue();
      };
      
      const handleOffline = () => {
        setContextState(prev => ({ ...prev, isOnline: false }));
      };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [processSyncQueue]);

  // Load data from AsyncStorage when user changes
  useEffect(() => {
    if (user?.userType === 'provider') {
      loadProviderData();
    } else {
      setIsLoading(false);
    }
    
    return () => {
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [user?.userType, user?.id]);

  // Process sync queue when online
  useEffect(() => {
    if (contextState.isOnline && syncQueue.length > 0) {
      processSyncQueue();
    }
  }, [contextState.isOnline, syncQueue.length, processSyncQueue]);

  // Enhanced update functions with offline support
  const updateBusinessName = useCallback(async (name: string) => {
    if (!name?.trim()) return;
    const sanitizedName = name.trim();
    if (sanitizedName.length > 100) return;
    
    const updatedData = { ...providerData, businessName: sanitizedName };
    setProviderData(updatedData);
    
    try {
      await saveToStorage(updatedData);
      
      if (user?.id) {
        try {
          await FirestoreProviderService.updateBusinessName(user.id, sanitizedName);
          console.log('✅ Business name synced to Firestore');
        } catch (firestoreError) {
          console.error('⚠️ Error syncing to Firestore:', firestoreError);
          await addToSyncQueue({ type: 'updateBusinessName', data: { name: sanitizedName } });
        }
      }
    } catch (error) {
      console.error('Error updating business name:', error);
      await addToSyncQueue({ type: 'updateBusinessName', data: { name: sanitizedName } });
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const addService = useCallback(async (service: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...service,
      id: Date.now().toString()
    };
    const updatedServices = [...providerData.services, newService];
    const updatedData = {
      ...providerData,
      services: updatedServices
    };
    setProviderData(updatedData);
    
    try {
      await saveToStorage(updatedData);
      
      if (user?.id) {
        try {
          await FirestoreProviderService.addService(user.id, newService, providerData.services);
          console.log('✅ Service synced to Firestore');
        } catch (firestoreError) {
          console.error('⚠️ Error syncing to Firestore:', firestoreError);
          await addToSyncQueue({ type: 'addService', data: newService });
        }
      }
    } catch (error) {
      console.error('Error adding service:', error);
      await addToSyncQueue({ type: 'addService', data: newService });
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const updateService = useCallback(async (serviceId: string, updates: Partial<Omit<Service, 'id'>>) => {
    const updatedServices = providerData.services.map(service => 
      service.id === serviceId 
        ? { ...service, ...updates }
        : service
    );
    const updatedData = {
      ...providerData,
      services: updatedServices
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.updateServices(user.id, updatedServices);
        console.log('✅ Service updated in Firestore');
      } catch (error) {
        console.error('⚠️ Error syncing to Firestore:', error);
        await addToSyncQueue({ type: 'updateService', data: { serviceId, updates } });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const toggleServiceStatus = useCallback(async (serviceId: string) => {
    const updatedData = {
      ...providerData,
      services: providerData.services.map(service => 
        service.id === serviceId 
          ? { ...service, isActive: !service.isActive }
          : service
      )
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.toggleServiceStatus(user.id, serviceId, providerData.services);
        console.log('✅ Service status synced to Firestore');
      } catch (error) {
        console.error('❌ Error syncing service status to Firestore:', error);
        await addToSyncQueue({ type: 'toggleServiceStatus', data: { serviceId } });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const removeService = useCallback(async (serviceId: string) => {
    const updatedServices = providerData.services.filter(s => s.id !== serviceId);
    const updatedData = {
      ...providerData,
      services: updatedServices
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.removeService(user.id, serviceId, providerData.services);
        console.log('✅ Service removed from Firestore');
      } catch (error) {
        console.error('⚠️ Error syncing to Firestore:', error);
        await addToSyncQueue({ type: 'removeService', data: { serviceId } });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const addGalleryMedia = useCallback(async (media: Omit<GalleryMedia, 'id'>) => {
    const newMedia: GalleryMedia = {
      ...media,
      id: Date.now().toString()
    };
    const updatedGallery = [...providerData.gallery, newMedia];
    const updatedData = {
      ...providerData,
      gallery: updatedGallery
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.addGalleryMedia(user.id, newMedia, providerData.gallery);
        console.log('✅ Gallery media synced to Firestore');
      } catch (error) {
        console.error('⚠️ Error syncing to Firestore:', error);
        await addToSyncQueue({ type: 'addGalleryMedia', data: newMedia });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const removeGalleryMedia = useCallback(async (mediaId: string) => {
    const updatedGallery = providerData.gallery.filter(item => item.id !== mediaId);
    const updatedData = {
      ...providerData,
      gallery: updatedGallery
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.removeGalleryMedia(user.id, mediaId, providerData.gallery);
        console.log('✅ Gallery media removed from Firestore');
      } catch (error) {
        console.error('⚠️ Error syncing to Firestore:', error);
        await addToSyncQueue({ type: 'removeGalleryMedia', data: { mediaId } });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const addSupportTicket = useCallback(async (ticket: Omit<SupportTicket, 'id' | 'createdAt'>) => {
    const newTicket: SupportTicket = {
      ...ticket,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    const updatedTickets = [...providerData.supportTickets, newTicket];
    const updatedData = {
      ...providerData,
      supportTickets: updatedTickets
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.addSupportTicket(user.id, newTicket, providerData.supportTickets);
        console.log('✅ Support ticket synced to Firestore');
      } catch (error) {
        console.error('⚠️ Error syncing to Firestore:', error);
        await addToSyncQueue({ type: 'addSupportTicket', data: newTicket });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const updateBusinessBranding = useCallback(async (branding: BusinessBranding) => {
    const updatedData = {
      ...providerData,
      businessBranding: branding
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.updateBusinessBranding(user.id, branding);
        console.log('✅ Business branding synced to Firestore');
      } catch (error) {
        console.error('⚠️ Error syncing to Firestore:', error);
        await addToSyncQueue({ type: 'updateBusinessBranding', data: branding });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const updateContactInfo = useCallback(async (contactInfo: ContactInfo) => {
    const updatedData = {
      ...providerData,
      contactInfo
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.updateContactInfo(user.id, contactInfo);
        console.log('✅ Contact info synced to Firestore');
      } catch (error) {
        console.error('⚠️ Error syncing to Firestore:', error);
        await addToSyncQueue({ type: 'updateContactInfo', data: contactInfo });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const updateBusinessHours = useCallback(async (businessHours: BusinessHours) => {
    const updatedData = {
      ...providerData,
      businessHours
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.updateBusinessHours(user.id, businessHours);
        console.log('✅ Business hours synced to Firestore');
      } catch (error) {
        console.error('⚠️ Error syncing to Firestore:', error);
        await addToSyncQueue({ type: 'updateBusinessHours', data: businessHours });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const addServiceArea = useCallback(async (area: Omit<ServiceArea, 'id'>) => {
    const newArea: ServiceArea = {
      ...area,
      id: Date.now().toString()
    };
    const updatedServiceAreas = [...providerData.serviceAreas, newArea];
    const updatedData = {
      ...providerData,
      serviceAreas: updatedServiceAreas
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.updateServiceAreas(user.id, updatedServiceAreas);
        console.log('✅ Service area synced to Firestore');
      } catch (error) {
        console.error('⚠️ Error syncing to Firestore:', error);
        await addToSyncQueue({ type: 'addServiceArea', data: newArea });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const updateServiceArea = useCallback(async (areaId: string, updates: Partial<Omit<ServiceArea, 'id'>>) => {
    const updatedServiceAreas = providerData.serviceAreas.map(area => 
      area.id === areaId 
        ? { ...area, ...updates }
        : area
    );
    const updatedData = {
      ...providerData,
      serviceAreas: updatedServiceAreas
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.updateServiceAreas(user.id, updatedServiceAreas);
        console.log('✅ Service area updated in Firestore');
      } catch (error) {
        console.error('⚠️ Error syncing to Firestore:', error);
        await addToSyncQueue({ type: 'updateServiceArea', data: { areaId, updates } });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const removeServiceArea = useCallback(async (areaId: string) => {
    const updatedServiceAreas = providerData.serviceAreas.filter(area => area.id !== areaId);
    const updatedData = {
      ...providerData,
      serviceAreas: updatedServiceAreas
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.updateServiceAreas(user.id, updatedServiceAreas);
        console.log('✅ Service area removed from Firestore');
      } catch (error) {
        console.error('⚠️ Error syncing to Firestore:', error);
        await addToSyncQueue({ type: 'removeServiceArea', data: { areaId } });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const updateProfile = useCallback(async (profile: ProviderProfile) => {
    const updatedData = {
      ...providerData,
      profile
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.updateProfile(user.id, profile);
        console.log('✅ Profile synced to Firestore');
      } catch (error) {
        console.error('⚠️ Error syncing to Firestore:', error);
        await addToSyncQueue({ type: 'updateProfile', data: profile });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  const updateAmbulanteStatus = useCallback(async (isAmbulante: boolean) => {
    const updatedData = {
      ...providerData,
      isAmbulante
    };
    setProviderData(updatedData);
    await saveToStorage(updatedData);
    
    if (user?.id) {
      try {
        await FirestoreProviderService.updateAmbulanteStatus(user.id, isAmbulante);
        console.log('✅ Ambulante status synced to Firestore');
      } catch (error) {
        console.error('⚠️ Error syncing to Firestore:', error);
        await addToSyncQueue({ type: 'updateAmbulanteStatus', data: { isAmbulante } });
      }
    }
  }, [providerData, saveToStorage, user, addToSyncQueue]);

  // Force sync function for manual retry
  const forceSync = useCallback(async () => {
    setContextState(prev => ({ ...prev, syncStatus: 'syncing' }));
    await processSyncQueue();
    await loadProviderData();
  }, [processSyncQueue, loadProviderData]);

  // Clear all data (for testing/reset)
  const clearAllData = useCallback(async () => {
    try {
      const storageKey = `${STORAGE_KEY}_${user?.id}`;
      const backupKey = `${BACKUP_STORAGE_KEY}_${user?.id}`;
      const queueKey = `${SYNC_QUEUE_KEY}_${user?.id}`;
      
      await Promise.all([
        AsyncStorage.removeItem(storageKey),
        AsyncStorage.removeItem(backupKey),
        AsyncStorage.removeItem(queueKey)
      ]);
      
      setProviderData(defaultProviderData);
      setSyncQueue([]);
      setContextState({
        isOnline: true,
        syncStatus: 'idle',
        pendingOperations: 0
      });
      
      console.log('All provider data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }, [user]);

  return useMemo(() => ({
    // Data
    businessName: providerData.businessName,
    services: providerData.services,
    gallery: providerData.gallery,
    maxGallerySize: providerData.maxGallerySize,
    supportTickets: providerData.supportTickets,
    businessBranding: providerData.businessBranding,
    contactInfo: providerData.contactInfo,
    businessHours: providerData.businessHours,
    serviceAreas: providerData.serviceAreas,
    profile: providerData.profile,
    isAmbulante: providerData.isAmbulante,
    isLoading,
    
    // Context state
    isOnline: contextState.isOnline,
    syncStatus: contextState.syncStatus,
    pendingOperations: contextState.pendingOperations,
    lastBackup: contextState.lastBackup,
    
    // Actions
    updateBusinessName,
    addService,
    updateService,
    toggleServiceStatus,
    removeService,
    addGalleryMedia,
    removeGalleryMedia,
    addSupportTicket,
    updateBusinessBranding,
    updateContactInfo,
    updateBusinessHours,
    addServiceArea,
    updateServiceArea,
    removeServiceArea,
    updateProfile,
    updateAmbulanteStatus,
    
    // Utility
    refreshData: loadProviderData,
    forceSync,
    clearAllData
  }), [
    providerData.businessName,
    providerData.services,
    providerData.gallery,
    providerData.maxGallerySize,
    providerData.supportTickets,
    providerData.businessBranding,
    providerData.contactInfo,
    providerData.businessHours,
    providerData.serviceAreas,
    providerData.profile,
    providerData.isAmbulante,
    isLoading,
    contextState.isOnline,
    contextState.syncStatus,
    contextState.pendingOperations,
    contextState.lastBackup,
    updateBusinessName,
    addService,
    updateService,
    toggleServiceStatus,
    removeService,
    addGalleryMedia,
    removeGalleryMedia,
    addSupportTicket,
    updateBusinessBranding,
    updateContactInfo,
    updateBusinessHours,
    addServiceArea,
    updateServiceArea,
    removeServiceArea,
    updateProfile,
    updateAmbulanteStatus,
    loadProviderData,
    forceSync,
    clearAllData
  ]);
});