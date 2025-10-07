# Guía de Inicio de Sesión - Kompa2Go

## Credenciales de Prueba

### Usuarios Administradores
1. **Neko1 (Admin)**
   - Email: `agostounonueve@gmail.com`
   - Contraseña: `kompa2go_admin12025`

2. **Neko2 (Admin)**
   - Email: `onlycr@yahoo.com`
   - Contraseña: `kompa2go_admin22025`

### Usuarios Proveedores (2-Kompa)
1. **Proveedor Demo 1**
   - Email: `agostounonueve@gmail.com`
   - Contraseña: `kompa2go_2kompa12025`
   - ID Único: `2KPAB123`

2. **Proveedor Demo 2**
   - Email: `onlycr@yahoo.com`
   - Contraseña: `kompa2go_2kompa22025`
   - ID Único: `2KPCD456`

3. **Sakura Beauty Salon** (Proveedor Especial)
   - Email: `Marfanar@`
   - Contraseña: `lov3myJob25`
   - ID Único: `2KPSK789`
   - Nota: Este proveedor tiene acceso sin restricciones

### Usuarios Clientes (Mi-Kompa)
1. **Cliente Demo 1**
   - Email: `agostounonueve@gmail.com`
   - Contraseña: `kompa2go_mikompa12025`
   - ID Único: `MKPXY123`

2. **Cliente Demo 2**
   - Email: `onlycr@yahoo.com`
   - Contraseña: `kompa2go_mikompa22025`
   - ID Único: `MKPZW456`

## Pasos para Iniciar Sesión

### Opción 1: Inicio de Sesión Directo
1. Abre la aplicación Kompa2Go
2. En la pantalla de autenticación, asegúrate de estar en modo "Iniciar Sesión"
3. Ingresa uno de los correos electrónicos de arriba
4. Ingresa la contraseña correspondiente
5. Presiona el botón "Iniciar Sesión"

### Opción 2: Cambio de Rol
Si ya has iniciado sesión y quieres cambiar de rol (por ejemplo, de Cliente a Proveedor):

1. En la pantalla de inicio de sesión, presiona "Cambiar a Proveedor/Cliente"
2. Selecciona el rol que deseas (Mi-Kompa o 2-Kompa)
3. Ingresa las credenciales correspondientes al rol seleccionado
4. Presiona "Cambiar Rol"

## Solución de Problemas

### Error: "Error al iniciar sesión"
Este error puede ocurrir por varias razones:

1. **Firebase no está autenticado**: 
   - Asegúrate de que Firebase esté configurado correctamente
   - Verifica que las credenciales de Firebase en `lib/firebase.ts` sean correctas

2. **Credenciales incorrectas**:
   - Verifica que el email y la contraseña sean exactamente como se muestran arriba
   - Las contraseñas son sensibles a mayúsculas y minúsculas

3. **Problema de conexión**:
   - Verifica tu conexión a internet
   - Asegúrate de que Firebase esté accesible

### Verificar los Logs
Para ver información detallada sobre el proceso de autenticación, abre la consola del navegador o los logs de la aplicación. Busca mensajes que comiencen con:
- `[Auth]` - Logs de la pantalla de autenticación
- `[FirebaseAuth]` - Logs de Firebase Authentication
- `[AuthContext]` - Logs del contexto de autenticación de la app

### Mensajes de Error Mejorados
Ahora la aplicación muestra mensajes de error más específicos:
- **"Error de Firebase: [mensaje]"** - Indica un problema con Firebase Authentication
- **"Error de aplicación: [mensaje]"** - Indica un problema con la autenticación de la app
- **"Debe autenticarse con Firebase primero"** - Firebase no ha completado la autenticación

## Notas Importantes

1. **Múltiples Roles**: Los emails `agostounonueve@gmail.com` y `onlycr@yahoo.com` pueden usarse con diferentes contraseñas para acceder a diferentes roles (Admin, Proveedor, Cliente)

2. **Primer Inicio de Sesión**: La primera vez que inicies sesión, Firebase puede tardar un poco más en autenticar

3. **Persistencia**: Una vez que inicies sesión, tu sesión se mantendrá incluso si cierras la aplicación

4. **Recuperación de Contraseña**: Si olvidas tu contraseña, puedes usar la opción "¿Olvidó su contraseña?" en la pantalla de inicio de sesión

## Contacto de Soporte

Si continúas teniendo problemas para iniciar sesión después de seguir esta guía, por favor contacta al equipo de soporte con:
- El mensaje de error completo
- Los logs de la consola
- El email que estás intentando usar
