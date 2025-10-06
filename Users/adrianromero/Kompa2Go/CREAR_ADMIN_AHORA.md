# 🚀 CREAR USUARIO ADMINISTRADOR - INSTRUCCIONES

## ❗ PROBLEMA ACTUAL
Recibes el error: `Missing or insufficient permissions` porque **no existe un usuario administrador** en Firestore.

Las reglas de seguridad están correctamente desplegadas, pero necesitas crear el documento de administrador.

---

## ✅ SOLUCIÓN RÁPIDA (Opción 1 - Recomendada)

### Desde Firebase Console:

1. **Ve a Firebase Console**: https://console.firebase.google.com
2. Selecciona tu proyecto **Kompa2Go**
3. Ve a **Firestore Database**
4. Haz clic en **"Iniciar colección"** (o "Start collection")
5. Nombre de la colección: `admin_users`
6. ID del documento: **TU_USER_UID** (lo obtienes del paso 7)
7. Para obtener tu UID:
   - Ve a **Authentication** → **Users**
   - Copia el **User UID** de tu cuenta
8. Vuelve a Firestore y crea el documento con estos campos:

```
Campo: email
Tipo: string
Valor: tu-email@ejemplo.com

Campo: role
Tipo: string
Valor: admin

Campo: createdAt
Tipo: timestamp
Valor: [fecha actual]

Campo: permissions
Tipo: map
Valor: {
  manageKommuters: true,
  managePayments: true,
  manageAlerts: true,
  viewTransactions: true,
  manageUsers: true
}
```

9. Guarda el documento
10. **¡Listo!** Ahora puedes acceder al panel de administrador

---

## 🔧 SOLUCIÓN AUTOMÁTICA (Opción 2)

### Usando el script:

```bash
# 1. Instala dependencias si no las tienes
npm install dotenv firebase

# 2. Ejecuta el script con tus credenciales
node setup-admin-now.js TU_EMAIL@ejemplo.com TU_PASSWORD

# Ejemplo:
node setup-admin-now.js admin@kompa2go.com miPassword123
```

**IMPORTANTE:** Primero debes tener una cuenta creada en la app. Si no tienes cuenta:
1. Abre la app
2. Regístrate con email y contraseña
3. Luego ejecuta el script con esas credenciales

---

## 🔍 VERIFICAR QUE FUNCIONÓ

Después de crear el usuario admin:

1. Ve a Firestore Console
2. Verifica que existe la colección `admin_users`
3. Verifica que existe un documento con tu UID
4. Recarga la app
5. Intenta acceder al panel de administrador

---

## 📋 COLECCIONES QUE REQUIEREN ADMIN

Estas colecciones solo son accesibles para usuarios admin:

- ✅ `admin_users` - Gestión de administradores
- ✅ `kommuter_applications` - Pendientes de aprobación
- ✅ `kommute_wallet_recharges` - Pagos pendientes
- ✅ `alert_tracking` - Alertas de seguridad
- ✅ `system_transactions` - Todas las transacciones

---

## ❓ PREGUNTAS FRECUENTES

### ¿Puedo tener múltiples administradores?
Sí, solo crea un documento en `admin_users` para cada UID de administrador.

### ¿Qué pasa si olvido mi UID?
Ve a Firebase Console → Authentication → Users y copia el User UID.

### ¿El script es seguro?
Sí, solo crea un documento en Firestore. No modifica código ni reglas de seguridad.

### ¿Necesito hacer esto cada vez?
No, solo una vez. El documento permanece en Firestore.

---

## 🆘 SI TIENES PROBLEMAS

1. Verifica que las reglas de Firestore estén desplegadas
2. Verifica que tu cuenta existe en Authentication
3. Verifica que el documento en `admin_users` tiene tu UID correcto
4. Cierra sesión y vuelve a iniciar sesión en la app
5. Revisa la consola de Firebase para ver logs de errores

---

## ✨ DESPUÉS DE CREAR EL ADMIN

Una vez que tengas el usuario admin configurado, podrás:

- ✅ Ver kommuters pendientes de aprobación
- ✅ Aprobar/rechazar aplicaciones de kommuters
- ✅ Ver y aprobar recargas de billetera Kommute
- ✅ Gestionar alertas de seguridad
- ✅ Ver todas las transacciones del sistema
- ✅ Acceder al panel administrativo completo

---

**¿Necesitas ayuda?** Revisa los logs en la consola de la app para más detalles.
