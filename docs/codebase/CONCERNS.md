# Codebase Concerns

## 1) Top Risks

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| medium | Database tests cover roles broadly but not every RPC edge case | `supabase/tests/database/access_control.test.sql` | Regressions in less-tested RPC's stay possible | Extend pgTAP tests when RPC's change |
| medium | JSON-returning RPC's still use handwritten result types | `src/features/performances/api/performances.ts`, `src/features/invites/api/invites.ts` | Shape drift in `jsonb` results is not caught by generated types | Add runtime checks or tests when RPC output changes |

## 2) Technical Debt

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| No explicit formatter or strict mode | Repository config omits both | `tsconfig.app.json`, no formatter config | Style and type rigor depend on manual discipline | Decide formatter and whether to enable `strict` incrementally |
| Global stylesheet | Most styles still live in `src/index.css` | `src/index.css` | Selector coupling | Move styles next to components when they change |
| Manifest screenshots missing | Needs real app captures | `vite.config.ts` | Simpler Android install dialog | Add `screenshots` once captures exist |

## 2a) Resolved on 2026-09-30

- Any logged-in user could set `profiles.is_superadmin` on their own row; fixed by `202609300001_restrict_profile_columns.sql` and covered by pgTAP.
- CI runs lint, tests, build and database tests (`.github/workflows/ci.yml`); deploy runs lint and tests.
- React Router advisory resolved by upgrading to `react-router-dom` ^7.18.4 (`npm audit --omit=dev` clean).
- Raw backend errors are mapped via `src/lib/errors.ts`.
- Supabase types are generated (`npm run db:types`) into `src/lib/supabase/database.types.ts`.
- Large components split; main bundle below 500 kB through vendor chunks and a lazy planner overview.

## 3) Security Concerns

| Risk | OWASP category | Evidence | Current mitigation | Gap |
|------|----------------|----------|--------------------|-----|
| Object/role authorization | A01 Broken Access Control | RLS/RPC migrations | RLS, role helpers, auth checks in RPCs, pgTAP role tests | Not every RPC edge case is tested |
| Backend error detail exposed | A05 Security Misconfiguration | `src/lib/errors.ts` | Known errors mapped to Dutch; unknown details only logged | Keep mapping up to date for new RPC errors |
| `security definer` surface needs regression checks | A01 Broken Access Control | many RPC migrations use fixed `search_path` and internal checks | Fixed search paths and explicit permission checks found | No automated function privilege/authorization test suite |
| Dependency advisories | A06 Vulnerable and Outdated Components | `npm audit --omit=dev` | No production findings on 2026-09-30 | Re-run audit on dependency updates |
| Browser credentials could be misunderstood as secret | N/A | `.env.example`, `src/lib/supabase/client.ts` | Only anon key and URL; no backend key found | Document that `VITE_*` values are public and RLS is mandatory |

## 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|-------------|-----------------------|
| Planner overview aggregates JSON in one RPC | `supabase/migrations/202607310002_performance_overview_membership_access.sql` | No measured issue | Large bands return member arrays and counts in one payload | Measure payload/latency; paginate member details if bands grow |
| Broad app stylesheet | `src/index.css` (~1,750 lines) | Dead CSS removed on 2026-09-30 | Global selector coupling | Split along component/feature boundaries |
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
