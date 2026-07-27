# CODEX_RESULT

## Gewijzigde bestanden
- `src/app/HomeRedirect.tsx`
- `src/app/router.tsx`
- `src/features/auth/pages/LoginPage.tsx`
- `src/features/auth/pages/OtpPage.tsx`
- `src/features/auth/pages/AuthCallbackPage.tsx`
- `src/features/profile/pages/ProfileSetupPage.tsx`
- `src/features/profile/pages/ProfilePage.tsx`
- `src/features/bands/pages/BandSwitcherPage.tsx`
- `src/features/bands/pages/BandSettingsPage.tsx`
- `src/features/bands/api/instruments.ts`
- `src/features/members/pages/MembersPage.tsx`
- `src/features/performances/components/PlannerOverviewModal.tsx`
- `src/features/performances/components/ResponseAccordion.tsx`
- `src/features/performances/components/MemberCard.tsx`
- `src/features/performances/components/InstrumentCard.tsx`
- `src/features/performances/components/StatCard.tsx`
- `src/features/performances/components/PerformanceForm.tsx`
- `src/features/performances/pages/PerformanceCreatePage.tsx`
- `src/features/performances/pages/PerformanceDetailPage.tsx`
- `src/features/performances/pages/PerformanceEditPage.tsx`
- `src/features/invites/api/invites.ts`
- `src/index.css`
- `vite.config.ts`
- `index.html`

## Verwijderde bestanden
- `src/features/performances/components/StickyFooter.tsx`
- `src/components/FeaturePlaceholder.tsx`
- `src/components/StatCard.tsx`
- `src/features/performances/pages/PlannerOverviewPage.tsx`
- `src/assets/react.svg`
- `src/assets/vite.svg`
- `src/assets/hero.png`
- `src/features/invites/pages/InvitesPage.tsx`

## Nieuwe migraties
- `supabase/migrations/202607270001_single_current_band_invite.sql`
- `supabase/migrations/202607270002_band_instruments.sql`

## UX-wijzigingen
- planner-overlay opgeschoond en interactieve statistiekkaarten toegevoegd
- dubbele profielinformatie verwijderd
- verwijderen van optreden alleen nog via bewerkscherm
- home redirect op actieve kapel/geen kapel
- bands-pagina verduidelijkt naar overzichtspagina
- ledenkaarten compacter gemaakt
- optredendetail compacter gemaakt
- create/edit performance form vereenvoudigd
- loginflow hernoemd naar inloglink
- ongebruikte planner/placeholder/assets verwijderd
- kapelgebonden instrumenten toegevoegd in kapelinstellingen en profielselectie

## Resultaat lint
- `npm run lint` slaagt
- bestaande warning blijft aanwezig in `scripts/convert-band-bundle.mjs` voor ongebruikte functie `scheduleIdToFileKey`

## Toegevoegde tests
- `src/app/HomeRedirect.test.tsx`
- `src/features/performances/components/MemberCard.test.tsx`
- `src/features/performances/components/PerformanceForm.test.tsx`
- `src/features/performances/components/PlannerOverviewModal.test.tsx`
- `src/test/setup.ts`
- `vitest.config.ts`

## Resultaat tests
- `npm run test` slaagt
- 4 testbestanden, 12 tests geslaagd

## Resultaat build
- `npm run build` slaagt

## Afwijkingen / blokkades
- handmatige viewportcontrole niet uitgevoerd in deze omgeving
- bestaande lint-warning blijft aanwezig in `scripts/convert-band-bundle.mjs`
