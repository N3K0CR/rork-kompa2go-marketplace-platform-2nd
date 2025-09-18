// ============================================================================
// ERROR RECOVERY UTILITIES
// ============================================================================
// Sistema robusto de recuperación de errores para evitar interrupciones

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ErrorContext {
  component: string;
  operation: string;
  timestamp: Date;
  platform: string;
  userAgent?: string;
  additionalData?: Record<string, any>;
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'skip' | 'reset';
  description: string;
  execute: () => Promise<any>;
}

export interface ErrorRecoveryConfig {
  maxRetries: number;
  retryDelay: number;
  enableFallbacks: boolean;
  logErrors: boolean;
  persistErrors: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: ErrorRecoveryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  enableFallbacks: true,
  logErrors: true,
  persistErrors: false,
};

const ERROR_STORAGE_KEY = '@kommute_error_recovery';

// ============================================================================
// ERROR RECOVERY CLASS
// ============================================================================

export class ErrorRecoveryManager {
  private config: ErrorRecoveryConfig;
  private errorHistory: Array<{ error: Error; context: ErrorContext; timestamp: Date }> = [];
  private recoveryStrategies: Map<string, RecoveryAction[]> = new Map();

  constructor(config: Partial<ErrorRecoveryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeRecoveryStrategies();
  }

  // ============================================================================
  // MAIN ERROR HANDLING
  // ============================================================================

  async handleError<T>(
    error: Error,
    context: Partial<ErrorContext>,
    fallbackValue?: T
  ): Promise<T | null> {
    const fullContext: ErrorContext = {
      component: 'unknown',
      operation: 'unknown',
      timestamp: new Date(),
      platform: Platform.OS,
      userAgent: Platform.OS === 'web' ? navigator.userAgent : undefined,
      ...context,
    };

    // Log error
    if (this.config.logErrors) {
      console.error(`[ErrorRecovery] ${fullContext.component}:${fullContext.operation}`, {
        error: error.message,
        stack: error.stack,
        context: fullContext,
      });
    }

    // Store error in history
    this.errorHistory.push({ error, context: fullContext, timestamp: new Date() });

    // Persist error if configured
    if (this.config.persistErrors) {
      await this.persistError(error, fullContext);
    }

    // Try recovery strategies
    const recoveryKey = `${fullContext.component}:${fullContext.operation}`;
    const strategies = this.recoveryStrategies.get(recoveryKey) || this.getDefaultStrategies();

    for (const strategy of strategies) {
      try {
        console.log(`[ErrorRecovery] Attempting ${strategy.type}: ${strategy.description}`);
        const result = await strategy.execute();
        console.log(`[ErrorRecovery] Recovery successful with ${strategy.type}`);
        return result;
      } catch (recoveryError) {
        console.warn(`[ErrorRecovery] Strategy ${strategy.type} failed:`, recoveryError);
        continue;
      }
    }

    // All recovery strategies failed, return fallback
    console.warn(`[ErrorRecovery] All recovery strategies failed, using fallback`);
    return fallbackValue || null;
  }

  // ============================================================================
  // RETRY MECHANISM
  // ============================================================================

