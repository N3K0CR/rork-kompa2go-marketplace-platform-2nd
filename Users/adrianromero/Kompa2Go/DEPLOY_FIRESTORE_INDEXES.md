# 🔥 Desplegar Índices de Firestore

## Error Actual

```
❌ Error loading pending kommuters: FirebaseError: [code=failed-precondition]: 
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

## Solución

El índice ya está definido en `firestore.indexes.json`, solo necesitas desplegarlo a Firebase.

### Opción 1: Despliegue Completo (Recomendado)

Despliega tanto las reglas como los índices:

```bash
cd /Users/adrianromero/Kompa2Go
chmod +x deploy-firestore-complete.sh
./deploy-firestore-complete.sh
```

### Opción 2: Solo Índices

Si solo quieres desplegar los índices:

```bash
cd /Users/adrianromero/Kompa2Go
firebase deploy --only firestore:indexes
```

### Opción 3: Desde Firebase Console

1. Ve a: https://console.firebase.google.com/project/kompa2go/firestore/indexes
2. Haz clic en el enlace del error que te proporciona Firebase
3. Esto creará automáticamente el índice necesario

## Verificación

Después del despliegue:

1. Espera 2-3 minutos para que los índices se activen
2. Recarga tu aplicación
3. El error debería desaparecer

## Índices Incluidos

El archivo `firestore.indexes.json` incluye todos los índices necesarios para:

- ✅ Kommuters (status + createdAt)
- ✅ Kommute Wallet (recargas, transacciones, distribuciones)
- ✅ Alertas y tracking
- ✅ Chats y mensajes
- ✅ Calificaciones
- ✅ Centro de ayuda
- ✅ Emergencias
- ✅ Solicitudes de servicio
- ✅ Y más...

## Notas Importantes

- Los índices pueden tardar unos minutos en estar completamente activos
- Una vez desplegados, no necesitas volver a desplegarlos a menos que agregues nuevos índices
- Puedes verificar el estado en Firebase Console
