# 🔥 DESPLEGAR REGLAS DE FIRESTORE - INSTRUCCIONES

## ⚠️ CRÍTICO: Debes ejecutar estos pasos AHORA

Los errores de permisos que estás viendo se deben a que las reglas de Firestore no están desplegadas en Firebase.

---

## Paso 1: Desplegar Reglas de Firestore

### Opción A: Usando Firebase CLI (Recomendado)

```bash
# 1. Dar permisos de ejecución al script
chmod +x deploy-firestore-rules-now.sh

# 2. Ejecutar el script
./deploy-firestore-rules-now.sh
```

### Opción B: Manualmente desde Firebase Console

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Seleccionar tu proyecto
3. Ir a **Firestore Database** → **Rules**
4. Copiar todo el contenido del archivo `firestore.rules`
5. Pegar en el editor de reglas
6. Hacer clic en **Publicar**

---

## Paso 2: Configurar Usuario Administrador

Después de desplegar las reglas, necesitas crear al menos un usuario administrador.

### Opción A: Usando el Script (Recomendado)

```bash
# 1. Instalar firebase-admin si no lo tienes
npm install firebase-admin

# 2. Dar permisos de ejecución
chmod +x setup-admin-user.js

# 3. Ejecutar el script
node setup-admin-user.js
```

El script te pedirá:
- **User ID**: El UID de Firebase Auth del usuario (puedes verlo en Firebase Console → Authentication)
- **Email**: El email del administrador
- **Nombre**: Nombre completo (opcional)

### Opción B: Manualmente desde Firebase Console

1. Ir a Firebase Console → Firestore Database
2. Crear una nueva colección llamada `admin_users`
3. Crear un documento con ID = `{UID del usuario de Firebase Auth}`
4. Agregar estos campos:

```javascript
{
  email: "admin@kompa2go.com",
  role: "admin",
  permissions: [
    "manage_kommuters",
    "manage_payments", 
    "view_alerts",
    "manage_users",
    "view_transactions"
  ],
  createdAt: {timestamp actual},
  active: true,
  name: "Nombre del Admin" // opcional
}
```

---

## Paso 3: Verificar que Funciona

Después de desplegar las reglas y crear el administrador:

1. **Cerrar sesión** en la app (si estás logueado)
2. **Iniciar sesión** con el usuario administrador
3. **Probar estas funciones**:
   - ✅ Panel de Kommuter
   - ✅ Gestión de Conductores → Pendientes Aprobación
   - ✅ Sistema de Alertas
   - ✅ Recargas de Billetera Kommute

Si ves errores de permisos, verifica:
- Las reglas están desplegadas en Firebase
- El usuario administrador existe en `admin_users`
- El UID del documento coincide con el UID de Firebase Auth

---

## ¿Qué se Corrigió?

### Errores Resueltos ✅

1. **Permission Denied en Kommuter Applications**
   - Ahora los admins pueden ver todas las aplicaciones pendientes
   - Los usuarios pueden ver sus propias aplicaciones

2. **Permission Denied en Alert Tracking**
   - Agregada colección `alert_location_tracking` para seguimiento en tiempo real
   - Los kommuters pueden actualizar su ubicación durante alertas
   - Los admins pueden ver todas las alertas

3. **Permission Denied en Kommute Wallet**
   - Los admins pueden ver todas las recargas pendientes
   - Los admins pueden aprobar/rechazar recargas
   - Los usuarios pueden ver sus propias transacciones

### Nuevas Funcionalidades ✅

1. **Sistema de Administradores**
   - Función `isAdmin()` en las reglas
   - Colección `admin_users` para gestionar permisos
   - Acceso completo a todas las colecciones para admins

2. **Seguimiento en Tiempo Real para Alertas**
   - Colección `alert_location_tracking`
   - Actualización de ubicación en tiempo real
   - Protocolo 911 con preguntas de seguridad

3. **Panel Administrativo Completo**
   - Ver todas las transacciones del sistema
   - Aprobar/rechazar kommuters
   - Gestionar alertas de seguridad
   - Aprobar recargas de billetera

---

## Comandos Rápidos

```bash
# Desplegar reglas
./deploy-firestore-rules-now.sh

# Configurar admin
node setup-admin-user.js

# Ver reglas actuales en Firebase
firebase firestore:rules

# Ver proyecto actual
firebase use
```

---

## Soporte

Si encuentras problemas:

1. **Verifica que Firebase CLI está instalado**:
   ```bash
   firebase --version
   ```

2. **Verifica que estás logueado**:
   ```bash
   firebase login
   ```

3. **Verifica el proyecto correcto**:
   ```bash
   firebase use
   ```

4. **Verifica las variables de entorno**:
   ```bash
   cat .env.local | grep FIREBASE
   ```

---

## ⚠️ IMPORTANTE

**Las reglas NO se aplican automáticamente**. Debes desplegarlas manualmente usando uno de los métodos arriba.

**Sin desplegar las reglas, seguirás viendo errores de permisos.**

---

**Última actualización**: 2025-10-06  
**Estado**: ✅ Reglas corregidas, listas para desplegar
