# Codebase Structure

## 1) Top-Level Map

| Path | Purpose | Evidence |
|------|---------|----------|
| `src/` | React application source, shared UI, features and tests | `src/main.tsx`, `src/app/router.tsx` |
| `supabase/migrations/` | Ordered PostgreSQL schema, RLS, helper and RPC migrations | `supabase/migrations/202607260002_initial_schema.sql` |
| `public/` | PWA icons, logo and static SVG assets | `vite.config.ts`, `public/icons.svg` |
| `.github/workflows/` | GitHub Pages build and deployment | `.github/workflows/deploy-pages.yml` |
| `docs/` | Migration backlog and generated codebase map | `docs/migratie-backlog.md`, `docs/codebase/` |
| `index.html` | Browser HTML shell loading `src/main.tsx` | `index.html` |
| `package.json` | npm dependencies and lifecycle commands | `package.json` |
| `.nvmrc` | Node.js 26 toolchain selection | `.nvmrc` |
| `vite.config.ts` | React and PWA build configuration | `vite.config.ts` |

Generated `dist/` and dependency `node_modules/` directories are not source.

## 2) Entry Points

- Main runtime entry: `src/main.tsx`, selected by module script in `index.html`.
- Application root: `src/App.tsx`.
- Router entry: `src/app/router.tsx`.
- Database evolution entry points: ordered SQL files in `supabase/migrations/`.
- Secondary worker/CLI/job entry points: none found.
- Service worker code is generated/configured by `vite-plugin-pwa`; registration occurs in `src/main.tsx`.

## 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|----------|-------------------|------------------------|
| `src/app/` | Composition, layouts, providers, router and route guards | Feature-specific Supabase operations |
| `src/components/` | Reusable presentation components | Band/performance business flows |
| `src/features/<feature>/pages/` | Route-level UI and mutations orchestration | SQL authorization rules |
| `src/features/<feature>/api/` | Typed Supabase table/RPC calls | Reusable visual components |
| `src/features/<feature>/providers/` | Cross-page feature state | Database authorization |
| `src/lib/` | Shared Supabase client, roles and install prompt helpers | Route-level screens |
| `supabase/migrations/` | Schema, constraints, RLS and privileged RPC logic | Browser UI behavior |

## 4) Naming and Organization Rules

- Component/page files use PascalCase: `AppLayout.tsx`, `PerformanceDetailPage.tsx`.
- API, hook and utility modules use lowercase camelCase: `performances.ts`, `useBand.ts`, `roles.ts`.
- Directories organize first by app infrastructure, shared components, then business feature.
- Imports use relative paths. No TypeScript path alias is configured.
- Tests are colocated with tested source and use `*.test.tsx`.

## 5) Evidence

- `index.html`
- `src/main.tsx`
- `src/app/router.tsx`
- `src/features/performances/api/performances.ts`
- `supabase/migrations/202607260002_initial_schema.sql`
