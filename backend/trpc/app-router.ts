import { createTRPCRouter } from "@/backend/trpc/create-context";
import hiRoute from "@/backend/trpc/routes/example/hi/route";
import * as paymentRoutes from "@/backend/trpc/routes/payments/routes";

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
});

export type AppRouter = typeof appRouter;