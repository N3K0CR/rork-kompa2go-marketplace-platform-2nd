import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { OKoinsProvider } from "@/contexts/OKoinsContext";
import { AppointmentsProvider } from "@/contexts/AppointmentsContext";
import { TeamCalendarProvider } from "@/contexts/TeamCalendarContext";
import { ReservationAlertProvider } from "@/contexts/ReservationAlertContext";
import { ProviderProvider } from "@/contexts/ProviderContext";
import { ReservationPlansProvider } from "@/contexts/ReservationPlansContext";
import { PendingPaymentsProvider } from "@/contexts/PendingPaymentsContext";
import { LocationSearchProvider } from "@/contexts/LocationSearchContext";
import { PaymentBackendProvider } from "@/contexts/PaymentBackendContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { K2GProductsProvider } from "@/contexts/K2GProductsContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ReservationAlertModal } from "@/components/ReservationAlertModal";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const headerRight = () => (
    <View style={styles.headerRightContainer}>
      <LanguageSwitcher />
    </View>
  );

  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Atrás",
      headerRight: headerRight,
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTitleStyle: {
        color: '#333',
        fontWeight: 'bold',
      },
    }}>

      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="booking/[providerId]" options={{ title: "Reservar Servicio" }} />
      <Stack.Screen name="chat" options={{ title: "Kompi - Asistente" }} />
      <Stack.Screen name="chats" options={{ title: "Mensajes" }} />
      <Stack.Screen name="chat/[chatId]" options={{ headerShown: false }} />
      <Stack.Screen name="provider/[id]" options={{ title: "Detalles del Proveedor" }} />
      <Stack.Screen name="purchase-plan" options={{ headerShown: false }} />
      <Stack.Screen name="admin-products" options={{ title: "Administrar Productos K2G" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <WalletProvider>
            <OKoinsProvider>
              <AppointmentsProvider>
                <TeamCalendarProvider>
                  <ReservationAlertProvider>
                    <ProviderProvider>
                      <ReservationPlansProvider>
                        <PendingPaymentsProvider>
                          <LocationSearchProvider>
                            <PaymentBackendProvider>
                              <ChatProvider>
                                <K2GProductsProvider>
                                  <GestureHandlerRootView style={styles.container}>
                                    <RootLayoutNav />
                                    <ReservationAlertModal />
                                  </GestureHandlerRootView>
                                </K2GProductsProvider>
                              </ChatProvider>
                            </PaymentBackendProvider>
                          </LocationSearchProvider>
                        </PendingPaymentsProvider>
                      </ReservationPlansProvider>
                    </ProviderProvider>
                  </ReservationAlertProvider>
                </TeamCalendarProvider>
              </AppointmentsProvider>
            </OKoinsProvider>
          </WalletProvider>
        </AuthProvider>
      </LanguageProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  headerRightContainer: {
    marginRight: 15,
  },
  container: {
    flex: 1,
  },
});