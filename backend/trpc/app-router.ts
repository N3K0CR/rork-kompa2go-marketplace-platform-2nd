import { createTRPCRouter } from "@/backend/trpc/create-context";
import hiRoute from "@/backend/trpc/routes/example/hi/route";
import * as paymentRoutes from "@/backend/trpc/routes/payments/routes";
import * as commuteRoutes from "@/backend/trpc/routes/commute/routes";
import {
  createZoneProcedure,
  updateZoneProcedure,
  deleteZoneProcedure,
  getAllZonesProcedure,
  getZoneByIdProcedure,
  joinZoneProcedure,
  leaveZoneProcedure,
  getDriverZoneAssignmentsProcedure,
  getZoneSaturationProcedure,
  getZoneRecommendationsProcedure,
  getZoneAnalyticsProcedure,
  getZoneStatusProcedure,
  getNearbyZonesProcedure,
} from './routes/commute/zone-saturation-routes';
import {
  calculateSurgePriceProcedure,
  getSurgePriceProcedure,
  updateDemandMetricsProcedure,
  getDemandMetricsProcedure,
  createSurgePricingConfigProcedure,
  updateSurgePricingConfigProcedure,
  getSurgePricingConfigProcedure,
  getAllSurgePricingConfigsProcedure,
  getSurgePricingAnalyticsProcedure,
  getMultiZoneSurgePricingProcedure,
  getSurgeHeatmapProcedure,
} from './routes/commute/surge-pricing-routes';
import { registrationRouter } from './routes/registration/routes';
import * as kommuteWalletRoutes from "@/backend/trpc/routes/kommute-wallet/routes";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  registration: registrationRouter,
  payments: createTRPCRouter({
    create: paymentRoutes.createPayment,
    get: paymentRoutes.getPayment,
    getUserPayments: paymentRoutes.getUserPayments,
    getAllPayments: paymentRoutes.getAllPayments,
    updateStatus: paymentRoutes.updatePaymentStatus,
    getStats: paymentRoutes.getPaymentStats,
    refund: paymentRoutes.refundPayment,
    getSupportedCountries: paymentRoutes.getSupportedCountriesRoute,
    getCountryConfig: paymentRoutes.getCountryConfigRoute,
    processWebhook: paymentRoutes.processWebhook,
  }),
  // 2KOMMUTE ROUTES - INACTIVO HASTA ACTIVACIÓN
  commute: createTRPCRouter({
    // Route Management
    createRoute: commuteRoutes.createRoute,
    getUserRoutes: commuteRoutes.getUserRoutes,
    updateRoute: commuteRoutes.updateRoute,
    deleteRoute: commuteRoutes.deleteRoute,
    
    // Trip Management
    startTrip: commuteRoutes.startTrip,
    updateTrip: commuteRoutes.updateTrip,
    getUserTrips: commuteRoutes.getUserTrips,
    
    // Matching Service
    findMatches: commuteRoutes.findMatches,
    getMatchingStats: commuteRoutes.getMatchingStats,
    
    // Real-time Service
    subscribeToEvents: commuteRoutes.subscribeToEvents,
    updateLocation: commuteRoutes.updateLocation,
    getTripRealTimeStatus: commuteRoutes.getTripRealTimeStatus,
    getRecentEvents: commuteRoutes.getRecentEvents,
    getRealTimeStats: commuteRoutes.getRealTimeStats,
    
    // Trip Chaining Service
    createTripChain: commuteRoutes.createTripChain,
    findNextTrips: commuteRoutes.findNextTrips,
    acceptNextTrip: commuteRoutes.acceptNextTrip,
    getDriverChains: commuteRoutes.getDriverChains,
    addTripToQueue: commuteRoutes.addTripToQueue,
    getTripChainingStats: commuteRoutes.getTripChainingStats,
    updateDriverLocation: commuteRoutes.updateDriverLocation,
    checkTripCompletionAndFindNearby: commuteRoutes.checkTripCompletionAndFindNearby,
    
    // Destination Mode Service
    setDestinationMode: commuteRoutes.setDestinationMode,
    updateDestinationProgress: commuteRoutes.updateDestinationProgress,
    findTripsToDestination: commuteRoutes.findTripsToDestination,
    getActiveDestinationMode: commuteRoutes.getActiveDestinationMode,
    deactivateDestinationMode: commuteRoutes.deactivateDestinationMode,
    getDestinationModeStats: commuteRoutes.getDestinationModeStats,
    addMockTripsForDestination: commuteRoutes.addMockTripsForDestination,
    clearDestinationMockData: commuteRoutes.clearDestinationMockData,
    
    // Zone Saturation Service
    createZone: createZoneProcedure,
    updateZone: updateZoneProcedure,
    deleteZone: deleteZoneProcedure,
    getAllZones: getAllZonesProcedure,
    getZoneById: getZoneByIdProcedure,
    joinZone: joinZoneProcedure,
    leaveZone: leaveZoneProcedure,
    getDriverZoneAssignments: getDriverZoneAssignmentsProcedure,
    getZoneSaturation: getZoneSaturationProcedure,
    getZoneRecommendations: getZoneRecommendationsProcedure,
    getZoneAnalytics: getZoneAnalyticsProcedure,
    getZoneStatus: getZoneStatusProcedure,
    getNearbyZones: getNearbyZonesProcedure,
    
    // Surge pricing procedures
    calculateSurgePrice: calculateSurgePriceProcedure,
    getSurgePrice: getSurgePriceProcedure,
    updateDemandMetrics: updateDemandMetricsProcedure,
    getDemandMetrics: getDemandMetricsProcedure,
    createSurgePricingConfig: createSurgePricingConfigProcedure,
    updateSurgePricingConfig: updateSurgePricingConfigProcedure,
    getSurgePricingConfig: getSurgePricingConfigProcedure,
    getAllSurgePricingConfigs: getAllSurgePricingConfigsProcedure,
    getSurgePricingAnalytics: getSurgePricingAnalyticsProcedure,
    getMultiZoneSurgePrice: getMultiZoneSurgePricingProcedure,
    getSurgeHeatmap: getSurgeHeatmapProcedure,
  }),
  kommuteWallet: createTRPCRouter({
    getBalance: kommuteWalletRoutes.getBalance,
    getTransactions: kommuteWalletRoutes.getTransactions,
    getStats: kommuteWalletRoutes.getStats,
    createRecharge: kommuteWalletRoutes.createRecharge,
    getPendingRecharges: kommuteWalletRoutes.getPendingRecharges,
    approveRecharge: kommuteWalletRoutes.approveRecharge,
    rejectRecharge: kommuteWalletRoutes.rejectRecharge,
    getAllTransactions: kommuteWalletRoutes.getAllTransactions,
    getPendingDistributions: kommuteWalletRoutes.getPendingDistributions,
    markDistributionCompleted: kommuteWalletRoutes.markDistributionCompleted,
    markDistributionFailed: kommuteWalletRoutes.markDistributionFailed,
  }),
});

export type AppRouter = typeof appRouter;