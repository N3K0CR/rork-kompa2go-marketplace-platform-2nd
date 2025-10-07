# 🔧 Solución al Error 502 - Backend No Responde

## 🎯 Problema
El error 502 indica que el backend en `http://localhost:8082` no está respondiendo a las peticiones del frontend.

## 📍 ¿Dónde ejecutar los scripts?

**IMPORTANTE**: Debes ejecutar estos scripts en la **terminal de tu proyecto**, en la raíz del directorio `Kompa2Go`.

```bash
# Asegúrate de estar en la raíz del proyecto
cd /ruta/a/tu/proyecto/Kompa2Go

# Verifica que estás en el lugar correcto
ls -la | grep "package.json"
```

## 🔍 Paso 1: Diagnosticar el Problema

```bash
# Dale permisos de ejecución al script
chmod +x diagnose-backend.sh

# Ejecuta el diagnóstico
./diagnose-backend.sh
```

Este script te dirá:
- ✅ Si el backend está corriendo en el puerto 8082
- ✅ Si el frontend está corriendo en el puerto 8081
- ✅ Qué procesos están activos
- ✅ Configuración de variables de entorno

## 🔧 Paso 2: Solucionar el Problema

### Opción A: Script Automático (Recomendado)

```bash
# Dale permisos de ejecución
chmod +x fix-backend-connection.sh

# Ejecuta el script de solución
./fix-backend-connection.sh
```

Este script:
1. Detiene cualquier proceso en el puerto 8082
2. Verifica que el puerto esté libre
3. Inicia el backend correctamente con tunnel

### Opción B: Manual

Si el script no funciona, hazlo manualmente:

```bash
# 1. Detener procesos en puerto 8082
lsof -ti:8082 | xargs kill -9

# 2. Esperar 2 segundos
sleep 2

# 3. Iniciar el backend
bunx rork start -p z5be445fq2fb0yuu32aht --api --tunnel
```

## 📋 Configuración de Terminales

Para que todo funcione correctamente, necesitas **2 terminales abiertas**:

### Terminal 1: Frontend (Puerto 8081)
```bash
cd /ruta/a/tu/proyecto/Kompa2Go
bun start
# o
bunx rork start -p z5be445fq2fb0yuu32aht --tunnel
```

### Terminal 2: Backend (Puerto 8082)
```bash
cd /ruta/a/tu/proyecto/Kompa2Go
./fix-backend-connection.sh
# o manualmente:
bunx rork start -p z5be445fq2fb0yuu32aht --api --tunnel
```

## ✅ Verificar que Funciona

Después de iniciar el backend, verifica que responde:

```bash
# En otra terminal, prueba el endpoint de salud
curl http://localhost:8082/api/

# Deberías ver algo como:
# {"status":"ok","message":"API is running"}
```

## 🐛 Si Aún No Funciona

1. **Verifica los logs del backend**: Busca errores en la terminal donde corre el backend

2. **Verifica la configuración**:
   ```bash
   cat .env.local | grep EXPO_PUBLIC_RORK_API_BASE_URL
   # Debe mostrar: EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8082
   ```

3. **Reinicia ambos servicios**:
   ```bash
   # Detén todo
   lsof -ti:8081 | xargs kill -9
   lsof -ti:8082 | xargs kill -9
   
   # Espera 3 segundos
   sleep 3
   
   # Inicia backend primero
   bunx rork start -p z5be445fq2fb0yuu32aht --api --tunnel &
   
   # Espera 5 segundos
   sleep 5
   
   # Inicia frontend
   bunx rork start -p z5be445fq2fb0yuu32aht --tunnel
   ```

4. **Verifica que no haya problemas de firewall**: Asegúrate de que los puertos 8081 y 8082 no estén bloqueados

## 📝 Notas Importantes

- ⚠️ El backend DEBE estar corriendo en el puerto 8082
- ⚠️ El frontend corre en el puerto 8081
- ⚠️ Ambos procesos deben estar activos simultáneamente
- ⚠️ No cierres las terminales donde corren estos procesos
- ⚠️ Si usas tunnel, asegúrate de que esté activo y funcionando

## 🆘 Ayuda Adicional

Si después de seguir estos pasos aún tienes problemas:

1. Ejecuta el diagnóstico completo:
   ```bash
   ./diagnose-backend.sh > diagnostico.txt
   cat diagnostico.txt
   ```

2. Verifica los logs de ambos servicios

3. Asegúrate de que no haya otros servicios usando los puertos 8081 o 8082
