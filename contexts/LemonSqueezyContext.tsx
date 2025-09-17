import { useState, useEffect, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';

const contextValue = createContextHook(() => {
  const [isLoading, setIsLoading] = useState(true);
  
  const apiKey = process.env.EXPO_PUBLIC_LEMONSQUEEZY_API_KEY || null;
  const storeId = process.env.EXPO_PUBLIC_LEMONSQUEEZY_STORE_ID || null;
  const environment = (process.env.EXPO_PUBLIC_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';
  
  const isConfigured = !!(apiKey && storeId);
  
  useEffect(() => {
    // Simulate loading time for configuration check
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return useMemo(() => ({
    isLoading,
    isConfigured,
    apiKey,
    storeId,
    environment,
  }), [isLoading, isConfigured, apiKey, storeId, environment]);
});

export const [LemonSqueezyProvider, useLemonSqueezy] = contextValue;