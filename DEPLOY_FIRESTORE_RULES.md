# 🔥 Desplegar Reglas de Firestore Actualizadas

## ⚠️ IMPORTANTE - Error Resuelto

Se ha corregido el error de permisos de Firebase para el sistema de seguimiento de alertas:
```
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

## 📋 Cambios Realizados

Se agregaron permisos para las siguientes colecciones:

1. **`driver_tracking_sessions`** - Sesiones de seguimiento en tiempo real de conductores
2. **`alert_911_calls`** - Registro de llamadas al 911

## 🚀 Cómo Desplegar las Reglas

### Opción 1: Firebase Console (Recomendado para desarrollo)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Rules**
4. Copia el contenido del archivo `firestore.rules`
5. Pégalo en el editor
6. Haz clic en **Publish**

### Opción 2: Firebase CLI (Recomendado para producción)

```bash
# 1. Instalar Firebase CLI si no lo tienes
npm install -g firebase-tools

# 2. Iniciar sesión
firebase login

# 3. Desplegar solo las reglas de Firestore
firebase deploy --only firestore:rules

# 4. Verificar el despliegue
firebase firestore:rules:get
```

## ✅ Verificación

Después de desplegar, verifica que el sistema funcione:

1. Ve al **Kommuter Panel** en la app
2. Haz clic en una alerta de peligro activa
3. Presiona **"Activar Seguimiento en Tiempo Real"**
4. Verifica que no aparezca el error de permisos

## 🔐 Permisos Agregados

### Driver Tracking Sessions
```javascript
match /driver_tracking_sessions/{sessionId} {
  allow read: if isAuthenticated();
  allow create, update: if isAuthenticated();
  allow delete: if isAuthenticated();
  allow list: if isAuthenticated();
}
```

### Alert 911 Calls
```javascript
match /alert_911_calls/{callId} {
  allow read: if isAuthenticated();
  allow create, update: if isAuthenticated();
  allow delete: if isAuthenticated();
  allow list: if isAuthenticated();
}
```

## 📊 Funcionalidades Habilitadas

Con estas reglas actualizadas, ahora funcionan:

✅ **Seguimiento en Tiempo Real**
- Activar seguimiento de conductores desde alertas de peligro
- Actualizar ubicación en tiempo real
- Visualizar historial de ubicaciones

✅ **Llamadas al 911**
- Registrar llamadas de emergencia
- Compartir ubicación con autoridades
- Actualizar estado de despacho

✅ **Panel Administrativo**
- Ver todas las alertas activas
- Investigar incidentes
- Gestionar seguimiento de conductores

## 🔄 Próximos Pasos

1. **Desplegar las reglas** usando una de las opciones anteriores
2. **Probar el sistema** de seguimiento de alertas
3. **Monitorear** los logs de Firebase para verificar que no hay errores de permisos

## 📝 Notas de Seguridad

- Las reglas actuales están en **modo desarrollo** (permiten acceso a usuarios autenticados)
- Antes de producción, considera implementar reglas más restrictivas basadas en roles
- Mantén un registro de auditoría de las llamadas al 911

## 🆘 Soporte

Si encuentras problemas después del despliegue:
1. Verifica que las reglas se desplegaron correctamente en Firebase Console
2. Revisa los logs de Firebase en la consola
3. Asegúrate de que el usuario esté autenticado (signInAnonymously se ejecuta automáticamente)
