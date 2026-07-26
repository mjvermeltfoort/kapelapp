# Migratie-backlog

Doel: concrete backlog voor **SQL-migraties in Supabase/PostgreSQL**.  
Nog steeds **geen applicatiecode**. Focus op volgorde, inhoud, afhankelijkheden, testpunten.

## Uitgangspunten
- Elke migratie klein, reviewbaar, rollback-baar in concept
- Eerst **schema**, dan **constraints**, dan **helperfuncties**, dan **RLS**, dan **RPC**
- RLS pas aanzetten zodra basisrechten/functies klaarstaan
- Liever meer kleine migraties dan 1 grote

---

# Aanbevolen migratievolgorde

## M001 — extensies en basis DB-setup
**Doel**
- benodigde extensies activeren
- basis conventies vastleggen

**Inhoud**
- `create extension if not exists pgcrypto;`
- optioneel: `citext` alleen als echt nodig
- eventueel schema-keuze bevestigen: alles in `public`

**Waarom eerst**
- nodig voor UUID/token-hashing

**Testpunten**
- `gen_random_uuid()` werkt
- digest/hash-functies beschikbaar

**Complexiteit**
- klein

---

## M002 — enum/vervangende check-strategie kiezen
**Doel**
- keuze vastleggen voor rol-, status- en responsewaarden

**Aanbevolen keuze**
Voor MVP: **text + check constraints**, geen PostgreSQL enum types.

**Inhoud**
- nog geen tabellen
- alleen documenteren in migratiecomment / bewust design
- alternatief: domains maken, maar niet nodig

**Waarom**
- eenvoudiger aanpassen in MVP
- minder frictie bij latere uitbreidingen

**Testpunten**
- n.v.t.

**Complexiteit**
- klein

---

## M003 — `profiles` tabel
**Doel**
- app-profielen gekoppeld aan Supabase auth users

