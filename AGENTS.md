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
  - `invites`
- Instrumentbeheer zit op profielpagina bij actieve kapel.
- Optredens gebruiken compacte maandkalender.
- PWA staat aan met auto-update service worker.

## Routing
- Login callback: `/auth/callback`
- Profiel: `/profile`
- Optredens: `/performances`
- Admin: `/admin?tab=band|members|invites`
- GitHub Pages gebruikt SPA fallback via `404.html`.

## Ontwikkelcommando's
- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run test`

## Deploy
- GitHub Pages via GitHub Actions workflow.
- Build output komt uit `dist/`.
- Vereiste Actions variabelen:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Bij wijzigingen
- Draai minimaal:
  - `npm run lint`
  - `npm run build`
- Houd wijzigingen klein en taakgericht.
