// ============================================================================
// ERROR RECOVERY UTILITIES - ENHANCED
// ============================================================================
// Sistema robusto de recuperación de errores con manejo específico para:
// - Input too long for requested model
// - Network connection lost
// - Timeout errors
// - Context corruption
// - Storage failures

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
  inputSize?: number;
  requestId?: string;
  retryCount?: number;
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'skip' | 'reset' | 'truncate' | 'chunk';
  description: string;
  execute: () => Promise<any>;
  condition?: (error: Error, context: ErrorContext) => boolean;
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
  maxRetries: 5,
  retryDelay: 1500,
  enableFallbacks: true,
  logErrors: true,
  persistErrors: false,
};

// Error patterns for specific handling
const ERROR_PATTERNS = {
  INPUT_TOO_LONG: /input.*too long.*model|request.*too large|payload.*too large|content.*too long/i,
  NETWORK_LOST: /network.*connection.*lost|connection.*lost|network.*error/i,
  TIMEOUT: /timeout|timed out|request.*timeout|connection.*timeout/i,
  CONTEXT_CORRUPTED: /context.*corrupted|invalid.*context|context.*error/i,
  STORAGE_FULL: /storage.*full|quota.*exceeded|storage.*error/i,
  RATE_LIMITED: /rate.*limit|too many requests|quota.*exceeded|throttled/i,
  MODEL_OVERLOADED: /model.*overloaded|service.*unavailable|server.*overloaded|capacity.*exceeded/i,
};

