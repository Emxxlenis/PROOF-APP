# Tests - PROOF

Este directorio contiene todos los scripts y tests para verificar que la aplicación funciona correctamente, especialmente el manejo de proyectos y el aislamiento de datos.

## 📁 Estructura

```
tests/
├── e2e/                          # Tests end-to-end con Playwright
│   └── project-isolation.spec.ts
├── unit/                         # Tests unitarios
│   └── useSelectedProject.test.ts
├── scripts/                      # Scripts de verificación
│   └── verify-project-isolation.js
├── playwright.config.ts          # Configuración de Playwright
└── README.md                     # Este archivo
```

## 🚀 Inicio Rápido

### 1. Verificación Rápida (Sin Base de Datos)

Ejecuta una verificación rápida del código sin necesidad de base de datos:

```bash
npm run test:quick
```

Este script verifica:
- ✅ Que `useSelectedProject` existe y tiene todas las funciones
- ✅ Que las páginas principales usan el hook
- ✅ Que las consultas filtran por `startup_id`
- ✅ Que la migración de `coach_interactions` existe
- ✅ Que el selector de proyecto está en el layout

### 2. Verificación de Base de Datos

Verifica que los datos en la base de datos están correctamente aislados por proyecto:

```bash
npm run test:verify
```

**Requisitos:**
- Node.js instalado
- Variables de entorno en `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Nota:** Este script puede mostrar advertencias sobre:
- Valores inválidos en enums (ej: `user_role` con valor "editor") - indica datos corruptos que deben limpiarse manualmente
- Columnas que no existen (ya corregido en el script)

### 3. Script de Verificación de Base de Datos (Alternativo)

Verifica que los datos en la base de datos están correctamente aislados por proyecto:

```bash
node tests/scripts/verify-project-isolation.js
```

**Requisitos:**
- Node.js instalado
- Variables de entorno en `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Tests E2E con Playwright

**⚠️ IMPORTANTE:** Los tests E2E actualmente requieren autenticación manual. Los tests están diseñados como plantillas y necesitan ser completados con:
- Configuración de autenticación (login automático o tokens)
- Selectores actualizados para coincidir con la UI actual
- Datos de prueba configurados

**Instalación:**

```bash
npm install -D @playwright/test
npx playwright install
```

**Ejecutar tests:**

```bash
# Todos los tests
npm run test:e2e

# Con UI interactiva
npm run test:e2e:ui

# Un archivo específico
npx playwright test tests/e2e/project-isolation.spec.ts

# Modo debug
npx playwright test --debug
```

**Nota:** Los tests E2E requieren que la aplicación esté corriendo. Playwright la iniciará automáticamente si está configurado en `playwright.config.ts`.

**Estado actual:** Los tests E2E están como plantillas y fallan porque:
- Requieren autenticación configurada (actualmente no implementada)
- Los selectores necesitan actualizarse para coincidir con la UI actual
- Necesitan datos de prueba configurados

Para usar estos tests en producción, necesitarás:
1. Implementar autenticación en `test.beforeAll`
2. Actualizar los selectores para coincidir con tu UI
3. Configurar datos de prueba o usar fixtures

### 5. Tests unitarios

**Instalación:**

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/react-hooks jest-environment-jsdom
```

**Ejecutar tests:**

```bash
# Todos los tests
npm test

# Modo watch
npm run test:watch

# Con cobertura
npm test -- --coverage
```

## ✅ Checklist de Verificación

### Funcionalidades Críticas

- [x] **Gestión de Proyectos**
  - Crear, seleccionar, eliminar proyectos
  - Selector de proyecto en sidebar
  - Persistencia en localStorage

- [x] **Aislamiento de Datos**
  - Dashboard muestra datos del proyecto correcto
  - Estrategia (startup-builder) aislada por proyecto
  - Validación aislada por proyecto
  - Hipótesis aisladas por proyecto
  - Pivots aislados por proyecto
  - OKRs aislados por proyecto
  - Métricas aisladas por proyecto
  - Coach chats aislados por proyecto
  - Validator asocia validaciones al proyecto correcto
  - Pivot Engine asocia análisis al proyecto correcto

- [x] **Sincronización**
  - Cambios de proyecto se sincronizan entre pestañas
  - Eventos `storage` y `project-selected` funcionan

- [x] **Integridad de Datos**
  - Todas las tablas tienen `startup_id` cuando corresponde
  - No hay datos huérfanos
  - Las relaciones están correctas

## 🔍 Verificaciones Específicas

### Aislamiento de Coach Chats

Verifica que los chats del coach están aislados por proyecto:

```sql
-- Verificar que todas las interacciones tienen startup_id
SELECT COUNT(*) FROM coach_interactions WHERE startup_id IS NULL;

-- Verificar que los chats están correctamente asociados
SELECT 
  ci.id,
  ci.startup_id,
  s.name as startup_name,
  ci.agent_type,
  ci.created_at
FROM coach_interactions ci
LEFT JOIN startups s ON s.id = ci.startup_id
ORDER BY ci.created_at DESC
LIMIT 10;
```

### Verificación de Datos por Proyecto

```sql
-- Contar datos por proyecto
SELECT 
  s.id,
  s.name,
  (SELECT COUNT(*) FROM okrs WHERE startup_id = s.id) as okr_count,
  (SELECT COUNT(*) FROM validations WHERE startup_id = s.id) as validation_count,
  (SELECT COUNT(*) FROM hypotheses WHERE startup_id = s.id) as hypothesis_count,
  (SELECT COUNT(*) FROM pivot_analysis WHERE startup_id = s.id) as pivot_count,
  (SELECT COUNT(*) FROM coach_interactions WHERE startup_id = s.id) as chat_count
FROM startups s
ORDER BY s.created_at DESC;
```

## 🐛 Troubleshooting

### Los datos se mezclan entre proyectos

1. Verifica que todas las consultas usan `.eq('startup_id', startupId)`
2. Verifica que `useSelectedProject` está siendo usado en todas las páginas
3. Verifica que los datos se limpian al cambiar de proyecto
4. Ejecuta el script de verificación: `node tests/scripts/verify-project-isolation.js`

### El selector de proyecto no funciona

1. Verifica que `localStorage` tiene `selected_project_id`
2. Verifica que los eventos `project-selected` se disparan
3. Verifica la consola del navegador por errores

### Los datos no se sincronizan entre pestañas

1. Verifica que los listeners de `storage` están activos
2. Verifica que los eventos `project-selected` se disparan correctamente
3. Verifica que `useSelectedProject` escucha ambos eventos

## 📝 Notas

- Los tests E2E requieren autenticación. Ajusta los tests según tu flujo de autenticación.
- El script de verificación de base de datos requiere acceso a Supabase.
- Los tests unitarios pueden necesitar mocks adicionales según tu configuración.

## 🔄 Actualización de Tests

Cuando agregues nuevas funcionalidades:

1. Agrega tests E2E si es una funcionalidad crítica
2. Agrega tests unitarios para funciones nuevas
3. Actualiza el script de verificación si hay nuevas tablas
