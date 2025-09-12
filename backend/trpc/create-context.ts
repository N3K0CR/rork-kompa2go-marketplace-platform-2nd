import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

// Mock user type for context
interface User {
  id: string;
  name: string;
  email: string;
  userType: 'client' | 'provider' | 'admin';
}

// Context creation function
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  // Extract auth token from headers (mock implementation)
  const authHeader = opts.req.headers.get('authorization');
  let user: User | null = null;
  
  console.log('🔍 Auth header received:', authHeader);
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    console.log('🔍 Extracted token:', token);
    
    // Validate token format and length
    if (token && token.length > 0 && token.length < 100) {
      // Mock user extraction from token
      if (token === 'admin-token') {
        user = {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@kompa2go.com',
          userType: 'admin'
        };
        console.log('✅ Admin user authenticated');
      } else if (token === 'client-token') {
        user = {
          id: 'client-1',
          name: 'Client User',
          email: 'client@example.com',
          userType: 'client'
        };
        console.log('✅ Client user authenticated');
      } else {
        console.log('❌ Invalid token:', token);
      }
    } else {
      console.log('❌ Invalid token format or length:', { token, length: token?.length });
    }
  } else {
    console.log('🔍 No valid authorization header found');
  }
  
  return {
    req: opts.req,
    user,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Admin procedure that requires admin access
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.userType !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return next({ ctx });
});