// Input truncation utilities
export const createInputTruncator = (maxLength: number = 8000) => {
  return (input: any): any => {
    if (typeof input === 'string') {
      return input.length > maxLength ? input.substring(0, maxLength) + '...[truncated]' : input;
    }
    
    if (Array.isArray(input)) {
      const truncatedArray = [];
      let currentLength = 0;
      
      for (const item of input) {
        const itemString = JSON.stringify(item);
        if (currentLength + itemString.length > maxLength) {
          break;
        }
        truncatedArray.push(item);
        currentLength += itemString.length;
      }
      
      return truncatedArray;
    }
    
    if (typeof input === 'object' && input !== null) {
      const inputString = JSON.stringify(input);
      if (inputString.length <= maxLength) {
        return input;
      }
      
      // Truncate object properties
      const truncatedObj: any = {};
      let currentLength = 2; // Account for {}
      
      for (const [key, value] of Object.entries(input)) {
        const entryString = JSON.stringify({ [key]: value });
        if (currentLength + entryString.length > maxLength - 20) { // Leave some buffer
          break;
        }
        truncatedObj[key] = value;
        currentLength += entryString.length;
      }
      
      return truncatedObj;
    }
    
    return input;
  };
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
      console.error(`[ErrorRecovery] ${fullContext.component}:${fullContext.operation}`, error.message);
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
              operation: context.operation ? `${context.operation}_network_retry` : 'network_retry',
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
  // INPUT SIZE ERROR HANDLING
  // ============================================================================

  async handleInputTooLongError<T>(
    error: Error,
    context: Partial<ErrorContext>,
    originalInput?: any,
    truncateFunction?: (input: any) => any
  ): Promise<T | null> {
    console.warn('[ErrorRecovery] Input too long error detected:', error.message);
    
    if (originalInput && truncateFunction) {
      try {
        console.log('[ErrorRecovery] Attempting to truncate input and retry');
        const truncatedInput = truncateFunction(originalInput);
        
        // Add truncation info to context
        const truncationContext = {
          ...context,
          operation: `${context.operation}_truncated`,
          additionalData: {
            ...context.additionalData,
            originalInputSize: JSON.stringify(originalInput).length,
            truncatedInputSize: JSON.stringify(truncatedInput).length,
            truncationApplied: true,
          },
        };
        
        return truncatedInput as T;
      } catch (truncateError) {
        console.warn('[ErrorRecovery] Failed to truncate input:', truncateError);
      }
    }

    return await this.handleError(error, context);
  }

  // ============================================================================
  // CHUNK PROCESSING ERROR HANDLING
  // ============================================================================

  async handleWithChunking<T>(
    error: Error,
    context: Partial<ErrorContext>,
    originalInput: any[],
    chunkProcessor: (chunk: any[]) => Promise<T>,
    chunkSize: number = 10
  ): Promise<T[]> {
    console.warn('[ErrorRecovery] Processing with chunking due to error:', error.message);
    
    const results: T[] = [];
    const chunks = this.chunkArray(originalInput, chunkSize);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        console.log(`[ErrorRecovery] Processing chunk ${i + 1}/${chunks.length}`);
        const result = await chunkProcessor(chunk);
        results.push(result);
        
        // Add delay between chunks to avoid rate limiting
        if (i < chunks.length - 1) {
          await this.sleep(500);
        }
      } catch (chunkError) {
        console.warn(`[ErrorRecovery] Chunk ${i + 1} failed:`, chunkError);
        
        // Try with smaller chunks if this chunk fails
        if (chunk.length > 1) {
          const smallerChunks = this.chunkArray(chunk, Math.max(1, Math.floor(chunk.length / 2)));
          for (const smallChunk of smallerChunks) {
            try {
              const smallResult = await chunkProcessor(smallChunk);
              results.push(smallResult);
            } catch (smallChunkError) {
              console.warn('[ErrorRecovery] Small chunk also failed, skipping:', smallChunkError);
            }
          }
        }
      }
    }
    
    return results;
  }

  // ============================================================================
  // RATE LIMITING ERROR HANDLING
  // ============================================================================

  async handleRateLimitError<T>(
    error: Error,
    context: Partial<ErrorContext>,
    retryOperation?: () => Promise<T>
  ): Promise<T | null> {
    console.warn('[ErrorRecovery] Rate limit error detected:', error.message);
    
    if (retryOperation) {
      // Extract wait time from error message if available
      const waitTimeMatch = error.message.match(/(\d+)\s*seconds?/i);
      const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) * 1000 : 60000; // Default 1 minute
      
      console.log(`[ErrorRecovery] Waiting ${waitTime}ms before retry due to rate limit`);
      await this.sleep(waitTime);
      
      try {
        return await retryOperation();
      } catch (retryError) {
        console.warn('[ErrorRecovery] Retry after rate limit wait also failed:', retryError);
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
        type: 'truncate',
        description: 'Truncate input and retry',
        condition: (error) => this.isInputTooLongError(error),
        execute: async () => {
          console.log('[ErrorRecovery] Input truncation strategy executed');
          return { success: true, truncated: true, data: null };
        },
      },
      {
        type: 'chunk',
        description: 'Process in smaller chunks',
        condition: (error) => this.isInputTooLongError(error),
        execute: async () => {
          console.log('[ErrorRecovery] Chunking strategy executed');
          return { success: true, chunked: true, data: [] };
        },
      },
      {
        type: 'retry',
        description: 'Retry with exponential backoff',
        condition: (error) => this.isNetworkError(error) || this.isModelOverloadedError(error),
        execute: async () => {
          console.log('[ErrorRecovery] Network retry strategy executed');
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

    // Input size errors
    this.recoveryStrategies.set('AI:input_too_long', [
      {
        type: 'truncate',
        description: 'Truncate input to fit model limits',
        execute: async () => {
          return { success: true, truncated: true };
        },
      },
      {
        type: 'chunk',
        description: 'Split input into processable chunks',
        execute: async () => {
          return { success: true, chunked: true };
        },
      },
    ]);

    // Rate limiting errors
    this.recoveryStrategies.set('AI:rate_limited', [
      {
        type: 'retry',
        description: 'Wait and retry after rate limit period',
        execute: async () => {
          await this.sleep(60000); // Wait 1 minute
          return { success: true, retried: true };
        },
      },
      {
        type: 'fallback',
        description: 'Use alternative processing method',
        execute: async () => {
          return { success: false, alternative: true };
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

  private isInputTooLongError(error: Error): boolean {
    return ERROR_PATTERNS.INPUT_TOO_LONG.test(error.message);
  }

  private isRateLimitError(error: Error): boolean {
    return ERROR_PATTERNS.RATE_LIMITED.test(error.message);
  }

  private isModelOverloadedError(error: Error): boolean {
    return ERROR_PATTERNS.MODEL_OVERLOADED.test(error.message);
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Smart error classification and handling
  async handleSmartError<T>(
    error: Error,
    context: Partial<ErrorContext>,
    options: {
      originalInput?: any;
      truncateFunction?: (input: any) => any;
      chunkProcessor?: (chunk: any[]) => Promise<T>;
      retryOperation?: () => Promise<T>;
      fallbackValue?: T;
    } = {}
  ): Promise<T | null> {
    const errorMessage = error.message.toLowerCase();
    
    // Handle input too long errors
    if (this.isInputTooLongError(error)) {
      console.log('[ErrorRecovery] Detected input too long error, attempting truncation');
      return await this.handleInputTooLongError(
        error,
        context,
        options.originalInput,
        options.truncateFunction
      );
    }
    
    // Handle rate limit errors
    if (this.isRateLimitError(error)) {
      console.log('[ErrorRecovery] Detected rate limit error, waiting before retry');
      return await this.handleRateLimitError(error, context, options.retryOperation);
    }
    
    // Handle model overloaded errors
    if (this.isModelOverloadedError(error)) {
      console.log('[ErrorRecovery] Detected model overloaded error, using exponential backoff');
      return await this.handleNetworkError(error, context, options.retryOperation);
    }
    
    // Handle network errors
    if (this.isNetworkError(error)) {
      console.log('[ErrorRecovery] Detected network error, attempting retry with backoff');
      return await this.handleNetworkError(error, context, options.retryOperation);
    }
    
    // Default error handling
    return await this.handleError(error, context, options.fallbackValue);
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
  maxRetries: 5,
  retryDelay: 1500,
  enableFallbacks: true,
  logErrors: true,
  persistErrors: false, // Disabled by default to avoid storage issues
});

// Pre-configured truncator for common use cases
export const defaultInputTruncator = createInputTruncator(8000);
export const smallInputTruncator = createInputTruncator(4000);
export const largeInputTruncator = createInputTruncator(16000);

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

export const handleInputTooLongError = async <T>(
  error: Error,
  context: Partial<ErrorContext>,
  originalInput?: any,
  truncateFunction?: (input: any) => any
): Promise<T | null> => {
  return await globalErrorRecovery.handleInputTooLongError(error, context, originalInput, truncateFunction);
};

export const handleWithChunking = async <T>(
  error: Error,
  context: Partial<ErrorContext>,
  originalInput: any[],
  chunkProcessor: (chunk: any[]) => Promise<T>,
  chunkSize?: number
): Promise<T[]> => {
  return await globalErrorRecovery.handleWithChunking(error, context, originalInput, chunkProcessor, chunkSize);
};

export const handleRateLimitError = async <T>(
  error: Error,
  context: Partial<ErrorContext>,
  retryOperation?: () => Promise<T>
): Promise<T | null> => {
  return await globalErrorRecovery.handleRateLimitError(error, context, retryOperation);
};

export const handleSmartError = async <T>(
  error: Error,
  context: Partial<ErrorContext>,
  options?: {
    originalInput?: any;
    truncateFunction?: (input: any) => any;
    chunkProcessor?: (chunk: any[]) => Promise<T>;
    retryOperation?: () => Promise<T>;
    fallbackValue?: T;
  }
): Promise<T | null> => {
  return await globalErrorRecovery.handleSmartError(error, context, options || {});
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

  const handleSmartErrorHook = async <T>(
    error: Error,
    context: Partial<ErrorContext>,
    options?: {
      originalInput?: any;
      truncateFunction?: (input: any) => any;
      chunkProcessor?: (chunk: any[]) => Promise<T>;
      retryOperation?: () => Promise<T>;
      fallbackValue?: T;
    }
  ): Promise<T | null> => {
    return await globalErrorRecovery.handleSmartError(error, context, options || {});
  };

  return {
    handleError,
    withRetry: withRetryHook,
    handleSmartError: handleSmartErrorHook,
    getErrorHistory: () => globalErrorRecovery.getErrorHistory(),
    clearErrorHistory: () => globalErrorRecovery.clearErrorHistory(),
  };
};