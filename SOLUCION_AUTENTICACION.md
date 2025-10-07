# Solución al Error de Autenticación de Firebase

## Problema
El error `ERR_CONNECTION_REFUSED` ocurre porque Firebase CLI intenta usar un servidor local (localhost:9005) para completar la autenticación OAuth, pero este servidor no está disponible en tu entorno.

## Solución: Usar Service Account

### Opción 1: Service Account (Recomendado para tu entorno)

1. **Obtener el Service Account Key:**
   ```bash
   # Abre en tu navegador:
   https://console.firebase.google.com/
   ```

2. **En Firebase Console:**
   - Selecciona tu proyecto "Kompa2Go"
   - Ve a ⚙️ Project Settings
   - Pestaña "Service Accounts"
   - Click en "Generate New Private Key"
   - Descarga el archivo JSON

3. **Guardar el archivo:**
   - Guarda el archivo descargado como `firebase-service-account.json`
   - Colócalo en la raíz del proyecto: `/home/user/rork-app/`

4. **Desplegar las reglas:**
   ```bash
   chmod +x deploy-with-service-account.sh && ./deploy-with-service-account.sh
   ```

### Opción 2: Usar Firebase Emulator (Para desarrollo local)

Si solo quieres probar localmente sin desplegar:

```bash
# Instalar firebase-tools
npm install -g firebase-tools

# Iniciar emulador
firebase emulators:start --only firestore
```

### Opción 3: Desplegar desde Firebase Console

1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto
3. Ve a Firestore Database > Rules
4. Copia y pega el contenido de `firestore.rules`
5. Click en "Publish"

## Verificar que las reglas se desplegaron

Después de desplegar, verifica en:
https://console.firebase.google.com/project/kompa2go/firestore/rules

## Notas de Seguridad

⚠️ **IMPORTANTE**: 
- El archivo `firebase-service-account.json` contiene credenciales sensibles
- Ya está en `.gitignore` para evitar subirlo a git
- NO lo compartas públicamente
- Úsalo solo en entornos seguros

## Siguiente Paso

Una vez desplegadas las reglas, necesitarás implementar la autenticación en la app para que los usuarios puedan acceder a Firestore.
