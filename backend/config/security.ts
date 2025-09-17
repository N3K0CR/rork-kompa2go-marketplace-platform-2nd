// Configuración de seguridad DDoS
export const SECURITY_CONFIG = {
  // Rate limiting básico
  RATE_LIMIT: {
    WINDOW_MS: 60 * 1000, // 1 minuto
    MAX_REQUESTS: 100, // requests por ventana
    CLEANUP_INTERVAL: 5 * 60 * 1000, // limpiar cada 5 minutos
  },
  
  // Protección contra ataques
  DDOS_PROTECTION: {
    SUSPICIOUS_THRESHOLD: 200, // requests que activan bloqueo
    BLOCK_DURATION: 15 * 60 * 1000, // 15 minutos de bloqueo
    MAX_BLOCK_DURATION: 60 * 60 * 1000, // 1 hora máximo
  },
  
  // Rate limiting estricto para endpoints sensibles
  STRICT_RATE_LIMIT: {
    WINDOW_MS: 60 * 1000,
    MAX_REQUESTS: 10, // muy restrictivo
    ENDPOINTS: [
      '/api/trpc/auth.login',
      '/api/trpc/auth.register',
      '/api/trpc/payments.process',
      '/api/trpc/user.updateProfile',
    ]
  },
  
  // Configuración de headers de seguridad
  SECURITY_HEADERS: {
    ENABLE_CSP: true,
    ENABLE_HSTS: process.env.NODE_ENV === 'production',
    ENABLE_TIMING_PROTECTION: true,
  },
  
  // Whitelist de IPs (opcional)
  IP_WHITELIST: [] as string[],
  
  // Configuración de logging
  LOGGING: {
    LOG_BLOCKED_IPS: true,
    LOG_RATE_LIMITS: true,
    LOG_SUSPICIOUS_ACTIVITY: true,
  }
} as const;

// Función para verificar si una IP está en whitelist
export function isWhitelistedIP(ip: string): boolean {
  return SECURITY_CONFIG.IP_WHITELIST.includes(ip);
}

// Función para obtener configuración dinámica basada en el entorno
export function getSecurityConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    ...SECURITY_CONFIG,
    // En desarrollo, ser más permisivo
    RATE_LIMIT: {
      ...SECURITY_CONFIG.RATE_LIMIT,
      MAX_REQUESTS: isDevelopment ? 1000 : SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS,
    },
    DDOS_PROTECTION: {
      ...SECURITY_CONFIG.DDOS_PROTECTION,
      SUSPICIOUS_THRESHOLD: isDevelopment ? 2000 : SECURITY_CONFIG.DDOS_PROTECTION.SUSPICIOUS_THRESHOLD,
    }
  };
}