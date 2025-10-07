# 📱 Guía de Inicio de Sesión - Kompa2Go

## 🎯 Cómo Iniciar Sesión en la Aplicación

### 1️⃣ **Acceder a la Pantalla de Autenticación**

La aplicación tiene una pantalla de autenticación ubicada en: `/auth`

**Rutas disponibles:**
- `app/auth.tsx` - Pantalla principal de autenticación
- `app/onboarding.tsx` - Pantalla de bienvenida (opcional)

---

## 🔐 **Opciones de Inicio de Sesión**

### **Opción A: Iniciar Sesión con Cuenta Existente**

1. **Abrir la aplicación** y navegar a la pantalla de autenticación
2. **Asegurarse de estar en modo "Iniciar Sesión"** (por defecto)
3. **Ingresar credenciales:**
   - ✉️ **Correo electrónico**
   - 🔒 **Contraseña**
4. **Presionar el botón** "Iniciar Sesión"

```typescript
// Ejemplo de credenciales de prueba
Email: usuario@ejemplo.com
Password: tu_contraseña_segura
```

---

### **Opción B: Crear Nueva Cuenta**

Si no tienes cuenta, puedes registrarte:

1. **Presionar** "¿No tienes cuenta? Regístrate"
2. **Seleccionar tipo de usuario:**
   - 👤 **Mi-Kompa (Cliente)** - Para usuarios que buscan servicios
   - 🏢 **2-Kompa (Proveedor)** - Para proveedores de servicios

#### **Registro como Cliente (Mi-Kompa):**
- Nombre completo
- Correo electrónico
- Contraseña
- Teléfono
- Fecha de nacimiento
- Ubicación
- ¿Cómo nos encontraste?

#### **Registro como Proveedor (2-Kompa):**
El registro de proveedor tiene **4 pasos:**

**Paso 1: Información Básica**
- Nombre completo
- Teléfono
- Fecha de nacimiento
- ¿Cómo nos encontraste?

**Paso 2: Detalles del Negocio**
- Nombre del negocio
- Servicios que ofreces
- Link a lista de precios pública

**Paso 3: Logística de Servicios**
- ¿Requiere que clientes viajen a tu ubicación?
- ¿Servicio a domicilio?
- ¿Trabajas con rutas de ventas?

**Paso 4: Detalles Finales**
- Redes sociales (Facebook, Instagram, Website)

---

## 🔄 **Cambiar de Rol (Cliente ↔ Proveedor)**

Si ya tienes una cuenta y quieres cambiar de rol:

1. En la pantalla de inicio de sesión, presiona **"Cambiar a Proveedor/Cliente"**
2. Ingresa tus credenciales
3. Selecciona el rol deseado
4. Presiona "Cambiar Rol"

---

## 🔑 **¿Olvidaste tu Contraseña?**

1. En la pantalla de inicio de sesión, presiona **"¿Olvidó su contraseña?"**
2. Ingresa tu correo electrónico
3. Presiona "Enviar Correo"
4. Revisa tu email para el enlace de recuperación

---

## 🌐 **Cambiar Idioma**

En la esquina superior derecha de la pantalla de autenticación, encontrarás el **selector de idioma** para cambiar entre:
- 🇪🇸 Español
- 🇺🇸 English
- 🇫🇷 Français

---

## 🚀 **Flujo Completo de Autenticación**

```
┌─────────────────────────────────────┐
│   Abrir Aplicación                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Pantalla de Autenticación         │
│   (app/auth.tsx)                    │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│ Iniciar     │  │ Registrarse │
│ Sesión      │  │             │
└──────┬──────┘  └──────┬──────┘
       │                │
       │                ▼
       │         ┌─────────────┐
       │         │ Seleccionar │
       │         │ Tipo Usuario│
       │         └──────┬──────┘
       │                │
       │         ┌──────┴──────┐
       │         │             │
       │         ▼             ▼
       │    ┌─────────┐  ┌─────────┐
       │    │ Cliente │  │Proveedor│
       │    └────┬────┘  └────┬────┘
       │         │            │
       └─────────┴────────────┘
                 │
                 ▼
       ┌─────────────────┐
       │ Firebase Auth   │
       │ + App Context   │
       └────────┬────────┘
                │
                ▼
       ┌─────────────────┐
       │ Pantalla        │
       │ Principal       │
       │ (tabs)          │
       └─────────────────┘
```

