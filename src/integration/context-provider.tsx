// ============================================================================
// INTEGRATION - CONTEXT PROVIDER
// ============================================================================
// Context provider integration for the entire application

import React from 'react';
import { CommuteContext } from '../modules/commute';

interface IntegratedContextProviderProps {
  children: React.ReactNode;
}

/**
 * Integrated context provider that wraps both Kompa2Go and 2Kommute contexts
 */
export const IntegratedContextProvider: React.FC<IntegratedContextProviderProps> = ({ children }) => {
  return (
    <CommuteContext>
      {children}
    </CommuteContext>
  );
};

export default IntegratedContextProvider;