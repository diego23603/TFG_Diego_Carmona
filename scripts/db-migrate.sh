#!/bin/bash

# Crear directorio para migraciones si no existe
mkdir -p drizzle

# Generar migraciones
echo "Generando migraciones..."
npx drizzle-kit generate

# Aplicar migraciones
echo "Aplicando migraciones..."
npx tsx migrate.ts

echo "Migración completada."