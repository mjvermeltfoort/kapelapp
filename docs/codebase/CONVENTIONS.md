# Coding Conventions

## 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| Files | PascalCase for React components/pages; camelCase/lowercase for hooks, API and utilities | `PerformanceForm.tsx`, `useBand.ts`, `performances.ts` | `src/features/performances/` |
| Functions/methods | camelCase; React components PascalCase | `listBandPerformances`, `AppProviders` | `src/features/performances/api/performances.ts`, `src/app/providers/AppProviders.tsx` |
| Types/interfaces | PascalCase type aliases; no recurring interface convention found | `PerformanceInput`, `BandMembership` | `src/features/performances/api/performances.ts`, `src/features/bands/api/bands.ts` |
| Constants/env vars | Upper snake case for module constants and Vite variables | `PERFORMANCE_SELECT`, `VITE_SUPABASE_URL` | `src/features/performances/api/performances.ts`, `.env.example` |
| SQL | snake_case objects and `p_` parameters | `band_members`, `p_band_id` | `supabase/migrations/202607260002_initial_schema.sql` |

## 2) Formatting and Linting

- Formatter: none configured; `[TODO]` define whether formatting is manual or handled outside repository.
- Linter: Oxlint via `.oxlintrc.json`.
- Explicit rules: `react/rules-of-hooks` is error; `react/only-export-components` is warning.
- TypeScript checks unused locals/parameters, forced module detection, verbatim module syntax and switch fallthrough.
- TypeScript `strict` is not explicitly enabled.
- Commands: `npm run lint`, `npm run build`.

## 3) Import and Module Conventions

- External package imports generally precede relative imports; type imports use `type`.
- Relative imports only; no alias paths configured.
- No barrel export pattern found. Modules import concrete files.
- Semicolons are omitted; trailing commas and single quotes appear consistently in inspected TypeScript.

## 4) Error and Logging Conventions

- API layer throws Supabase errors or explicit session errors.
- Pages/components catch errors and store a user-facing string, frequently using `error.message`.
- Auth bootstrap logs failures with `console.error` plus context text.
- No logging library, structured context schema or redaction policy exists.
- Sensitive-data redaction rules: `[TODO]`.

## 5) Testing Conventions

- Tests are colocated as `*.test.tsx`.
- Vitest `vi.mock` handles module mocking; Testing Library drives DOM behavior.
- `cleanup()` commonly runs in `afterEach`; global jest-dom matchers load from `src/test/setup.ts`.
- Coverage expectation: `[TODO]`; no coverage command or threshold is configured.

## 6) Evidence

- `.oxlintrc.json`
- `tsconfig.app.json`
- `src/features/performances/api/performances.ts`
- `src/features/performances/components/PerformanceForm.test.tsx`
- `src/features/auth/providers/AuthProvider.tsx`
