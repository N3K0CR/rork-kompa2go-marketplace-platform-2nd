import { Tabs } from "expo-router";
import { Home, Search, Calendar, BarChart3, LayoutGrid, MessageCircle, Gift, UserCircle, Route } from "lucide-react-native";
import React from "react";
import { View, Text } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChat } from "@/contexts/ChatContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function TabLayout() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { getUnreadCount } = useChat();
  const userType = user?.userType || 'client';
  const unreadCount = getUnreadCount();
  
  console.log('📱 TabLayout - Current user:', user);
  console.log('📱 TabLayout - UserType:', userType);
  console.log('📱 TabLayout - Should show calendar for client?', userType === 'client');
  console.log('📱 TabLayout - Should show calendar for provider?', userType === 'provider');
  console.log('📱 TabLayout - Is Sakura Beauty Salon?', user?.name === 'Sakura Beauty Salon');

  const headerRight = () => (
    <View style={{ marginRight: 15 }}>
      <LanguageSwitcher />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#D81B60',
        tabBarInactiveTintColor: '#666',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          color: '#333',
          fontWeight: 'bold',
        },
        headerRight: headerRight,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      
      <Tabs.Screen
        name="search"
        options={{
          title: userType === 'admin' ? 'Búsqueda' : t('search'),
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
          href: userType === 'client' || userType === 'admin' ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: userType === 'admin' ? 'Calendario' : t('calendar'),
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
          href: userType === 'client' || userType === 'provider' || userType === 'admin' ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="programas"
        options={{
          title: 'Programas',
          tabBarIcon: ({ color, size }) => <Gift color={color} size={size} />,
          href: userType === 'client' ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: userType === 'provider' ? 'Programas' : 'Analytics',
          tabBarIcon: ({ color, size }) => userType === 'provider' ? <LayoutGrid color={color} size={size} /> : <BarChart3 color={color} size={size} />,
          href: userType === 'admin' || userType === 'provider' ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="commute"
        options={{
          title: 'Viajar',
          tabBarIcon: ({ color, size }) => <Route color={color} size={size} />,
          href: '/commute'
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <UserCircle color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chats',
          href: userType === 'client' || userType === 'provider' ? '/chats' : null,
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <MessageCircle color={color} size={size} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#FF3B30',
                  borderRadius: 8,
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                  minWidth: 16,
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
