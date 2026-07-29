# Architecture

## 1) Architectural Style

- Primary style: feature-based client application with shared composition infrastructure and a database-enforced backend boundary.
- Classification evidence: browser code is grouped under `src/features/<feature>`, while shared providers/router live in `src/app`; data access is isolated mainly in feature `api/` modules.
- Primary constraints:
  - Authorization must remain in PostgreSQL RLS/RPC, not only browser role checks.
  - Frontend uses public Supabase URL and anon key.
  - UI is a client-rendered, installable PWA deployed as static GitHub Pages files.

## 2) System Flow

```text
index.html -> src/main.tsx -> AppProviders/router -> feature page/hook
-> feature API module -> Supabase Auth/PostgREST/RPC -> PostgreSQL RLS/function
-> React Query cache/state -> rendered UI
```

1. `index.html` loads `src/main.tsx`; startup registers PWA updates and renders React.
2. `AppProviders` creates one Query Client, then nests `AuthProvider` and `BandProvider`.
3. `router.tsx` selects lazy route components and applies auth/profile guards.
4. Pages call feature API functions directly or through React Query hooks.
5. API modules call Supabase Auth, tables or RPC functions and throw returned errors.
6. PostgreSQL constraints, RLS policies and `security definer` RPC checks enforce data rules; results update provider state or React Query cache.

## 3) Layer/Module Responsibilities

| Layer or module | Owns | Must not own | Evidence |
|-----------------|------|--------------|----------|
| Browser bootstrap/router | Startup, provider order, route selection, lazy loading | Database permissions | `src/main.tsx`, `src/app/router.tsx` |
| Providers/hooks | Auth state, active band state, query defaults | Durable authorization | `src/app/providers/AppProviders.tsx`, `src/features/bands/providers/BandProvider.tsx` |
| Feature pages/components | User interaction, local form state, conditional action visibility | Trust boundary for roles | `src/features/admin/pages/AdminPage.tsx`, `src/features/performances/components/PerformanceForm.tsx` |
| Feature API modules | Typed Supabase operations and basic input normalization | UI rendering | `src/features/bands/api/bands.ts`, `src/features/performances/api/performances.ts` |
| PostgreSQL migrations | Data model, validation, authorization, privileged workflows | Browser presentation | `supabase/migrations/202607260002_initial_schema.sql`, `supabase/migrations/202607260012_superadmin_and_member_visibility.sql` |

## 4) Reused Patterns

| Pattern | Where found | Why it exists |
|---------|-------------|---------------|
| Provider composition | `src/app/providers/AppProviders.tsx` | Shares query, auth and active-band state |
| Context + guarded hook | Auth and band providers/hooks | Fails fast outside required provider |
| Feature API adapter | `src/features/*/api/` | Centralizes Supabase calls and return types |
| Query cache | pages/hooks and `BandProvider` | Caches server state and invalidates after mutations |
| Route guard | `RequireAuth`, `RequireGuest` | Controls login/profile navigation |
| Lazy route module | `src/app/routerElements.tsx` | Splits route bundles with Suspense fallback |
| RLS plus RPC authorization | SQL migrations | Enforces permissions below untrusted frontend |

## 5) Known Architectural Risks

- Browser API types are handwritten casts rather than generated database types; schema drift can compile successfully.
- Pages often display raw Supabase/PostgreSQL error messages; database details can reach users.
- UI role checks hide or redirect actions, but are duplicated in several pages; SQL remains authoritative.
- `PlannerOverviewModal.tsx` exceeds 500 lines and mixes data querying, focus handling, modal behavior and presentation.

## 6) Evidence

- `src/main.tsx`
- `src/app/providers/AppProviders.tsx`
- `src/app/router.tsx`
- `src/features/auth/providers/AuthProvider.tsx`
- `src/features/performances/api/performances.ts`
- `supabase/migrations/202607260012_superadmin_and_member_visibility.sql`
