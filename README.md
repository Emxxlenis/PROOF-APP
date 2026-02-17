# Proof Platform

**Plataforma web para validación de ideas y gestión de proyectos de emprendimiento.**  
**Web platform for startup idea validation and project management.**

---

## Español

### Descripción

Aplicación full-stack construida con Next.js que permite validar ideas de negocio, gestionar proyectos y obtener feedback asistido por IA. Este repositorio es una versión de portafolio: la estructura, patrones y calidad del código son representativos del proyecto; la lógica de negocio propietaria y la configuración sensible no están incluidas (véase [SECURITY-CHANGES.md](SECURITY-CHANGES.md)).

### Stack tecnológico

| Área | Tecnología |
|------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Radix UI |
| Backend | Next.js API Routes |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth |
| IA | Google Gemini API |
| Despliegue | Vercel |

### Requisitos

- Node.js 18+
- npm o yarn
- Proyecto en [Supabase](https://supabase.com)
- API Key de Google Gemini (opcional, para funcionalidades con IA)

### Instalación

```bash
git clone <repository-url>
cd MVP-Makers-public

npm install
cp env.example .env.local
# Editar .env.local con tus credenciales

npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

### Variables de entorno

Consultar `env.example` para la lista completa. Mínimas para arrancar:

- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Clave anónima (pública)
- `GOOGLE_GEMINI_API_KEY` — Opcional; para validación y coaching con IA

### Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run analyze` | Análisis de bundle |
| `npm run test:e2e` | Tests E2E (Playwright) |

### Estructura del proyecto

```
├── app/                 # Next.js App Router
│   ├── api/             # API Routes
│   ├── dashboard/       # Área privada
│   ├── auth/            # Autenticación
│   └── ...
├── components/          # Componentes React
├── lib/                 # Servicios, utilidades, prompts (placeholders)
├── types/               # Tipos TypeScript
└── tests/               # Tests E2E y scripts de verificación
```

La configuración de base de datos (schema y migraciones) no está incluida en este repositorio. Para producción es necesario configurar Supabase y aplicar las migraciones correspondientes en tu propio proyecto.

### Despliegue (Vercel)

1. Conectar el repositorio en [Vercel](https://vercel.com).
2. Añadir las variables de entorno indicadas en `env.example`.
3. Desplegar; los pushes a la rama principal pueden configurarse para deploy automático.

### Licencia

MIT. Ver [LICENSE](LICENSE).

---

## English

### Description

Full-stack application built with Next.js for validating business ideas, managing projects, and getting AI-assisted feedback. This repository is a portfolio version: code structure, patterns, and quality are representative of the project; proprietary business logic and sensitive configuration are not included (see [SECURITY-CHANGES.md](SECURITY-CHANGES.md)).

### Tech stack

| Area | Technology |
|------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Radix UI |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Google Gemini API |
| Deployment | Vercel |

### Requirements

- Node.js 18+
- npm or yarn
- [Supabase](https://supabase.com) project
- Google Gemini API key (optional, for AI features)

### Installation

```bash
git clone <repository-url>
cd MVP-Makers-public

npm install
cp env.example .env.local
# Edit .env.local with your credentials

npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Environment variables

See `env.example` for the full list. Minimum to get started:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon (public) key
- `GOOGLE_GEMINI_API_KEY` — Optional; for validation and AI coaching

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run analyze` | Bundle analysis |
| `npm run test:e2e` | E2E tests (Playwright) |

### Project structure

```
├── app/                 # Next.js App Router
│   ├── api/             # API Routes
│   ├── dashboard/       # Private area
│   ├── auth/            # Authentication
│   └── ...
├── components/          # React components
├── lib/                 # Services, utilities, prompts (placeholders)
├── types/               # TypeScript types
└── tests/               # E2E tests and verification scripts
```

Database configuration (schema and migrations) is not included in this repository. For production you need to set up Supabase and run the appropriate migrations in your own project.

### Deployment (Vercel)

1. Connect the repository on [Vercel](https://vercel.com).
2. Add the environment variables listed in `env.example`.
3. Deploy; enable automatic deploys on push to main if desired.

### License

MIT. See [LICENSE](LICENSE).
