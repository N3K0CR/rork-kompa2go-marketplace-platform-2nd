import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Return a placeholder URL for development when backend is not configured
  // This prevents the app from crashing but tRPC calls will fail gracefully
  console.warn(
    '⚠️ EXPO_PUBLIC_RORK_API_BASE_URL is not set. Backend tRPC will not work.\n' +
    'This is automatically set by Rork CLI when running the app.\n' +
    'If you are running locally, make sure to start the app with: bun start'
  );
  return 'http://localhost:8082'; // Fallback URL - Backend default port
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
        const url = `${getBaseUrl()}/api/trpc`;
        console.log('🔍 tRPC request headers - token:', token ? 'Present' : 'Missing');
        console.log('🌐 tRPC URL:', url);
        return token ? {
          authorization: `Bearer ${token}`,
        } : {};
      },
    }),
  ],
});