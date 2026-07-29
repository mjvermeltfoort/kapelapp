# Testing Patterns

## 1) Test Stack and Commands

- Primary framework: Vitest ^3.2.7.
- Assertions/mocking: Vitest `expect`/`vi`; Testing Library React; jest-dom matchers.

```bash
npm run test
npm run test:watch
# No separate integration/E2E command
# No coverage command
```

## 2) Test Layout

- Tests are colocated with source.
- Naming: `*.test.tsx`.
- Global setup: `src/test/setup.ts`, loaded by `vitest.config.ts`.
- jsdom supplies browser DOM behavior.
- Four test files exist: one router/state component and three performance components.

## 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit/component | yes, limited | redirects, forms, cards, planner modal | Testing Library renders components |
| Integration | no repository evidence | Supabase API/RPC/RLS boundary | No integration config or tests found |
| E2E | no | Login, band, invite and performance flows | No browser test framework/config found |
| SQL/database | no | Constraints, policies and RPC functions | No SQL test harness found |

## 4) Mocking and Isolation Strategy

- Module mocking uses `vi.mock`; callback mocks use `vi.fn`.
- Components use `MemoryRouter` where routing context is needed.
- Tests call Testing Library `cleanup()` and reset mutable mocks after cases where needed.
- No Supabase network mocking convention exists because current tests do not cover API modules.
- Common risk: UI tests can pass while RLS/RPC behavior or handwritten result types drift.

## 5) Coverage and Quality Signals

- Coverage tool and threshold: `[TODO]`; none configured.
- Current reported coverage: `[TODO]`; no coverage output exists.
- Current test result on 2026-07-29: 4 files and 12 tests passed.
- CI deployment runs build only; it does not run `npm run lint` or `npm run test`.
- Known gaps: auth, providers, all API modules, admin/member/invite pages, RLS, RPC, migrations and full user flows.

## 6) Evidence

- `vitest.config.ts`
- `src/test/setup.ts`
- `src/app/HomeRedirect.test.tsx`
- `src/features/performances/components/PerformanceForm.test.tsx`
- `.github/workflows/deploy-pages.yml`
- `package.json`
- `npm run test` terminal result from 2026-07-29