**Inhoud**
Tabel `profiles`:
- `id uuid primary key`
- `email text not null`
- `display_name text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:
- FK-achtige koppeling naar `auth.users(id)` als toegestaan/gebruikelijk in project
- check op niet-lege `display_name` als niet null
- optioneel unique index op `lower(email)`

**Beslispunt**
- profiel automatisch aanmaken via trigger op `auth.users` of pas bij eerste login-flow?
- Aanbeveling: **profiel lazy aanmaken door app/RPC** of DB-trigger later apart, niet nu blokkeren

**Testpunten**
- profiel insert/update werkt
- lege displayname wordt niet geaccepteerd indien ingevuld

**Complexiteit**
- klein

---

## M004 — `bands` tabel
**Doel**
- kapellen opslaan

**Inhoud**
Tabel `bands`:
- `id uuid pk default gen_random_uuid()`
- `name text not null`
- `description text null`
- `show_member_responses boolean not null default false`
- `is_archived boolean not null default false`
- `created_by uuid not null`
- `created_at`
- `updated_at`

Constraints:
- FK `created_by -> profiles(id)`
- `length(trim(name)) > 0`

Indexes:
- `created_by`

**Testpunten**
- band kan aangemaakt worden
- naam mag niet leeg

**Complexiteit**
- klein

---

## M005 — `band_members` tabel
**Doel**
- lidmaatschap, rol, instrument per kapel

**Inhoud**
Tabel `band_members`:
- `id uuid pk`
- `band_id uuid not null`
- `user_id uuid not null`
- `role text not null`
- `instrument text null`
- `is_active boolean not null default true`
- `joined_at timestamptz not null default now()`
- `left_at timestamptz null`
- `created_at`
- `updated_at`

Constraints:
- FK `band_id -> bands(id)`
- FK `user_id -> profiles(id)`
- unique `(band_id, user_id)`
- check `role in ('member','planner','admin','owner')`
- check instrument trimmed indien niet null
- check logica actieve status / `left_at`

Indexes:
- unique `(band_id, user_id)`
- `(user_id, is_active)`
- `(band_id, role, is_active)`

**Testpunten**
- dubbele membership geblokkeerd
- ongeldige rol geblokkeerd

**Complexiteit**
- middel

---

## M006 — `band_invites` tabel
**Doel**
- uitnodigingslinks beheren

**Inhoud**
Tabel `band_invites`:
- `id uuid pk`
- `band_id uuid not null`
- `created_by uuid not null`
- `role text not null default 'member'`
- `token_hash text not null`
- `is_active boolean not null default true`
- `expires_at timestamptz null`
- `max_uses integer null`
- `use_count integer not null default 0`
- `last_used_at timestamptz null`
- `revoked_at timestamptz null`
- `created_at`
- `updated_at`

Constraints:
- FK `band_id -> bands(id)`
- FK `created_by -> profiles(id)`
- check role in allowed set
- check `max_uses is null or max_uses > 0`
- check `use_count >= 0`

Indexes:
- unique `token_hash`
- `(band_id, is_active)`
- optioneel partial index op actieve invites

**Testpunten**
- duplicate token_hash geblokkeerd
- negative use_count geblokkeerd

**Complexiteit**
- middel

---

## M007 — `performances` tabel
**Doel**
- optredens opslaan

**Inhoud**
Tabel `performances`:
- `id uuid pk`
- `band_id uuid not null`
- `title text not null`
- `description text null`
- `performance_date date not null`
- `start_time time not null`
- `end_time time null`
- `gather_time time null`
- `location text not null`
- `map_url text null`
- `response_deadline timestamptz null`
- `status text not null default 'draft'`
- `cancelled_at timestamptz null`
- `archived_at timestamptz null`
- `created_by uuid not null`
- `updated_by uuid not null`
- `created_at`
- `updated_at`

Constraints:
- FK `band_id -> bands(id)`
- FK `created_by -> profiles(id)`
- FK `updated_by -> profiles(id)`
- check `status in ('draft','published','cancelled','completed','archived')`
- title/location niet leeg
- `end_time >= start_time` indien ingevuld
- `gather_time <= start_time` indien ingevuld
- status-consistentie met `cancelled_at` / `archived_at`

Indexes:
- `(band_id, performance_date)`
- `(band_id, status, performance_date)`

**Testpunten**
- draft default werkt
- ongeldige tijdcombinaties falen

**Complexiteit**
- middel

---

## M008 — `performance_responses` tabel
**Doel**
- actuele response per user per optreden

**Inhoud**
Tabel `performance_responses`:
- `id uuid pk`
- `performance_id uuid not null`
- `band_id uuid not null`
- `user_id uuid not null`
- `response text not null`
- `reason text null`
- `responded_at timestamptz not null default now()`
- `created_at`
- `updated_at`

Constraints:
- FK `performance_id -> performances(id)`
- FK `band_id -> bands(id)`
- FK `user_id -> profiles(id)`
- unique `(performance_id, user_id)`
- check `response in ('yes','maybe','no')`
- check:
  - `maybe` => niet-lege reden
  - `yes` => `reason is null`
  - `no` => reden optioneel

Indexes:
- unique `(performance_id, user_id)`
- `(band_id, performance_id, response)`
- `(user_id, performance_id)`

**Let op**
- `band_id`-consistentie met performance volgt later via trigger

**Testpunten**
- tweede actieve response voor zelfde optreden faalt
- maybe zonder reden faalt
- yes met reden faalt

**Complexiteit**
- middel

---

## M009 — generieke `updated_at` triggerfunctie
**Doel**
- timestamps automatisch bijwerken

**Inhoud**
Functie:
- `set_updated_at()`

Triggers op:
- `profiles`
- `bands`
- `band_members`
- `band_invites`
- `performances`
- `performance_responses`

**Testpunten**
- update van rij verandert `updated_at`

**Complexiteit**
- klein

---

## M010 — normalisatie-/validatietriggers
**Doel**
- tekstvelden trimmen en dataconsistentie verbeteren

**Inhoud**
Optioneel functies zoals:
- `normalize_text_fields()`

Toepassen op:
- `profiles.display_name`
- `bands.name`, `description`
- `band_members.instrument`
- `performances.title`, `location`, `description`
- `performance_responses.reason`

**Aanbeveling**
- klein houden
- niet te veel magie
- alleen trim, geen slimme herschrijvingen

**Testpunten**
- leading/trailing whitespace verdwijnt waar gewenst

**Complexiteit**
- klein

---

## M011 — `performance_responses.band_id` sync trigger
**Doel**
- response altijd juiste band-id laten erven van performance

**Inhoud**
Functie:
- before insert/update:
  - lookup `performances.band_id`
  - zet `NEW.band_id`
  - optioneel validatie dat performance bestaat

Trigger op `performance_responses`

**Waarom**
- voorkomt mismatch
- vereenvoudigt queries en RLS

**Testpunten**
- handmatig afwijkende `band_id` wordt overschreven of geweigerd
- correcte `band_id` wordt gezet

**Complexiteit**
- klein

---

## M012 — auth helperfuncties
**Doel**
- RLS leesbaar maken

**Inhoud**
Functies:
- `auth_user_id() returns uuid`
- `is_band_member(p_band_id uuid) returns boolean`
- `has_band_role(p_band_id uuid, p_roles text[]) returns boolean`
- `can_view_member_responses(p_band_id uuid) returns boolean`

**Veiligheidsregels**
- alleen `security definer` als echt nodig
- `set search_path = public, pg_temp`
- geen dynamische SQL

**Testpunten**
- member true in eigen band, false in andere
- planner/admin/owner rolecheck werkt
- member response-zichtbaarheid volgt bandinstelling

**Complexiteit**
- middel

---

## M013 — create-band RPC
**Doel**
- band + owner membership atomair aanmaken

**Inhoud**
Functie:
- `create_band(p_name text, p_description text default null) returns uuid`

Gedrag:
- vereist login
- maakt band aan
- maakt `band_members` rij met role `owner`
- faalt atomair bij probleem

**Waarom nu**
- voorkomt losse client inserts

**Testpunten**
- band + owner membership ontstaan samen
- niet-ingelogd faalt
- lege naam faalt

**Complexiteit**
- middel

---

## M014 — leave-band RPC
**Doel**
- veilig verlaten van kapel

**Inhoud**
Functie:
- `leave_band(p_band_id uuid) returns void`

Gedrag:
- alleen ingelogde user op eigen membership
- zet membership op inactief
- vult `left_at`
- blokkeert als user enige actieve owner is

**Testpunten**
- gewoon member kan verlaten
- enige owner kan niet verlaten
- één van meerdere owners kan wel verlaten

**Complexiteit**
- middel

---

## M015 — member role-management RPC’s
**Doel**
- rol- en lidbeheer veilig centraliseren

**Inhoud**
Functies:
- `set_band_member_role(p_band_id uuid, p_user_id uuid, p_role text) returns void`
- `deactivate_band_member(p_band_id uuid, p_user_id uuid) returns void`
- optioneel `reactivate_band_member(...)`

Regels:
- admin mag member/planner/admin beheren binnen eigen band
- admin mag geen owner maken
- owner mag owner toekennen / overdragen
- laatste owner bescherming

**Testpunten**
- admin kan geen owner toekennen
- owner kan wel
- laatste owner kan niet gedeactiveerd
- cross-band beheer faalt

**Complexiteit**
- groot

---

## M016 — invite create/revoke RPC’s
**Doel**
- veilige uitnodigingscreatie en intrekking

**Inhoud**
Functies:
- `create_band_invite(p_band_id uuid, p_expires_at timestamptz default null, p_max_uses integer default null, p_role text default 'member') returns jsonb`
- `revoke_band_invite(p_invite_id uuid) returns void`

Gedrag create:
- alleen admin/owner
- genereert random token
- hash opslaan
- plaintext token alleen in response teruggeven
- standaard role `member`

Gedrag revoke:
- `is_active=false`
- `revoked_at=now()`

**Testpunten**
- admin/owner kan invite maken
- planner/member niet
- plaintext token komt alleen bij create terug
- revoke werkt

**Complexiteit**
- groot

---

## M017 — invite preview RPC
**Doel**
- beperkte info tonen op joinpagina zonder invites openbaar querybaar te maken

**Inhoud**
Functie:
- `get_join_invite_preview(p_token text) returns jsonb`

Return:
- bandnaam
- globale status: geldig / ongeldig / verlopen / ingetrokken
- geen interne invite metadata zoals `token_hash`

**Testpunten**
- geldig token geeft preview
- ongeldig token lekt geen extra data

**Complexiteit**
- middel

---

## M018 — invite accept RPC
**Doel**
- veilige lidwording via token

**Inhoud**
Functie:
- `accept_band_invite(p_token text) returns jsonb`

Gedrag:
- vereist ingelogde user
- token hashen
- invite record locken `FOR UPDATE`
- actief/vervallen/max uses controleren
- membership:
  - al actief => return `already_active`
  - inactief => reactiveren
  - geen rij => aanmaken
- `use_count` correct ophogen
- `last_used_at` zetten
- transactie atomair

**Belangrijkste migratie in security-opzicht**

**Testpunten**
- geldig token werkt
- verlopen/inactief/revoked faalt
- max uses gerespecteerd
- duplicate membership niet mogelijk
- inactief lid wordt heractiveerd
- parallel accept race test slaagt conceptueel

**Complexiteit**
- groot

---

## M019 — optionele `update_my_membership_instrument` RPC
**Doel**
- eigen instrument veilig wijzigen zonder brede updatepolicy op `band_members`

**Inhoud**
Functie:
- `update_my_membership_instrument(p_band_id uuid, p_instrument text) returns void`

**Aanbeveling**
Ja, doen.  
Reden: scheelt lastige policy die moet bewijzen dat user alleen `instrument` wijzigde.

**Testpunten**
- user kan eigen instrument in eigen band wijzigen
- user kan niet andermans instrument wijzigen

**Complexiteit**
- klein

---

## M020 — RLS aanzetten op alle tabellen
**Doel**
- default deny actief maken

**Inhoud**
`alter table ... enable row level security;` op:
- `profiles`
- `bands`
- `band_members`
- `band_invites`
- `performances`
- `performance_responses`

Optioneel:
- `force row level security` waar passend

**Let op**
Deze migratie pas nadat helperfuncties/policies direct daarna komen.

**Testpunten**
- zonder policies valt toegang dicht

**Complexiteit**
- klein

---

## M021 — RLS policies voor `profiles`
**Doel**
- alleen eigen profiel zichtbaar/bewerkbaar

**Inhoud**
Policies:
- select own row
- insert own row
- update own row
- geen delete

**Testpunten**
- user ziet alleen eigen profiel
- update ander profiel faalt

**Complexiteit**
- klein

---

## M022 — RLS policies voor `bands`
**Doel**
- bandselect beperken tot eigen actieve memberships

**Inhoud**
Policies:
- member+ select eigen bands
- update alleen admin/owner
- directe insert blokkeren of alleen via RPC gebruiken
- delete blokkeren

**Testpunten**
- member ziet alleen eigen bands
- admin kan eigen band wijzigen
- gewone member niet

**Complexiteit**
- middel

---

## M023 — RLS policies voor `band_members`
**Doel**
- ledengegevens afschermen, directe writes minimaliseren

**Inhoud**
Policies:
- select:
  - eigen membership
  - leden van eigen band
- directe insert blokkeren
- directe delete blokkeren
- directe update bij voorkeur blokkeren
  - of alleen zeer beperkt als gekozen
- mutaties via RPC

**Aanbeveling**
Voor MVP: **geen directe update/insert/delete via table API**

**Testpunten**
- user ziet alleen memberships binnen eigen bands
- user kan niet direct membership insert doen
- user kan niet rol escaleren via update

**Complexiteit**
- middel

---

## M024 — RLS policies voor `band_invites`
**Doel**
- invites niet openbaar querybaar

**Inhoud**
Policies:
- select alleen admin/owner in eigen band
- directe insert/update/delete blokkeren of minimaal houden
- alles gevoelig via RPC

**Testpunten**
- member/planner ziet geen invites
- admin ziet invites van eigen band
- auth zonder membership ziet niets

**Complexiteit**
- middel

---

## M025 — RLS policies voor `performances`
**Doel**
- members alleen gepubliceerde/zichtbare optredens
- planner+ mag beheren

**Inhoud**
Policies:
- member select:
  - eigen band
  - `status <> 'draft'`
- planner/admin/owner select:
  - alle performances in eigen band
- insert/update:
  - planner/admin/owner in eigen band
- delete:
  - blokkeren

**Testpunten**
- member ziet geen drafts
- planner ziet wel drafts
- member kan niet inserten/updaten
- planner kan alleen eigen band beheren

**Complexiteit**
- middel

---

## M026 — RLS policies voor `performance_responses`
**Doel**
- eigen response beheren, bredere leesrechten gecontroleerd

**Inhoud**
Policies:
- member select:
  - eigen response altijd
  - andere responses alleen via `can_view_member_responses(...)`
- planner/admin/owner select:
  - alle responses in eigen band
- insert:
  - alleen eigen `user_id`
  - alleen voor eigen band/performance
- update:
  - alleen eigen response
- delete:
  - blokkeren

**Aanvullende keuze**
Als gewone members andermans status mogen zien:
- redenen alsnog afschermen lukt niet goed op zelfde tabelniveau
- dus beter:
  1. responses tabel alleen volledig zichtbaar voor planner+
  2. voor members later aparte veilige view/RPC voor status zonder redenen  
**Aanbevolen DB-keuze**: nu al meenemen in ontwerp.

**Belangrijke ontwerpbijstelling**
Omdat `reason` gevoelig is, is 1 simpele selectpolicy voor volledige rij mogelijk te grof.  
Aanbeveling:
- `performance_responses` volledige rij alleen:
  - eigenaar zelf
  - planner/admin/owner
- gewone members géén volledige select van andermans rows
- als member-onderlinge zichtbaarheid gewenst is: later aparte view/RPC zonder `reason`

**Testpunten**
- member kan eigen response upserten
- member kan andermans reason niet lezen
- planner ziet alles in eigen band

**Complexiteit**
- groot

---

## M027 — veilige member-view of RPC voor publieke response-status binnen band
**Doel**
- optionele instelling “leden mogen elkaars reacties zien” mogelijk maken zonder reasons te lekken

**Inhoud**
Kies 1 van 2:

### Optie A — view
Bijv. `band_response_visibility`
- bevat alleen:
  - performance_id
  - user_id / display_name
  - response
  - instrument
- geen `reason`

### Optie B — RPC
- `get_member_visible_responses(p_performance_id uuid)`

**Aanbeveling**
Voor MVP: **RPC of view pas toevoegen als feature echt nodig is**.  
Als standaard instelling uit staat, kan dit ook na MVP.

**Testpunten**
- member ziet status zonder reason
- alleen als bandinstelling aan staat

**Complexiteit**
- middel

---

## M028 — optionele aggregate helper view/RPC voor planners
**Doel**
- planneroverzicht eenvoudiger ophalen

**Inhoud**
Opties:
- SQL view met aggregaties
- of RPC `get_performance_response_overview(p_performance_id uuid)`

Inhoud overzicht:
- aantallen ja/misschien/nee
- niet gereageerd
- lijst per categorie
- redenen
- instrumentverdeling

**Aanbeveling**
Voor MVP liever **RPC**:
- makkelijker precies rechten controleren
- 1 call voor frontend
- encapsuleert querycomplexiteit

**Testpunten**
- planner krijgt compleet overzicht
- member krijgt geen toegang
- niet-gereageerden correct

**Complexiteit**
- middel

---

## M029 — service views / indexes voor performance-overzichten
**Doel**
- lijstweergaves performant houden

**Inhoud**
Aanvullende indexes indien nodig na eerste querytesten:
- `performances (band_id, performance_date, status)`
- `performance_responses (performance_id, response)`
- `band_members (band_id, is_active, role)`

Optioneel views:
- aankomende performances
- response summary counts

**Testpunten**
- explain plans op belangrijkste queries
- geen onnodige sequential scans op groeipaden

**Complexiteit**
- klein tot middel

---

## M030 — database testseed / fixtures migratiestrategie bepalen
**Doel**
- lokale/dev testdata aanpak vastleggen

**Inhoud**
Niet per se productiemigratie, maar wel backlog-item:
- aparte seed SQL
- voorbeeldusers/bands/performances
- voorbeeld invites zonder echte tokens in repo

**Testpunten**
- ontwikkelomgeving snel reproduceerbaar

**Complexiteit**
- klein

---

# Samenvatting: minimale MVP-kritieke migraties

Als je absolute kern eerst wilt bouwen, dan is dit minimum:

1. `M001` extensies  
2. `M003` profiles  
3. `M004` bands  
4. `M005` band_members  
5. `M006` band_invites  
6. `M007` performances  
7. `M008` performance_responses  
8. `M009` updated_at triggers  
9. `M011` response band sync  
10. `M012` helperfuncties  
11. `M013` create_band RPC  
12. `M014` leave_band RPC  
13. `M015` role/member RPC’s  
14. `M016` invite create/revoke RPC  
15. `M018` invite accept RPC  
16. `M019` update instrument RPC  
17. `M020–M026` RLS policies

---

# Aanbevolen backlogweergave per werkpakket

## Werkpakket A — schemafundament
- M001
- M003
- M004
- M005
- M006
- M007
- M008
- M009
- M011

## Werkpakket B — autorisatiebasis
- M012
- M020
- M021
- M022
- M023
- M024
- M025
- M026

## Werkpakket C — kern-RPC’s
- M013
- M014
- M015
- M019

## Werkpakket D — uitnodigingsbeveiliging
- M016
- M017
- M018

## Werkpakket E — leesoptimalisatie / planneroverzicht
- M027
- M028
- M029

---

# Extra aanbevelingen voor uitvoering

## 1. Maak bij elke migratie expliciete comments
Vooral bij:
- role-regels
- owner-bescherming
- invite-acceptatie
- RLS-ontwerp

## 2. Houd RPC’s klein en taakgericht
Niet 1 mega-function voor alles.

## 3. Test RLS vanaf begin met echte rollen
Niet alleen happy path.

## 4. Gebruik geen brede directe write-policies als RPC beter is
Vooral bij:
- `band_members`
- `band_invites`

## 5. Vermijd voortijdige views als simpele queries volstaan
Behalve waar privacy-scheiding nodig is.

---

# Aanbevolen Codex-opdrachten voor migratiefase

1. **Maak SQL-migraties M001 t/m M008 voor volledige basistabellen en constraints**
2. **Voeg generieke triggers toe voor `updated_at`, trimming en response-band-sync**
3. **Maak helperfuncties voor RLS: `auth_user_id`, `is_band_member`, `has_band_role`, `can_view_member_responses`**
4. **Implementeer RPC’s voor `create_band`, `leave_band`, rolbeheer en instrumentwijziging**
5. **Implementeer invite-RPC’s voor create, preview, revoke en accept met race-safe locking**
6. **Schakel RLS in en voeg policies toe voor alle tabellen**
7. **Voeg DB-tests of verificatie-SQL toe voor constraints, RPC’s en RLS-scenario’s**
8. **Optimaliseer met extra indexes / planner-overzicht RPC indien nodig**
