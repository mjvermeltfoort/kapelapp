# Migratie-overzicht en backlog

Bijgewerkt: 2026-07-29.

Dit document beschrijft huidige PostgreSQL/Supabase-migratiestatus. Toegepaste migraties blijven onveranderlijk; correcties en uitbreidingen krijgen altijd een nieuw oplopend migratiebestand.

## Uitgangspunten

- Autorisatie zit in PostgreSQL RLS en RPC-functies, niet alleen in frontend.
- Frontend gebruikt uitsluitend publieke Supabase-clientconfiguratie.
- Migraties blijven klein, taakgericht en reviewbaar.
- `security definer`-functies gebruiken een vaste `search_path` en controleren authenticatie/rechten.
- Schemawijzigingen krijgen bijbehorende positieve en negatieve DB-tests.

## Huidige migraties

| Migratie | Status | Inhoud |
|----------|--------|--------|
| `202607260001_extensions.sql` | gereed | Activeert `pgcrypto`. |
| `202607260002_initial_schema.sql` | gereed | Maakt profielen, kapellen, lidmaatschappen, invites, optredens, responses, constraints en indexes. |
| `202607260003_timestamps_and_normalization.sql` | gereed | Beheert `updated_at` en normaliseert tekstvelden via triggers. |
| `202607260004_response_band_sync.sql` | gereed | Synchroniseert `performance_responses.band_id` met optreden. |
| `202607260005_create_band_rpc.sql` | gereed | Maakt kapel en owner-lidmaatschap atomair. |
| `202607260006_membership_self_service_rpcs.sql` | gereed | Laat gebruiker eigen instrument wijzigen en kapel veilig verlaten. |
| `202607260007_invite_rpcs.sql` | gereed | Introduceert invitebeheer, preview en acceptatie via RPC. |
| `202607260008_fix_extension_search_path.sql` | gereed | Corrigeert `search_path` voor functies die extensies gebruiken. |
| `202607260009_rls_and_helper_functions.sql` | gereed | Activeert RLS en voegt auth-/rolhelpers en policies toe. |
| `202607260010_performance_overview_rpc.sql` | gereed | Levert planner-responseoverzicht als JSON. |
| `202607260011_member_management_rpcs.sql` | gereed | Levert ledenoverzicht en rol-/activatiemanagement. |
| `202607260012_superadmin_and_member_visibility.sql` | gereed | Voegt superadmin toe en verruimt gecontroleerde ledenzichtbaarheid. |
| `202607260013_fix_member_management_rpc_ambiguity.sql` | gereed | Verwijdert ambiguïteit in membermanagement-RPC's. |
| `202607260014_performances_delete_policy.sql` | gereed | Staat verwijderen van optredens toe voor planner/admin/owner. |
| `202607260015_delete_band_member_rpc.sql` | gereed | Voegt gecontroleerd definitief verwijderen van lidmaatschap toe. |
| `202607270001_single_current_band_invite.sql` | gereed | Beperkt beheer tot één actuele invite per kapel en ondersteunt regeneratie. |
| `202607270002_band_instruments.sql` | gereed | Voegt instrumentcatalogus, RLS en beheer-RPC's per kapel toe. |
| `202607280001_performance_overview_member_access.sql` | gereed | Maakt planner-overzicht beschikbaar voor actieve kapelleden. |

## Open backlog

### Hoog

- Voeg geautomatiseerde DB-integratietests toe voor RLS en alle `security definer`-RPC's.
- Test iedere rol minimaal als niet-ingelogd, niet-lid, member, planner, admin, owner en superadmin.
- Test cross-band toegang, laatste-ownerbescherming, inviteverval en gelijktijdige inviteacceptatie.
- Laat CI migrations op een tijdelijke Supabase/PostgreSQL-testdatabase uitvoeren.

### Middel

- Genereer Supabase TypeScript-types vanuit actueel schema en vervang handmatige API-casts.
- Controleer en documenteer expliciete `EXECUTE`-rechten voor publieke en ingelogde RPC-aanroepen.
- Voeg regressietests toe voor performance-overzicht, response-redenen en instrumentgroepering.
- Leg per toekomstige destructieve migratie herstel- of dataconversiestrategie vast.

### Laag

- Controleer ongebruikte of vervangen functies/policies in oudere migratielagen via eindtoestandsinspectie.
- Voeg een korte migratiechecklist aan PR-template of ontwikkeldocumentatie toe.

## Acceptatiecriteria voor nieuwe migraties

- Migratie draait schoon op lege database.
- Volledige migratiereeks draait schoon in bestandsvolgorde.
- Bestaande data blijft geldig of krijgt expliciete conversie.
- RLS staat aan voor nieuwe gebruikersdata.
- Positieve én negatieve autorisatietests bestaan.
- Geen `service_role`-afhankelijkheid in frontend.
- `security definer` gebruikt vaste `search_path`.
- Frontendtypes zijn bijgewerkt wanneer schema/RPC-resultaten veranderen.

## Bewijs

- `supabase/migrations/`
- `src/features/*/api/`
- `src/lib/supabase/client.ts`
- `docs/codebase/ARCHITECTURE.md`
- `docs/codebase/CONCERNS.md`
