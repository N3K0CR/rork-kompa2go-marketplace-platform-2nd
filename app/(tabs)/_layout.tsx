import { Tabs } from "expo-router";
import { Home, Search, Calendar, BarChart3, Bell, LayoutGrid, User, MessageCircle } from "lucide-react-native";
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
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
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
      
      {userType === 'client' && (
        <Tabs.Screen
          name="search"
          options={{
            title: t('search'),
            tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
          }}
        />
      )}

      {userType === 'client' && (
        <Tabs.Screen
          name="calendar"
          options={{
            title: t('calendar'),
            tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
          }}
        />
      )}

      {userType === 'provider' && (
        <Tabs.Screen
          name="calendar"
          options={{
            title: t('calendar'),
            tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
          }}
        />
      )}

      {userType === 'admin' && (
        <>
          <Tabs.Screen
            name="analytics"
            options={{
              title: t('analytics'),
              tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Perfil',
              tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="chat"
            options={{
              title: t('notifications'),
              tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
            }}
          />
        </>
      )}

      {userType === 'client' && (
        <>
          <Tabs.Screen
            name="analytics"
            options={{
              title: 'Programas',
              tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Perfil',
              tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
            }}
          />
        </>
      )}

      {userType === 'provider' && (
        <>
          <Tabs.Screen
            name="analytics"
            options={{
              title: 'Programas',
              tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Perfil',
              tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
            }}
          />
        </>
      )}

      {/* Hide search for providers */}
      {userType === 'provider' && (
        <Tabs.Screen
          name="search"
          options={{
            href: null,
          }}
        />
      )}

      {/* Chat tab for clients and providers */}
      {(userType === 'client' || userType === 'provider') && (
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chats',
            href: '/chats',
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
      )}
      
      {/* Hide chat tab for admin users */}
      {userType === 'admin' && (
        <Tabs.Screen
          name="chat"
          options={{
            href: null,
          }}
        />
      )}
    </Tabs>
  );
}