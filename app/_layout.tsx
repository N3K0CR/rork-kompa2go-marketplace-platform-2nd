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
import { ReportedProblemsProvider } from "@/contexts/ReportedProblemsContext";
import { LemonSqueezyProvider } from "@/contexts/LemonSqueezyContext";
import { KompiBrainProvider } from "@/contexts/KompiBrainContext";
import CommuteProvider from "@/contexts/CommuteContext";
// import { DatabaseProvider } from "@/contexts/DatabaseContext";
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
      <Stack.Screen name="payment-success" options={{ headerShown: false }} />
      <Stack.Screen name="admin-products" options={{ title: "Administrar Productos K2G" }} />
      <Stack.Screen name="reported-problems" options={{ headerShown: false }} />
      <Stack.Screen name="client/history" options={{ headerShown: false }} />
      <Stack.Screen name="test-kompi" options={{ title: "Test KompiBrain" }} />
      
      {/* 2Kommute Routes */}
      <Stack.Screen name="commute" options={{ headerShown: false }} />
      <Stack.Screen name="commute/search" options={{ title: "Buscar Viaje" }} />
      <Stack.Screen name="commute/driver" options={{ title: "Modo Conductor" }} />
      <Stack.Screen name="commute/trip/[tripId]" options={{ title: "Detalles del Viaje" }} />
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
        {/* Temporarily disable DatabaseProvider to fix SharedArrayBuffer error */}
        {/* <DatabaseProvider> */}
          <LanguageProvider>
            <AuthProvider>
            <PaymentBackendProvider>
              <OKoinsProvider>
                <AppointmentsProvider>
                  <KompiBrainProvider>
                    <ReservationPlansProvider>
                      <WalletProvider>
                        <TeamCalendarProvider>
                          <ReservationAlertProvider>
                            <ProviderProvider>
                              <PendingPaymentsProvider>
                                <LocationSearchProvider>
                                  <LemonSqueezyProvider>
                                    <ChatProvider>
                                      <K2GProductsProvider>
                                        <ReportedProblemsProvider>
                                          <CommuteProvider>
                                            <GestureHandlerRootView style={styles.container}>
                                              <RootLayoutNav />
                                              <ReservationAlertModal />
                                            </GestureHandlerRootView>
                                          </CommuteProvider>
                                        </ReportedProblemsProvider>
                                      </K2GProductsProvider>
                                    </ChatProvider>
                                  </LemonSqueezyProvider>
                                </LocationSearchProvider>
                              </PendingPaymentsProvider>
                            </ProviderProvider>
                          </ReservationAlertProvider>
                        </TeamCalendarProvider>
                      </WalletProvider>
                    </ReservationPlansProvider>
                  </KompiBrainProvider>
                </AppointmentsProvider>
              </OKoinsProvider>
            </PaymentBackendProvider>
            </AuthProvider>
          </LanguageProvider>
        {/* </DatabaseProvider> */}
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