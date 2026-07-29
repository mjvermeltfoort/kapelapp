# kapelapp

Eenvoudige PWA voor kapellen en kleine muziekverenigingen.

## Stack
- React
- TypeScript
- Vite
- Supabase
- PostgreSQL

## Lokaal starten
1. Kopieer `.env.example` naar `.env`
2. Vul Supabase projectwaarden in
3. Installeer dependencies:
   - `npm install`
4. Start devserver:
   - `npm run dev`

## Scripts
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`

## Huidige status
- frontend, routing, auth, kapelbeheer, ledenbeheer, invites en optredens opgezet
- 18 Supabase-migraties voor schema, RLS, RPC's en instrumentbeheer
- actuele migratiestatus en open DB-testbacklog in `docs/migratie-backlog.md`