---

## 🔧 **Contextos de Autenticación**

La aplicación utiliza dos sistemas de autenticación:

### 1. **Firebase Authentication** (`FirebaseAuthContext`)
- Maneja la autenticación con Firebase
- Funciones disponibles:
  - `signInWithEmail(email, password)`
  - `signUpWithEmail(email, password, displayName)`
  - `signOut()`
  - `resetPassword(email)`
  - `changePassword(currentPassword, newPassword)`

### 2. **App Authentication** (`AuthContext`)
- Maneja el estado de la aplicación
- Sincroniza con Firebase
- Gestiona roles de usuario (cliente/proveedor)

---

## 📝 **Ejemplo de Código para Iniciar Sesión**

```typescript
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useAuth } from '@/contexts/AuthContext';

function LoginComponent() {
  const { signInWithEmail } = useFirebaseAuth();
  const { signIn } = useAuth();

  const handleLogin = async () => {
    try {
      // 1. Autenticar con Firebase
      await signInWithEmail(email, password);
      
      // 2. Iniciar sesión en la app
      await signIn(email, password);
      
      // 3. Navegar a la pantalla principal
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };
}
```

---

## ⚠️ **Solución de Problemas Comunes**

### **Error: "Missing or insufficient permissions"**
- **Causa:** Las reglas de Firestore no están configuradas correctamente
- **Solución:** Ejecutar el script de despliegue de reglas:
  ```bash
  chmod +x deploy-firestore-rules.sh
  ./deploy-firestore-rules.sh
  ```

### **Error: "User not found"**
- **Causa:** El usuario no existe en Firebase
- **Solución:** Crear una nueva cuenta usando el formulario de registro

### **Error: "Wrong password"**
- **Causa:** Contraseña incorrecta
- **Solución:** Usar la función "¿Olvidó su contraseña?" para recuperarla

### **Error: "Network request failed"**
- **Causa:** Problemas de conexión a internet
- **Solución:** Verificar la conexión y reintentar

---

## 🎨 **Características de la Pantalla de Autenticación**

- ✅ **Diseño moderno** con gradiente rosa
- ✅ **Validación de formularios** en tiempo real
- ✅ **Mensajes de error** en español
- ✅ **Soporte multiidioma**
- ✅ **Registro paso a paso** para proveedores
- ✅ **Recuperación de contraseña**
- ✅ **Cambio de rol** sin crear nueva cuenta
- ✅ **Indicadores de carga** durante el proceso

---

## 📱 **Navegación Post-Autenticación**

Después de iniciar sesión exitosamente, serás redirigido a:

```
/(tabs) - Pantalla principal con pestañas
  ├── index - Inicio
  ├── search - Búsqueda
  ├── calendar - Calendario
  ├── chat - Chat
  ├── profile - Perfil
  └── ... otras pestañas
```

---

## 🔐 **Seguridad**

- 🔒 **Contraseñas encriptadas** con Firebase Auth
- 🔒 **Tokens seguros** para sesiones
- 🔒 **Reglas de Firestore** para proteger datos
- 🔒 **Validación de email** requerida
- 🔒 **Límite de intentos** para prevenir ataques

---

## 📞 **Soporte**

Si tienes problemas para iniciar sesión:
1. Verifica tu conexión a internet
2. Asegúrate de que Firebase esté configurado correctamente
3. Revisa los logs de la consola para más detalles
4. Contacta al administrador del sistema

---

## 🎯 **Resumen Rápido**

**Para iniciar sesión:**
1. Abre la app → Pantalla de autenticación
2. Ingresa email y contraseña
3. Presiona "Iniciar Sesión"
4. ¡Listo! Estás dentro

**Para registrarte:**
1. Presiona "¿No tienes cuenta? Regístrate"
2. Selecciona tipo de usuario (Cliente o Proveedor)
3. Completa el formulario
4. Presiona "Crear mi cuenta"
5. ¡Bienvenido a Kompa2Go!

---

**Última actualización:** 2025-10-07
**Versión:** 1.0
