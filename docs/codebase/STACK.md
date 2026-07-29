# Technology Stack

## 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | TypeScript 6.0.2; TSX for React UI | `package.json`, `tsconfig.app.json` |
| Runtime + version | Browser runtime; Node.js 26 for local tooling and deployment CI | `.nvmrc`, `package.json`, `.github/workflows/deploy-pages.yml`, `index.html` |
| Package manager | npm with lockfile v3 | `package-lock.json` |
| Module/build system | ESM, TypeScript project references, Vite 8.1.1 | `package.json`, `tsconfig.json`, `vite.config.ts` |

## 2) Production Frameworks and Dependencies

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| React / React DOM | ^19.2.7 | Component UI and browser rendering | `package.json`, `src/main.tsx` |
| React Router DOM | ^7.18.1 | Browser routing and route guards | `package.json`, `src/app/router.tsx` |
| Supabase JS | ^2.110.8 | Auth, PostgreSQL table access and RPC calls | `package.json`, `src/lib/supabase/client.ts` |
| TanStack React Query | ^5.101.4 | Server-state queries, cache and invalidation | `package.json`, `src/app/providers/AppProviders.tsx` |

PostgreSQL schema, constraints, RLS policies and RPC functions live in `supabase/migrations/`.

## 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| TypeScript ~6.0.2 | Type checking during build | `package.json`, `tsconfig.app.json` |
| Vite ^8.1.1 | Dev server and production bundle | `package.json`, `vite.config.ts` |
| @vitejs/plugin-react ^6.0.3 | React integration used by Vite | `package.json`, `vite.config.ts` |
| @vitejs/plugin-react-swc ^4.3.2 | Installed alternative React compiler plugin; no config import found | `package.json`, `vite.config.ts` |
| vite-plugin-pwa ^1.3.0 | Manifest and auto-update service worker | `package.json`, `vite.config.ts`, `src/main.tsx` |
| Vitest ^3.2.7 | Test runner | `package.json`, `vitest.config.ts` |
| @testing-library/react ^16.3.2 | React component tests | `package.json`, `src/app/HomeRedirect.test.tsx` |
| @testing-library/jest-dom ^7.0.0 | DOM matchers | `package.json`, `src/test/setup.ts` |
| jsdom ^27.0.1 | Browser-like test environment | `package.json`, `vitest.config.ts` |
| Oxlint ^1.71.0 | Linting | `package.json`, `.oxlintrc.json` |
| @types/node ^24.13.2 | Node.js types for build config | `package.json`, `tsconfig.node.json` |
| @types/react ^19.2.17 | React TypeScript declarations | `package.json` |
| @types/react-dom ^19.2.3 | React DOM TypeScript declarations | `package.json` |

## 4) Key Commands

```bash
npm ci
npm run build
npm run test
npm run lint
```

Other scripts: `npm run dev`, `npm run preview`, `npm run test:watch`.

## 5) Environment and Config

- Config sources: `.env.example`, Vite environment variables, `vite.config.ts`, `vitest.config.ts`, TypeScript configs.
- Required variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Only public Supabase client configuration enters frontend builds; no backend `service_role` key is referenced.
- GitHub Pages deploy uses Node.js 26, `npm ci`, `npm run build`, `dist/`, and a copied `dist/404.html` SPA fallback.
- No container configuration exists.

## 6) Evidence

- `package.json`
- `package-lock.json`
- `.nvmrc`
- `tsconfig.app.json`
- `vite.config.ts`
- `.github/workflows/deploy-pages.yml`
- `.env.example`
