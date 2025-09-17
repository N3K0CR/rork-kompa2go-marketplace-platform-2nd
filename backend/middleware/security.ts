import { Context, Next } from "hono";
import { getSecurityConfig, isWhitelistedIP } from "@/backend/config/security";

// Rate limiting storage en memoria (ligero y rápido)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const config = getSecurityConfig();

// Limpiar entradas expiradas
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now && (!entry.blocked || (entry.blockUntil && entry.blockUntil < now))) {
      rateLimitStore.delete(key);
    }
  }
}, config.RATE_LIMIT.CLEANUP_INTERVAL);

function getClientIP(c: Context): string {
  // Obtener IP real considerando proxies
  const forwarded = c.req.header('x-forwarded-for');
  const realIP = c.req.header('x-real-ip');
  const cfIP = c.req.header('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfIP) {
    return cfIP;
  }
  
  // Fallback para desarrollo
  return c.env?.REMOTE_ADDR || '127.0.0.1';
}

export async function rateLimitMiddleware(c: Context, next: Next) {
  const clientIP = getClientIP(c);
  
  // Verificar whitelist
  if (isWhitelistedIP(clientIP)) {
    return next();
  }
  
  const now = Date.now();
  const key = `rate_limit:${clientIP}`;
  
  let entry = rateLimitStore.get(key);
  
  // Si no existe entrada, crear nueva
  if (!entry) {
    entry = {
      count: 1,
      resetTime: now + config.RATE_LIMIT.WINDOW_MS,
      blocked: false
    };
    rateLimitStore.set(key, entry);
    return next();
  }
  
  // Si está bloqueado, verificar si el bloqueo ha expirado
  if (entry.blocked && entry.blockUntil) {
    if (now < entry.blockUntil) {
      console.log(`🚫 DDoS Protection: IP ${clientIP} blocked until ${new Date(entry.blockUntil).toISOString()}`);
      return c.json({
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((entry.blockUntil - now) / 1000)
      }, 429);
    } else {
      // Bloqueo expirado, resetear
      entry.blocked = false;
      entry.blockUntil = undefined;
      entry.count = 1;
      entry.resetTime = now + config.RATE_LIMIT.WINDOW_MS;
    }
  }
  
  // Si la ventana ha expirado, resetear contador
  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + config.RATE_LIMIT.WINDOW_MS;
  } else {
    entry.count++;
  }
  
  // Verificar límites
  if (entry.count > config.DDOS_PROTECTION.SUSPICIOUS_THRESHOLD) {
    // Comportamiento sospechoso - bloquear por más tiempo
    entry.blocked = true;
    entry.blockUntil = now + config.DDOS_PROTECTION.BLOCK_DURATION;
    
    if (config.LOGGING.LOG_SUSPICIOUS_ACTIVITY) {
      console.log(`🚨 DDoS Protection: Suspicious activity from IP ${clientIP} - blocked for ${config.DDOS_PROTECTION.BLOCK_DURATION / 60000} minutes`);
    }
    
    return c.json({
      error: 'Suspicious activity detected. Access temporarily restricted.',
      retryAfter: Math.ceil(config.DDOS_PROTECTION.BLOCK_DURATION / 1000)
    }, 429);
  }
  
  if (entry.count > config.RATE_LIMIT.MAX_REQUESTS) {
    if (config.LOGGING.LOG_RATE_LIMITS) {
      console.log(`⚠️ DDoS Protection: Rate limit exceeded for IP ${clientIP}`);
    }
    
    return c.json({
      error: 'Rate limit exceeded. Please slow down.',
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    }, 429);
  }
  
  // Agregar headers informativos
  c.res.headers.set('X-RateLimit-Limit', config.RATE_LIMIT.MAX_REQUESTS.toString());
  c.res.headers.set('X-RateLimit-Remaining', (config.RATE_LIMIT.MAX_REQUESTS - entry.count).toString());
  c.res.headers.set('X-RateLimit-Reset', entry.resetTime.toString());
  
  return next();
}

export async function securityHeadersMiddleware(c: Context, next: Next) {
  await next();
  
  // Headers de seguridad
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP básico para APIs
  c.res.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  
  // Prevenir ataques de timing
  const processingTime = Math.random() * 10; // 0-10ms aleatorio
  if (processingTime > 5) {
    await new Promise(resolve => setTimeout(resolve, processingTime));
  }
}

// Middleware adicional para endpoints sensibles
export async function strictRateLimitMiddleware(c: Context, next: Next) {
  const clientIP = getClientIP(c);
  const key = `strict_rate_limit:${clientIP}`;
  const now = Date.now();
  const STRICT_WINDOW = 60 * 1000; // 1 minuto
  const STRICT_LIMIT = 10; // Solo 10 requests por minuto para endpoints sensibles
  
  let entry = rateLimitStore.get(key);
  
  if (!entry) {
    entry = {
      count: 1,
      resetTime: now + STRICT_WINDOW,
      blocked: false
    };
    rateLimitStore.set(key, entry);
    return next();
  }
  
  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + STRICT_WINDOW;
  } else {
    entry.count++;
  }
  
  if (entry.count > STRICT_LIMIT) {
    console.log(`🔒 Strict Rate Limit: IP ${clientIP} exceeded limit for sensitive endpoint`);
    
    return c.json({
      error: 'Rate limit exceeded for this endpoint.',
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    }, 429);
  }
  
  return next();
}