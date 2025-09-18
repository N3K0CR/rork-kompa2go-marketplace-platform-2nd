import { createTRPCRouter } from "@/backend/trpc/create-context";
import hiRoute from "@/backend/trpc/routes/example/hi/route";
import * as paymentRoutes from "@/backend/trpc/routes/payments/routes";
import * as commuteRoutes from "@/backend/trpc/routes/commute/routes";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
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
  }),
});

export type AppRouter = typeof appRouter;