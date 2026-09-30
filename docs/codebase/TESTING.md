# Testing Patterns

## 1) Test Stack and Commands

- Primary framework: Vitest ^3.2.7.
- Assertions/mocking: Vitest `expect`/`vi`; Testing Library React; jest-dom matchers.

```bash
npm run test
npm run test:watch
npm run db:start   # start local Supabase (Docker)
npm run db:test    # pgTAP tests in supabase/tests/database
npm run db:types   # regenerate src/lib/supabase/database.types.ts
```

## 2) Test Layout

- Tests are colocated with source.
- Naming: `*.test.ts(x)`; database tests in `supabase/tests/database/*.test.sql` (pgTAP).
- Global setup: `src/test/setup.ts`, loaded by `vitest.config.ts`.
- jsdom supplies browser DOM behavior.

## 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit/component | yes, limited | redirects, forms, cards, planner modal | Testing Library renders components |
| Integration | via SQL | Supabase RPC/RLS boundary | pgTAP tests per role against local Supabase |
| E2E | no | Login, band, invite and performance flows | No browser test framework/config found |
| SQL/database | yes | Policies, grants and RPC functions | `supabase/tests/database/access_control.test.sql` covers member, planner, admin, owner, outsider, superadmin and anon |

## 4) Mocking and Isolation Strategy

- Module mocking uses `vi.mock`; callback mocks use `vi.fn`.
- Components use `MemoryRouter` where routing context is needed.
- Tests call Testing Library `cleanup()` and reset mutable mocks after cases where needed.
- No Supabase network mocking convention exists because current tests do not cover API modules.
- Common risk: UI tests mock API modules; RLS/RPC behavior is covered by the pgTAP tests instead.

## 5) Coverage and Quality Signals

- Coverage tool and threshold: `[TODO]`; none configured.
- Current reported coverage: `[TODO]`; no coverage output exists.
- CI (`.github/workflows/ci.yml`) runs lint, tests and build on pull requests, plus database tests and a check that generated types match migrations. Deploy runs lint and tests before build.
- Known gaps: auth provider, API modules, invite flows and full end-to-end user flows.

## 6) Evidence

- `vitest.config.ts`
- `src/test/setup.ts`
- `src/app/HomeRedirect.test.tsx`
- `src/features/performances/components/PerformanceForm.test.tsx`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-pages.yml`
- `supabase/tests/database/access_control.test.sql`
- `package.json`
