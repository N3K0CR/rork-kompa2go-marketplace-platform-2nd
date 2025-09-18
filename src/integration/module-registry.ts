// ============================================================================
// INTEGRATION - MODULE REGISTRY
// ============================================================================
// Registry for managing modules and their activation

import { useKommuteEnabled, useKommuteAdmin } from '../modules/commute';

interface ModuleInfo {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  description: string;
  dependencies: string[];
}

/**
 * Registry of all available modules
 */
export const getModuleRegistry = (): ModuleInfo[] => {
  const isKommuteEnabled = useKommuteEnabled();
  
  return [
    {
      id: 'kompa2go',
      name: 'Kompa2Go',
      version: '1.0.0',
      enabled: true,
      description: 'Core marketplace functionality',
      dependencies: [],
    },
    {
      id: '2kommute',
      name: '2Kommute',
      version: '0.1.0',
      enabled: isKommuteEnabled,
      description: 'Advanced transport and commute features',
      dependencies: ['kompa2go'],
    },
  ];
};

/**
 * Hook for managing module activation
 */
export const useModuleManager = () => {
  const { enableKommute, disableKommute, featureFlags } = useKommuteAdmin();
  
  const enableModule = async (moduleId: string) => {
    switch (moduleId) {
      case '2kommute':
        await enableKommute();
        break;
      default:
        console.warn(`Unknown module: ${moduleId}`);
    }
  };
  
  const disableModule = async (moduleId: string) => {
    switch (moduleId) {
      case '2kommute':
        await disableKommute();
        break;
      default:
        console.warn(`Unknown module: ${moduleId}`);
    }
  };
  
  return {
    modules: getModuleRegistry(),
    enableModule,
    disableModule,
    featureFlags,
  };
};

/**
 * Check if a module is enabled
 */
export const isModuleEnabled = (moduleId: string): boolean => {
  const modules = getModuleRegistry();
  const module = modules.find(m => m.id === moduleId);
  return module?.enabled || false;
};

/**
 * Get module dependencies
 */
export const getModuleDependencies = (moduleId: string): string[] => {
  const modules = getModuleRegistry();
  const module = modules.find(m => m.id === moduleId);
  return module?.dependencies || [];
};