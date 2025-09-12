import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

// Global token storage for tRPC client
let currentAuthToken: string | null = null;

// Function to set auth token (called from AuthContext)
export const setAuthToken = (token: string | null) => {
  currentAuthToken = token;
  console.log('🔑 Auth token updated:', token ? 'Token set' : 'Token cleared');
};

// Function to get current auth token
export const getAuthToken = () => {
  return currentAuthToken;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers: () => {
        const token = getAuthToken();
        console.log('🔍 tRPC request headers - token:', token ? 'Present' : 'Missing');
        return token ? {
          authorization: `Bearer ${token}`,
        } : {};
      },
    }),
  ],
});