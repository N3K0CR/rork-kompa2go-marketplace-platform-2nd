import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, Briefcase, Car } from 'lucide-react-native';
import { AccessibleText } from '@/components/AccessibleText';
import { AccessibleButton } from '@/components/AccessibleButton';
import { useAccessibility } from '@/contexts/AccessibilityContext';

type UserRole = 'client' | 'provider' | 'kommuter';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { preferences, announceForScreenReader } = useAccessibility();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    
    let message = '';
    switch (role) {
      case 'client':
        message = 'Registro como Cliente seleccionado. MiKompa te permite reservar servicios fácilmente.';
        break;
      case 'provider':
        message = 'Registro como Proveedor seleccionado. 2Kompa te permite ofrecer tus servicios profesionales.';
        break;
      case 'kommuter':
        message = 'Registro como Conductor seleccionado. Kommute te permite ofrecer servicios de transporte.';
        break;
    }
    
    announceForScreenReader(message);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;
    
    announceForScreenReader(`Iniciando registro como ${selectedRole}`);
    
    switch (selectedRole) {
      case 'client':
        router.push('/register/client');
        break;
      case 'provider':
        router.push('/register/provider');
        break;
      case 'kommuter':
        router.push('/register/kommuter');
        break;
    }
  };

  const roles = [
    {
      id: 'client' as UserRole,
      title: 'Cliente (MiKompa)',
      description: 'Reserva servicios de salud, belleza, fitness y más',
      icon: Users,
      color: '#007AFF',
    },
    {
      id: 'provider' as UserRole,
      title: 'Proveedor (2Kompa)',
      description: 'Ofrece tus servicios profesionales y gestiona tu negocio',
      icon: Briefcase,
      color: '#34C759',
    },
    {
      id: 'kommuter' as UserRole,
      title: 'Conductor (Kommute)',
      description: 'Ofrece servicios de transporte y gana dinero conduciendo',
      icon: Car,
      color: '#FF9500',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        accessible={true}
        accessibilityLabel="Pantalla de selección de tipo de registro"
      >
        <View style={styles.header}>
          <AccessibleText
            text="Bienvenido a Kompa2Go"
            style={[
              styles.title,
              preferences.largeText && styles.titleLarge,
              preferences.highContrast && styles.titleHighContrast,
            ]}
            accessibilityLabel="Bienvenido a Kompa2Go"
            accessibilityHint="Título principal de la aplicación"
          />
          
          <AccessibleText
            text="Selecciona cómo deseas registrarte"
            style={[
              styles.subtitle,
              preferences.largeText && styles.subtitleLarge,
            ]}
            accessibilityLabel="Selecciona cómo deseas registrarte"
          />
        </View>

        <View style={styles.rolesContainer}>
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleCard,
                  isSelected && styles.roleCardSelected,
                  isSelected && { borderColor: role.color },
                  preferences.highContrast && styles.roleCardHighContrast,
                  preferences.highContrast && isSelected && { borderColor: '#000', borderWidth: 3 },
                ]}
                onPress={() => handleRoleSelect(role.id)}
                accessible={true}
                accessibilityLabel={`${role.title}: ${role.description}`}
                accessibilityHint={isSelected ? 'Seleccionado' : 'Toca para seleccionar'}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.iconContainer, { backgroundColor: role.color + '20' }]}>
                  <Icon 
                    size={preferences.largeText ? 36 : 32} 
                    color={preferences.highContrast ? '#000' : role.color} 
                  />
                </View>
                
                <Text 
                  style={[
                    styles.roleTitle,
                    preferences.largeText && styles.roleTitleLarge,
                    preferences.highContrast && styles.roleTitleHighContrast,
                  ]}
                >
                  {role.title}
                </Text>
                
                <Text 
                  style={[
                    styles.roleDescription,
                    preferences.largeText && styles.roleDescriptionLarge,
                    preferences.highContrast && styles.roleDescriptionHighContrast,
                  ]}
                >
                  {role.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <AccessibleButton
            label="Continuar"
            onPress={handleContinue}
            disabled={!selectedRole}
            style={styles.continueButton}
            accessibilityLabel="Continuar con el registro"
            accessibilityHint={selectedRole ? `Continuar como ${selectedRole}` : 'Selecciona un tipo de registro primero'}
          />
          
          <TouchableOpacity
            onPress={() => router.push('/auth')}
            style={styles.loginLink}
            accessible={true}
            accessibilityLabel="¿Ya tienes cuenta? Inicia sesión"
            accessibilityRole="button"
          >
            <Text style={[styles.loginText, preferences.largeText && styles.loginTextLarge]}>
              ¿Ya tienes cuenta? <Text style={styles.loginTextBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleLarge: {
    fontSize: 40,
  },
  titleHighContrast: {
    color: '#000',
    fontWeight: '900' as const,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  subtitleLarge: {
    fontSize: 20,
  },
  rolesContainer: {
    gap: 16,
    marginBottom: 32,
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  roleCardSelected: {
    borderWidth: 3,
    backgroundColor: '#f0f8ff',
  },
  roleCardHighContrast: {
    borderColor: '#000',
    borderWidth: 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleTitleLarge: {
    fontSize: 24,
  },
  roleTitleHighContrast: {
    color: '#000',
    fontWeight: '900' as const,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  roleDescriptionLarge: {
    fontSize: 18,
    lineHeight: 24,
  },
  roleDescriptionHighContrast: {
    color: '#000',
    fontWeight: '600' as const,
  },
  footer: {
    gap: 16,
  },
  continueButton: {
    width: '100%',
  },
  loginLink: {
    padding: 16,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginTextLarge: {
    fontSize: 18,
  },
  loginTextBold: {
    fontWeight: '700' as const,
    color: '#007AFF',
  },
});
