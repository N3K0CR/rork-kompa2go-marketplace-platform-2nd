// OKoins Loyalty Program Constants

export const OKOINS_EARNING_RATES = {
  WELCOME_BONUS: 100,
  SERVICE_COMPLETION: 50,
  PROVIDER_RATING: 10,
  FRIEND_REFERRAL: 75,
  DAILY_BONUS: 5,
  RESERVATION_PASS: 25
} as const;

export const OKOINS_SPENDING_OPTIONS = {
  SERVICE_DISCOUNT_RATE: 1, // 1 OKoin = $1 discount
  PREMIUM_ACCESS_COST: 20,
  KRAFFLE_TICKET_BASE_COST: 10
} as const;

export const OKOINS_PROGRAM_INFO = {
  name: 'OKoins',
  description: 'Moneda virtual y sistema de puntos de lealtad exclusivo de Kompa2Go',
  benefits: [
    'Descuentos en servicios',
    'Acceso a servicios premium',
    'Participación en Kraffles (rifas)',
    'Recompensas por fidelidad'
  ],
  earningMethods: [
    {
      method: 'Bono de Bienvenida',
      amount: OKOINS_EARNING_RATES.WELCOME_BONUS,
      description: 'Recibe OKoins automáticamente al registrarte'
    },
    {
      method: 'Completar Servicios',
      amount: OKOINS_EARNING_RATES.SERVICE_COMPLETION,
      description: 'Gana OKoins por cada servicio que reserves y completes'
    },
    {
      method: 'Calificar Proveedores',
      amount: OKOINS_EARNING_RATES.PROVIDER_RATING,
      description: 'Recibe OKoins por dejar reseñas y calificaciones'
    },
    {
      method: 'Referir Amigos',
      amount: OKOINS_EARNING_RATES.FRIEND_REFERRAL,
      description: 'Gana OKoins cuando tus amigos se registren usando tu código'
    },
    {
      method: 'Bono Diario',
      amount: OKOINS_EARNING_RATES.DAILY_BONUS,
      description: 'Inicia sesión diariamente para recibir OKoins'
    },
    {
      method: 'Comprar Pases de Reserva',
      amount: OKOINS_EARNING_RATES.RESERVATION_PASS,
      description: 'Recibe OKoins adicionales al comprar pases de reserva'
    }
  ],
  spendingOptions: [
    {
      option: 'Descuentos en Servicios',
      description: 'Usa tus OKoins para obtener descuentos en la comisión de la plataforma o en el costo de servicios'
    },
    {
      option: 'Servicios Premium',
      description: 'Accede a proveedores de alta calificación y servicios exclusivos'
    },
    {
      option: 'Kraffles (Rifas)',
      description: 'Compra boletos para rifas de productos y servicios creadas por proveedores'
    }
  ]
} as const;

export const DAILY_BONUS_CONFIG = {
  maxStreak: 30,
  streakBonusMultiplier: 1.5, // Bonus multiplier for maintaining streaks
  resetHour: 0 // Hour when daily bonus resets (24-hour format)
} as const;

export const KRAFFLE_CONFIG = {
  minTicketCost: 5,
  maxTicketCost: 100,
  maxTicketsPerUser: 10
} as const;

export type OKoinsCategory = 'welcome' | 'service' | 'rating' | 'referral' | 'daily' | 'reservation_pass' | 'discount' | 'kraffle' | 'premium_access';

export const CATEGORY_LABELS: Record<OKoinsCategory, string> = {
  welcome: 'Bono de Bienvenida',
  service: 'Servicio Completado',
  rating: 'Calificación de Proveedor',
  referral: 'Referido',
  daily: 'Bono Diario',
  reservation_pass: 'Pase de Reserva',
  discount: 'Descuento Aplicado',
  kraffle: 'Kraffle',
  premium_access: 'Acceso Premium'
} as const;

export const CATEGORY_COLORS: Record<OKoinsCategory, string> = {
  welcome: '#4CAF50',
  service: '#2196F3',
  rating: '#FF9800',
  referral: '#9C27B0',
  daily: '#FFC107',
  reservation_pass: '#00BCD4',
  discount: '#F44336',
  kraffle: '#E91E63',
  premium_access: '#673AB7'
} as const;