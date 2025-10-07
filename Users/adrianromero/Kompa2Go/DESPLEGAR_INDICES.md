# 🔥 Desplegar Índices de Firestore

## Error que estás viendo:
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

## Solución Rápida (2 opciones):

### Opción 1: Usar el enlace del error (MÁS RÁPIDO)
1. Copia el enlace completo del error
2. Pégalo en tu navegador
3. Haz clic en "Create Index"
4. Espera 2-3 minutos a que se construya

### Opción 2: Desplegar todos los índices automáticamente
```bash
# Dale permisos de ejecución al script
chmod +x deploy-firestore-complete.sh

# Ejecuta el script
./deploy-firestore-complete.sh
```

## ¿Qué hace el script?
1. Verifica que tengas Firebase CLI instalado
2. Verifica que estés autenticado
3. Despliega las reglas de Firestore actualizadas
4. Despliega todos los índices necesarios

## Si no tienes Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
```

## Índices que se crearán:
- ✅ `kommuters` (status + createdAt) - Para cargar kommuters pendientes
- ✅ `kommute_wallet_recharges` (userId + createdAt) - Para historial de recargas
- ✅ `kommute_wallet_recharges` (status + createdAt) - Para recargas pendientes
- ✅ `kommute_wallet_transactions` (userId + createdAt) - Para historial de transacciones
- ✅ `kommute_payment_distributions` (kommuterId + createdAt) - Para pagos a kommuters
- ✅ `kommuter_applications` (status + createdAt) - Para aplicaciones pendientes
- ✅ `alert_tracking` (userId + createdAt) - Para alertas de usuario
- ✅ `alert_tracking` (status + createdAt) - Para alertas activas
- ✅ `system_transactions` (type + createdAt) - Para panel administrativo

## Tiempo de construcción:
- Los índices simples: 1-2 minutos
- Los índices compuestos: 2-5 minutos
- Puedes usar la app mientras se construyen

## Verificar progreso:
https://console.firebase.google.com/project/kompa2go/firestore/indexes

## Notas:
- Solo necesitas hacer esto UNA VEZ
- Los índices se mantienen después del despliegue
- Si agregas nuevas consultas, puede que necesites más índices
