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
- Header bevat logo, actieve kapel en profielicoon.
- Kapelwissel zit onder logo in header.
- Hoofdmenu gebruikt iconen.
- Adminfuncties zitten onder `/admin` met tabs:
  - `band`
  - `members`
- Invitebeheer zit onder de admin-tab `band`.
- Instrumentbeheer zit op profielpagina bij actieve kapel.
- Optredens gebruiken compacte maandkalender.
- PWA staat aan met auto-update service worker.

## Routing
- Login callback: `/auth/callback`
- Profiel: `/profile`
- Optredens: `/performances`
- Admin: `/admin?tab=band|members`
- GitHub Pages gebruikt SPA fallback via `404.html`.

## Ontwikkelcommando's
- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run test`

## Runtime
- Gebruik Node.js 26, vastgelegd in `.nvmrc` en `package.json`.

## Deploy
- GitHub Pages via GitHub Actions workflow.
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
