// ============================================================================
// GEOCODING ROUTES
// ============================================================================
// tRPC routes for geocoding services

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, createTRPCRouter } from '../../create-context';
import { geocodingService } from './service';

export const geocodingRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
        countryCode: z.string().optional().default('cr'),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log('[Geocoding Route] Search request:', input.query);
        const result = await geocodingService.search(input.query, input.countryCode);
        console.log('[Geocoding Route] Search result:', result.length, 'items');
        return result;
      } catch (error) {
        console.error('[Geocoding Route] Search error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to search locations',
          cause: error,
        });
      }
    }),

  reverse: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log('[Geocoding Route] Reverse geocoding request:', input);
        const result = await geocodingService.reverse(input.latitude, input.longitude);
        console.log('[Geocoding Route] Reverse geocoding result:', result?.address || 'null');
        return result;
      } catch (error) {
        console.error('[Geocoding Route] Reverse geocoding error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to reverse geocode location',
          cause: error,
        });
      }
    }),
});
