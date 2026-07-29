# Codebase Concerns

## 1) Top Risks

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| high | Database authorization and RPC behavior lack automated tests | `supabase/migrations/`, only four `*.test.tsx` files | Permission regressions can expose or block band data | Add Supabase-backed RLS/RPC integration tests |
| high | Deploy workflow skips lint and tests | `.github/workflows/deploy-pages.yml` | `main` can deploy behavior not covered by build/typecheck | Run `npm run lint` and `npm run test` before build/deploy |
| high | npm audit reports two high production findings in `react-router-dom`/`react-router` | `npm audit --omit=dev --json` terminal result, 2026-07-29 | Advisory affects RSC action execution; this repository is a browser SPA, so applicability needs confirmation | Track advisory, verify SPA exposure, upgrade to patched compatible release when available |
| medium | Raw Supabase/PostgreSQL errors often reach UI | pages use `error.message` directly | Internal schema/policy details may leak; messages are inconsistent | Map known errors to user-safe messages; log sanitized diagnostics |
| medium | Handwritten database result types use casts | `src/features/*/api/` | Migration/client drift remains invisible to TypeScript | Generate Supabase types and use them in client/RPC calls |
| medium | Large UI modules mix responsibilities | `PlannerOverviewModal.tsx` 503 lines; `BandSettingsPage.tsx` 466 lines | Harder review, testing and safe modification | Extract focused hooks/sections when next changed |

## 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| Duplicated role checks | Page-level action hiding implemented locally | `src/lib/roles.ts`, `src/features/performances/pages/PerformanceEditPage.tsx`, `src/features/bands/pages/BandSwitcherPage.tsx` | UI permissions can diverge between screens | Reuse shared helpers while keeping RLS authoritative |
| Installed React SWC plugin unused | Vite imports regular React plugin | `package.json`, `vite.config.ts` | Extra dependency maintenance | Remove it or switch config intentionally |
| No explicit formatter or strict mode | Repository config omits both | `tsconfig.app.json`, no formatter config | Style and type rigor depend on manual discipline | Decide formatter and whether to enable `strict` incrementally |

## 3) Security Concerns

| Risk | OWASP category | Evidence | Current mitigation | Gap |
|------|----------------|----------|--------------------|-----|
| Untested object/role authorization | A01 Broken Access Control | RLS/RPC migrations; no DB tests | RLS, role helpers, auth checks in RPCs | Automated cross-role denial/allowance tests |
| Backend error detail exposed | A05 Security Misconfiguration | multiple pages render `error.message` | Some fallback Dutch messages | Central safe error mapping and sanitized diagnostics |
| `security definer` surface needs regression checks | A01 Broken Access Control | many RPC migrations use fixed `search_path` and internal checks | Fixed search paths and explicit permission checks found | No automated function privilege/authorization test suite |
| Dependency advisories | A06 Vulnerable and Outdated Components | npm audit: 10 high total, 2 in production dependency tree | Lockfile pins versions; reported React Router issue concerns RSC mode not used in inspected SPA code | Confirm applicability and update dependencies without forced breaking audit fix |
| Browser credentials could be misunderstood as secret | N/A | `.env.example`, `src/lib/supabase/client.ts` | Only anon key and URL; no backend key found | Document that `VITE_*` values are public and RLS is mandatory |

## 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|-------------|-----------------------|
| Planner overview aggregates JSON in one RPC | `supabase/migrations/202607280001_performance_overview_member_access.sql` | No measured issue | Large bands return member arrays and counts in one payload | Measure payload/latency; paginate member details if bands grow |
| Main production chunk exceeds Vite warning threshold | `npm run build`: 544.28 kB minified, 158.57 kB gzip | Build warns for chunk larger than 500 kB | Initial download/parse cost can grow | Inspect bundle composition; split large shared dependencies if measured startup warrants it |
| Broad app stylesheet is high-churn and 51.9 KB | scan metrics; `src/index.css` | 35 changes in 90-day scan | Global selector coupling and CSS growth | Split only along stable component/feature boundaries |
| No performance monitoring/tests | scan found no performance configs | No baseline available | Regressions remain invisible | Add lightweight bundle-size and key-flow timing checks |

## 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|-------------|----------------------|
| `src/index.css` | Large global styling surface | 35 commits in 90 days | Visual regression check on mobile and desktop |
| `src/app/layouts/AppLayout.tsx` | Navigation, install UI, band switcher and permission visibility | 16 commits | Test navigation per role and PWA states |
| `src/features/performances/` pages | Core flow and permission-sensitive actions | detail 14; list 12 commits | Run component tests; verify member/planner/admin roles |
| `BandSettingsPage.tsx` / `MembersPage.tsx` | Large admin mutations and role rules | 11 / 10 commits | Keep SQL checks authoritative; test owner/superadmin edge cases |

## 6) `[ASK USER]` Questions

1. [ASK USER] Welke test-coveragegrens moet officieel gelden?

## 7) Intent vs. Reality

Geen bekende afwijkingen na actualisatie op 2026-07-29. Invitebeheer onder `band`, migratieoverzicht, Node 26 en Actions secret-configuratie zijn gelijkgetrokken met gekozen projectintentie.

## 8) Evidence

- `docs/migratie-backlog.md`
- `.github/workflows/deploy-pages.yml`
- `src/features/admin/pages/AdminPage.tsx`
- `src/features/bands/pages/BandSettingsPage.tsx`
- `src/features/performances/components/PlannerOverviewModal.tsx`
- `supabase/migrations/202607260012_superadmin_and_member_visibility.sql`
- Git history scan from `git log --since='90 days ago'`
- `npm audit --json` and `npm audit --omit=dev --json` terminal results from 2026-07-29
- `npm run build` terminal result from 2026-07-29
