export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export interface AdminUser {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermission[];
  createdAt: Date;
  lastLogin?: Date;
}

export type AdminPermission = 
  | 'approve_recharges'
  | 'manage_distributions'
  | 'view_metrics'
  | 'manage_users'
  | 'manage_kommuters'
  | 'manage_providers'
  | 'view_transactions'
  | 'manage_settings';

export interface AdminMetrics {
  totalUsers: number;
  totalKommuters: number;
  totalProviders: number;
  activeTrips: number;
  completedTripsToday: number;
  pendingRecharges: number;
  pendingDistributions: number;
  totalRevenueToday: number;
  totalRevenue30Days: number;
  averageTripPrice: number;
  topKommuters: {
    id: string;
    name: string;
    tripsCompleted: number;
    earnings: number;
  }[];
  recentActivity: AdminActivity[];
}

export interface AdminActivity {
  id: string;
  type: 'recharge_approved' | 'recharge_rejected' | 'distribution_completed' | 'user_registered' | 'trip_completed';
  description: string;
  userId?: string;
  adminId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface RechargeApprovalStats {
  totalPending: number;
  totalApprovedToday: number;
  totalRejectedToday: number;
  averageApprovalTime: number;
  totalAmountPending: number;
}

export interface DistributionStats {
  totalPending: number;
  totalScheduledToday: number;
  totalCompletedToday: number;
  totalFailedToday: number;
  totalAmountPending: number;
  totalAmountDistributedToday: number;
}

export interface TransactionFilters {
  userId?: string;
  type?: 'recharge' | 'trip_payment' | 'trip_hold' | 'trip_release' | 'refund';
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}
