# AGENTS.md

## Project
- Naam: `kapelapp`
- Doel: PWA voor kapellen en kleine muziekverenigingen
- Stack: React, TypeScript, Vite, Supabase, PostgreSQL

## Belangrijke regels
- Gebruik geen `service_role` of andere geheime backendkeys in frontend.
- Veiligheid via PostgreSQL, RLS en RPC's; niet client-side afdwingen.
- Houd UI compact, mobielvriendelijk en app-achtig.
- Voeg geen onnodige abstrahering of comments toe.
- Verberg acties waar gebruiker geen rechten voor heeft.

## Huidige UI-keuzes
- Header bevat logo en actieve kapel.
- Kapelwissel zit onder logo in header.
- Hoofdmenu onderin gebruikt iconen: Optredens, Beheer (alleen admin/owner) en Profiel.
- Adminfuncties zitten onder `/admin` met tabs:
  - `band`
  - `members`
- Invitebeheer zit onder de admin-tab `band`.
- Instrumentbeheer zit op profielpagina bij actieve kapel.
- Optredens tonen tabs Komend/Afgelopen; onbeantwoorde optredens eerst, met snel Ja/Nee reageren.
- Nieuw optreden via zwevende knop boven hoofdmenu.
- Rollen tonen in het Nederlands via `formatRoleLabel` (Lid, Planner, Beheerder, Eigenaar).
- Foutmeldingen via `getErrorMessage`; toon nooit ruwe `error.message`.
- Donkere modus via `prefers-color-scheme` op CSS-variabelen; gebruik variabelen i.p.v. vaste kleuren.
- PWA toont melding bij nieuwe versie ("Herladen") en offline-banner.

## Routing
- Login callback: `/auth/callback`
- Profiel: `/profile`
- Optredens: `/performances` (`?view=past` voor afgelopen)
- Kapellen kiezen/aanmaken: `/bands`
- Admin: `/admin?tab=band|members`
- GitHub Pages gebruikt SPA fallback via `404.html`.

## Ontwikkelcommando's
- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run db:start` en `npm run db:test` (lokale Supabase, pgTAP-tests)
- `npm run db:types` (Supabase-types opnieuw genereren na schemawijziging)

## Runtime
- Gebruik Node.js 26, vastgelegd in `.nvmrc` en `package.json`.

## Deploy
- GitHub Pages via GitHub Actions workflow; draait lint, tests en build.
- Pull requests draaien `.github/workflows/ci.yml` (app + databasetests).
- Build output komt uit `dist/`.
- Vereiste Actions-configuratie:
  - variabele `VITE_SUPABASE_URL`
  - secret `VITE_SUPABASE_ANON_KEY`

## Bij wijzigingen
- Draai minimaal:
  - `npm run lint`
  - `npm run build`
- Houd wijzigingen klein en taakgericht.
- Wijzig nooit bestaande `supabase/migrations/*.sql`; voeg bij DB-wijzigingen altijd nieuwe migratie toe.
- Draai bij DB-wijzigingen `npm run db:test` en `npm run db:types`; werk `docs/migratie-backlog.md` bij.