  async withRetry<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext>,
    maxRetries?: number
  ): Promise<T | null> {
    const retries = maxRetries || this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retries) {
          // Last attempt failed, handle error
          return await this.handleError(lastError, {
            ...context,
            operation: `${context.operation}_retry_${attempt}`,
          });
        }

        // Wait before retry
        const delay = this.config.retryDelay * attempt;
        console.log(`[ErrorRecovery] Retry ${attempt}/${retries} in ${delay}ms`);
        await this.sleep(delay);
      }
    }

    return null;
  }

  // ============================================================================
  // NETWORK ERROR HANDLING
  // ============================================================================

  async handleNetworkError<T>(
    error: Error,
    context: Partial<ErrorContext>,
    retryOperation?: () => Promise<T>
  ): Promise<T | null> {
    const isNetworkError = this.isNetworkError(error);
    
    if (isNetworkError && retryOperation) {
      console.log('[ErrorRecovery] Network error detected, attempting retry with backoff');
      
      // Exponential backoff for network errors
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        try {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(delay);
          
          return await retryOperation();
        } catch (retryError) {
          if (attempt === this.config.maxRetries) {
            return await this.handleError(retryError as Error, {
              ...context,
              operation: `${context.operation}_network_retry`,
            });
          }
        }
      }
    }

    return await this.handleError(error, context);
  }

  // ============================================================================
  // STORAGE ERROR HANDLING
  // ============================================================================

  async handleStorageError<T>(
    error: Error,
    context: Partial<ErrorContext>,
    fallbackData?: T
  ): Promise<T | null> {
    console.warn('[ErrorRecovery] Storage error detected:', error.message);
    
    // Try to clear corrupted storage
    try {
      const storageKey = context.additionalData?.storageKey;
      if (storageKey && typeof storageKey === 'string') {
        await AsyncStorage.removeItem(storageKey);
        console.log(`[ErrorRecovery] Cleared potentially corrupted storage: ${storageKey}`);
      }
    } catch (clearError) {
      console.warn('[ErrorRecovery] Failed to clear storage:', clearError);
    }

    return await this.handleError(error, context, fallbackData);
  }

  // ============================================================================
  // CONTEXT ERROR HANDLING
  // ============================================================================

  async handleContextError<T>(
    error: Error,
    context: Partial<ErrorContext>,
    resetContext?: () => void
  ): Promise<T | null> {
    console.warn('[ErrorRecovery] Context error detected:', error.message);
    
    // Try to reset context
    if (resetContext) {
      try {
        resetContext();
        console.log('[ErrorRecovery] Context reset successfully');
      } catch (resetError) {
        console.warn('[ErrorRecovery] Failed to reset context:', resetError);
      }
    }

    return await this.handleError(error, context);
  }

  // ============================================================================
  // RECOVERY STRATEGIES
  // ============================================================================

  private initializeRecoveryStrategies() {
    // Context initialization errors
    this.recoveryStrategies.set('CommuteContext:initialization', [
      {
        type: 'retry',
        description: 'Retry initialization with clean state',
        execute: async () => {
          await AsyncStorage.multiRemove(['@kommute_data', '@kommute_feature_flags']);
          return { initialized: true, cleanState: true };
        },
      },
      {
        type: 'fallback',
        description: 'Initialize with default values',
        execute: async () => {
          return {
            initialized: true,
            routes: [],
            trips: [],
            featureFlags: { KOMMUTE_ENABLED: false },
          };
        },
      },
    ]);

    // Location permission errors
    this.recoveryStrategies.set('CommuteContext:location', [
      {
        type: 'fallback',
        description: 'Continue without location services',
        execute: async () => {
          return {
            hasLocationPermission: false,
            currentLocation: null,
            message: 'Location services unavailable',
          };
        },
      },
    ]);

    // Storage errors
    this.recoveryStrategies.set('CommuteContext:storage', [
      {
        type: 'retry',
        description: 'Clear and retry storage operation',
        execute: async () => {
          // This would be customized per operation
          return { success: true, cleared: true };
        },
      },
      {
        type: 'fallback',
        description: 'Use in-memory storage',
        execute: async () => {
          return { success: true, inMemory: true };
        },
      },
    ]);

    // Network/tRPC errors
    this.recoveryStrategies.set('tRPC:request', [
      {
        type: 'retry',
        description: 'Retry with exponential backoff',
        execute: async () => {
          // This would retry the original request
          throw new Error('Retry not implemented for this context');
        },
      },
      {
        type: 'fallback',
        description: 'Use cached data',
        execute: async () => {
          return { success: false, cached: true, data: null };
        },
      },
    ]);
  }

  private getDefaultStrategies(): RecoveryAction[] {
    return [
      {
        type: 'fallback',
        description: 'Return safe default value',
        execute: async () => null,
      },
    ];
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private isNetworkError(error: Error): boolean {
    const networkErrorMessages = [
      'network request failed',
      'fetch failed',
      'connection lost',
      'timeout',
      'network error',
      'no internet',
      'connection refused',
    ];

    return networkErrorMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }

  private async persistError(error: Error, context: ErrorContext): Promise<void> {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      };

      const existingErrors = await AsyncStorage.getItem(ERROR_STORAGE_KEY);
      const errors = existingErrors ? JSON.parse(existingErrors) : [];
      
      errors.push(errorData);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }

      await AsyncStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));
    } catch (persistError) {
      console.warn('[ErrorRecovery] Failed to persist error:', persistError);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getErrorHistory() {
    return this.errorHistory;
  }

  async getPersistedErrors() {
    try {
      const errors = await AsyncStorage.getItem(ERROR_STORAGE_KEY);
      return errors ? JSON.parse(errors) : [];
    } catch (error) {
      console.warn('[ErrorRecovery] Failed to get persisted errors:', error);
      return [];
    }
  }

  async clearErrorHistory() {
    this.errorHistory = [];
    try {
      await AsyncStorage.removeItem(ERROR_STORAGE_KEY);
    } catch (error) {
      console.warn('[ErrorRecovery] Failed to clear persisted errors:', error);
    }
  }

  addRecoveryStrategy(key: string, strategies: RecoveryAction[]) {
    this.recoveryStrategies.set(key, strategies);
  }
}

