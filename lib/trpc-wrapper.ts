// ============================================================================
// TRPC ERROR RECOVERY WRAPPER
// ============================================================================
// Wrapper robusto para tRPC que maneja errores de red y recuperación automática

import { useState, useEffect, useCallback } from 'react';
import { TRPCError } from '@trpc/server';
import { withErrorRecovery } from '../src/modules/commute/utils/error-recovery';

// ============================================================================
// TYPES
// ============================================================================

interface TRPCCallOptions {
  maxRetries?: number;
  retryDelay?: number;
  enableFallback?: boolean;
  fallbackData?: any;
  context?: {
    component: string;
    operation: string;
  };
}

interface TRPCErrorInfo {
  code: string;
  message: string;
  data?: any;
  cause?: any;
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  const networkErrorCodes = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'CONNECTION_REFUSED',
    'FETCH_ERROR',
    'INTERNAL_SERVER_ERROR',
  ];
  
  const networkErrorMessages = [
    'network request failed',
    'fetch failed',
    'connection lost',
    'timeout',
    'network error',
    'no internet',
    'connection refused',
    'failed to fetch',
  ];
  
  // Check error code
  if (error.code && networkErrorCodes.includes(error.code)) {
    return true;
  }
  
  // Check error message
  const message = error.message?.toLowerCase() || '';
  return networkErrorMessages.some(msg => message.includes(msg));
};

const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  const retryableCodes = [
    'TIMEOUT',
    'INTERNAL_SERVER_ERROR',
    'BAD_GATEWAY',
    'SERVICE_UNAVAILABLE',
    'GATEWAY_TIMEOUT',
  ];
  
  return isNetworkError(error) || 
         (error.code && retryableCodes.includes(error.code)) ||
         (error.status && [500, 502, 503, 504, 408].includes(error.status));
};

// ============================================================================
// TRPC WRAPPER CLASS
// ============================================================================

export class TRPCErrorRecoveryWrapper {
  private defaultOptions: TRPCCallOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    enableFallback: true,
    context: {
      component: 'tRPC',
      operation: 'unknown',
    },
  };

  // ============================================================================
  // QUERY WRAPPER
  // ============================================================================

  async query<T>(
    queryFn: () => Promise<T>,
    options: TRPCCallOptions = {}
  ): Promise<T | null> {
    const opts = { ...this.defaultOptions, ...options };
    
    return await withErrorRecovery(
      async () => {
        return await this.executeWithRetry(queryFn, opts);
      },
      {
        component: opts.context?.component || 'tRPC',
        operation: opts.context?.operation || 'query',
      },
      opts.fallbackData
    );
  }

  // ============================================================================
  // MUTATION WRAPPER
  // ============================================================================

  async mutation<T>(
    mutationFn: () => Promise<T>,
    options: TRPCCallOptions = {}
  ): Promise<T | null> {
    const opts = { ...this.defaultOptions, ...options };
    
    return await withErrorRecovery(
      async () => {
        // Mutations are generally not retried automatically
        // unless explicitly requested
        if (opts.maxRetries && opts.maxRetries > 1) {
          return await this.executeWithRetry(mutationFn, opts);
        } else {
          return await mutationFn();
        }
      },
      {
        component: opts.context?.component || 'tRPC',
        operation: opts.context?.operation || 'mutation',
      },
      opts.fallbackData
    );
  }

  // ============================================================================
  // RETRY MECHANISM
  // ============================================================================

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: TRPCCallOptions
  ): Promise<T> {
    const maxRetries = options.maxRetries || 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        console.log(`[TRPCWrapper] Attempt ${attempt}/${maxRetries} failed:`, {
          error: error instanceof Error ? error.message : String(error),
          isRetryable: isRetryableError(error),
          isNetwork: isNetworkError(error),
        });

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Only retry if error is retryable
        if (!isRetryableError(error)) {
          console.log('[TRPCWrapper] Error is not retryable, stopping retries');
          break;
        }

        // Calculate delay with exponential backoff
        const delay = (options.retryDelay || 1000) * Math.pow(2, attempt - 1);
        const maxDelay = 10000; // 10 seconds max
        const actualDelay = Math.min(delay, maxDelay);
        
        console.log(`[TRPCWrapper] Retrying in ${actualDelay}ms...`);
        await this.sleep(actualDelay);
      }
    }

    // All retries failed, throw the last error
    throw lastError;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private formatError(error: any): TRPCErrorInfo {
    if (error instanceof TRPCError) {
      return {
        code: error.code,
        message: error.message,
        data: (error as any).data,
        cause: error.cause,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        cause: error,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
    };
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

export const trpcWrapper = new TRPCErrorRecoveryWrapper();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const safeQuery = async <T>(
  queryFn: () => Promise<T>,
  options?: TRPCCallOptions
): Promise<T | null> => {
  return await trpcWrapper.query(queryFn, options);
};

export const safeMutation = async <T>(
  mutationFn: () => Promise<T>,
  options?: TRPCCallOptions
): Promise<T | null> => {
  return await trpcWrapper.mutation(mutationFn, options);
};

// ============================================================================
// TRPC HOOKS WITH ERROR RECOVERY
// ============================================================================

export const useSafeQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: TRPCCallOptions & {
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
    staleTime?: number;
  }
) => {
  // This would integrate with React Query for caching and state management
  // For now, we'll provide a simple wrapper
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TRPCErrorInfo | null>(null);

  const executeQuery = useCallback(async () => {
    if (options?.enabled === false) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await safeQuery(queryFn, {
        ...options,
        context: {
          component: 'tRPC',
          operation: queryKey.join('.'),
        },
      });
      
      setData(result);
    } catch (err) {
      const errorInfo = trpcWrapper['formatError'](err);
      setError(errorInfo);
      console.error(`[useSafeQuery] ${queryKey.join('.')} failed:`, errorInfo);
    } finally {
      setIsLoading(false);
    }
  }, [queryKey, queryFn, options]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  return {
    data,
    isLoading,
    error,
    refetch: executeQuery,
  };
};

export const useSafeMutation = <T, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<T>,
  options?: TRPCCallOptions
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TRPCErrorInfo | null>(null);

  const mutate = useCallback(async (variables: TVariables): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await safeMutation(
        () => mutationFn(variables),
        options
      );
      
      return result;
    } catch (err) {
      const errorInfo = trpcWrapper['formatError'](err);
      setError(errorInfo);
      console.error('[useSafeMutation] Mutation failed:', errorInfo);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, options]);

  return {
    mutate,
    isLoading,
    error,
  };
};



// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default trpcWrapper;