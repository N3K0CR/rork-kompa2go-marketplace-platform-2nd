// ============================================================================
// GEOCODING ROUTES
// ============================================================================
// tRPC routes for geocoding services

import { z } from 'zod';
import { publicProcedure, router } from '../../create-context';
import { geocodingService } from './service';

export const geocodingRouter = router({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
        countryCode: z.string().optional().default('cr'),
      })
    )
    .query(async ({ input }) => {
      return await geocodingService.search(input.query, input.countryCode);
    }),

  reverse: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await geocodingService.reverse(input.latitude, input.longitude);
    }),
});