// ============================================================================
// GLOBAL ERROR RECOVERY INSTANCE
// ============================================================================

export const globalErrorRecovery = new ErrorRecoveryManager({
  maxRetries: 3,
  retryDelay: 1000,
  enableFallbacks: true,
  logErrors: true,
  persistErrors: false, // Disabled by default to avoid storage issues
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const withErrorRecovery = async <T>(
  operation: () => Promise<T>,
  context: Partial<ErrorContext>,
  fallbackValue?: T
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    return await globalErrorRecovery.handleError(
      error as Error,
      context,
      fallbackValue
    );
  }
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  context: Partial<ErrorContext>,
  maxRetries?: number
): Promise<T | null> => {
  return await globalErrorRecovery.withRetry(operation, context, maxRetries);
};

export const handleNetworkError = async <T>(
  error: Error,
  context: Partial<ErrorContext>,
  retryOperation?: () => Promise<T>
): Promise<T | null> => {
  return await globalErrorRecovery.handleNetworkError(error, context, retryOperation);
};

export const handleStorageError = async <T>(
  error: Error,
  context: Partial<ErrorContext>,
  fallbackData?: T
): Promise<T | null> => {
  return await globalErrorRecovery.handleStorageError(error, context, fallbackData);
};

export const handleContextError = async <T>(
  error: Error,
  context: Partial<ErrorContext>,
  resetContext?: () => void
): Promise<T | null> => {
  return await globalErrorRecovery.handleContextError(error, context, resetContext);
};

// ============================================================================
// ERROR BOUNDARY HELPERS
// ============================================================================

export const createErrorBoundaryFallback = (componentName: string) => {
  return (error: Error, errorInfo: any) => {
    globalErrorRecovery.handleError(error, {
      component: componentName,
      operation: 'render',
      additionalData: errorInfo,
    });

    // Return a safe fallback component
    return null;
  };
};

// ============================================================================
// REACT HOOK FOR ERROR RECOVERY
// ============================================================================

export const useErrorRecovery = () => {
  const handleError = async <T>(
    error: Error,
    context: Partial<ErrorContext>,
    fallbackValue?: T
  ): Promise<T | null> => {
    return await globalErrorRecovery.handleError(error, context, fallbackValue);
  };

  const withRetryHook = async <T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext>,
    maxRetries?: number
  ): Promise<T | null> => {
    return await globalErrorRecovery.withRetry(operation, context, maxRetries);
  };

  return {
    handleError,
    withRetry: withRetryHook,
    getErrorHistory: () => globalErrorRecovery.getErrorHistory(),
    clearErrorHistory: () => globalErrorRecovery.clearErrorHistory(),
  };
};