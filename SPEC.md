# Vietnam Competitive Programming Hall of Fame - Frontend Functional Spec

**Version:** 0.5
**Domain:** `vn-cphof.com`
**Scope of this document:** Frontend application only - **single source of truth** for both functional and design decisions. The backend is a separate, later project; this frontend runs entirely against a typed mock API (MSW). The API contract in §7 doubles as the specification the backend must later implement.
**Inspiration:** [cphof.org](https://cphof.org) (worldwide hall of fame), [ICPC VN scoreboards](https://icpcvn.github.io) (national/regional results), adapted for the Vietnamese scene and extended down to national (VOI) and departmental olympiads.
**Status:** All v0.1 `[OPEN]` questions resolved; design system merged from the Claude Design handoff in v0.3; Province → Department rename in v0.4; School → Organization rename in v0.5. See §15 for the decision log.
**Visual reference:** `design-preview.html` (repo root) - hi-fi rendering of the four Phase 1 screens. Where the preview and this spec disagree, **the spec wins**; update the preview, not the spec.

---

## 1. Vision

A community-curated, admin-moderated archive that preserves the history of Vietnamese competitive programmers - from departmental olympiads to IOI/APIO and ICPC - with a public leaderboard, per-person profiles, and browseable pages by contest, department, and organization/university.

Two things differentiate this from cphof.org:

1. **Depth, not just breadth.** cphof only tracks elite *international* finals. We go all the way down to departmental olympiads, which matters for the Vietnamese pipeline (HSG tỉnh → VOI → TST → IOI; OLP/ICPC at university level).
2. **Community submission.** cphof is curated top-down by one maintainer. We let anyone submit themselves via a form, with an admin approving/curating into canonical profiles. *(Submission and admin surfaces are spec'd here but deferred to the backend phase - see §2.)*

### Phasing

- **Phase 1 (this spec):** Public, read-only browse experience built on Next.js against MSW mocks. The mock fixtures stand in for real data; the typed API contract is the deliverable the backend will implement.
- **Phase 2 (backend project):** Real API, submission form, admin review workflow, auth.

---

## 2. Goals & Non-Goals

### Phase 1 goals (this frontend MVP)

- Public can browse a **leaderboard** with multiple ranking modes and filters.
- Public can view **individual profiles**, **contest pages**, **department pages**, **organization/university pages**, and **ICPC team pages**.
- **Search** by person name/handle, contest, organization, department - diacritic-insensitive.
- **Bilingual** UI: Vietnamese default, English toggle, locale-prefixed URLs.
- SEO-grade server rendering: every profile/contest/department page is shareable with correct meta + Open Graph tags.
- A complete, typed **API contract** (zod schemas + REST endpoints) that the future backend implements verbatim.

### Deferred to Phase 2 (spec'd but not built now)

- `/submit` public submission form.
- `/admin/*` review queue and CRUD screens.
- Authentication (admin-only model - see §3).
- Proof-file storage and admin-only viewing.
- Rate limiting, CAPTCHA, audit logging.
- Mobile/responsive pass (desktop-first now; tables may degrade poorly on small screens - accepted).

### Non-goals (any phase)

- Live judging / running contests (we archive *results* only).
- Auto-syncing ratings from Codeforces/AtCoder/etc. - handles are stored as links; rating badges are display-only flair (§5.3).
- User-to-user social features (comments, follows, messaging).
- Prize-money tracking.

---

## 3. User Roles

- **Guest** (no auth) - the only role served by Phase 1:
  - View leaderboard in all modes, with all filters and sorts.
  - View profile, contest, department, organization, and team pages.
  - Search.
- **Admin** (auth required) - Phase 2:
  - Review / approve / reject submissions.
  - Create / edit / merge / delete profiles.
  - CRUD contests, contest editions, ICPC teams, organizations, departments.
  - Manage achievement taxonomy and ranking weights.
  - Mark achievements verified / unverified; view proof files.

**Decision (was OPEN-2):** Admin-only auth. No self-service "profile owner" accounts. Public submits → admin owns everything. May be revisited post-MVP.

---

## 4. Data Model

Entities are documented as TypeScript shapes. In code, each is a zod schema in `src/lib/api/schemas.ts` (single source of truth; types via `z.infer`). The backend must serve JSON conforming to these shapes.

### 4.1 Profile (individual)

```ts
interface Profile {
  id: string;
  slug: string;                      // e.g. "le-van-a"
  fullName: string;                  // Vietnamese, full diacritics
  displayHandle?: string;            // optional alias, "tourist"-style
  bio?: string;                      // PLAIN TEXT only - see §10.3 (XSS)
  avatarUrl?: string;
  hometownDepartmentCode?: string;     // FK → Department (hometown, not residence)
  organizations: OrganizationAffiliation[];
  externalAccounts: ExternalAccount[];
  ratingBadges?: RatingBadge[];      // display-only flair, never ranked (§5.3)
  status: 'published' | 'hidden';
}

interface OrganizationAffiliation {
  organizationId: string;            // FK → Organization
  role: 'student' | 'coach';
  eraLabel?: string;                 // e.g. "2018–2021"
}

interface ExternalAccount {
  platform: 'codeforces' | 'atcoder' | 'topcoder' | 'vnoj' | 'codechef' | 'github' | 'other';
  handle: string;
  url: string;                       // http(s) only - validated (§10.3)
}

interface RatingBadge {
  platform: 'codeforces' | 'atcoder';
  title: string;                     // e.g. "LGM", "IGM", "Red"
  colorToken: string;                // design-token key, not a raw hex
}
```

### 4.2 Achievement

One result by one person **or** one team at one contest edition. Subject is a discriminated union.

```ts
type AchievementSubject =
  | { kind: 'profile'; profileId: string }
  | { kind: 'team'; teamId: string };      // team achievements attach to the Team;
                                           // the Team links member Profiles

interface Achievement {
  id: string;
  subject: AchievementSubject;
  contestEditionId: string;          // FK → ContestEdition
  category: AchievementCategory;     // §5
  resultTier: string;                // tier key valid for the category (§5)
  rank?: number;                     // for rank-based results (ICPC)
  year: number;
  departmentAliasRef?: string;         // for departmental HSG: the department name AS IT WAS
                                     // at the time (resolves via Department.historicalAliases)
  proofUrl?: string;                 // public link to official results
  verificationStatus: 'verified' | 'pending';
  notes?: string;
}
```

> **Decision (was OPEN-6):** `proof_file` (certificate scans, may contain personal data) is **admin-only and does not exist in the public API contract at all**. The public sees `verificationStatus` (rendered as a "verified ✓" badge) and the public `proofUrl` if provided.

### 4.3 Contest & ContestEdition

```ts
interface Contest {
  id: string;
  slug: string;                      // "ioi", "voi", "icpc-vietnam-national"
  name: string;                      // localized via i18n key, see §9
  shortName: string;
  category: AchievementCategory;     // §5
  scope: 'international' | 'regional' | 'national' | 'departmental';
  isTeamBased: boolean;
  description?: string;
  homepageUrl?: string;
}

interface ContestEdition {
  id: string;
  contestId: string;
  editionLabel: string;              // "IOI 2023", "VOI 2024"
  year: number;
  location?: string;
  date?: string;                     // ISO 8601
  hostOrganizationId?: string;
}
```

Admins (Phase 2) create these so submitters select from dropdowns rather than free-typing - keeps data clean.

### 4.4 Team (ICPC)

```ts
interface Team {
  id: string;
  slug: string;
  name: string;                      // "HCMUS-AleaJactaEst"
  organizationId: string;            // FK → Organization
  contestEditionId: string;
  teamType: 'university' | 'high_school';   // mirrors ICPC VN scoreboard split
  memberProfileIds: string[];        // 1–3
  coach?: { profileId?: string; freeText?: string };
  result?: { rank?: number; medal?: string; solved?: number; penalty?: number };
}
```

### 4.5 Organization (organization / university)

```ts
interface Organization {
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  type: 'high_school' | 'university';
  departmentCode: string;              // FK → Department
  aliases: string[];                 // scoreboard-name matching, renames
  logoUrl?: string;
}
```

> Naming convention observed on ICPC VN scoreboards and used in fixtures: gifted high schools as `HSGS <Name> - <Department>` (e.g. *HSGS Le Hong Phong - Ho Chi Minh City*); universities by full name (e.g. *University of Science, VNU-HCM*). That scoreboard list is the seed set - §11.

### 4.6 Department

> **Decision (was OPEN-5):** Canonical set = the **34 post-2025-reorganization units**. Pre-merger names live as `historicalAliases` with validity periods. An achievement earned under an old unit (e.g. "HSG tỉnh Hà Tây 2007") stores an alias reference (`Achievement.departmentAliasRef`), displays the era-correct name, and rolls up to the canonical unit on department pages.

```ts
interface Department {
  code: string;                      // canonical, stable ID
  name: string;                      // Vietnamese
  nameEn: string;
  historicalAliases: {
    name: string;
    nameEn: string;
    validUntil: number;              // year the alias ceased (e.g. merged 2025 → 2025)
  }[];
}
```

### 4.7 RankingConfig

Weights powering the "Overall" leaderboard mode (§6). Served by the API so the breakdown UI is auditable and weights are admin-tunable in Phase 2 without a frontend deploy.

```ts
interface RankingConfig {
  version: number;
  weights: Record<AchievementCategory, Record<string /* tier key */, number>>;
}
```

### 4.8 Submission (Phase 2 - recorded for completeness)

Raw output of the public form: claimed identity, accounts, achievements, selected contests/teams/organizations, proofs; `status: pending | approved | rejected | needs_info`; reviewer fields; `linkedProfileId` on approval. A submission is never auto-published. Not part of the Phase 1 contract.

---

## 5. Achievement Taxonomy

**Decision (was OPEN-4):** All proposed extensions included.

### 5.1 Categories and result tiers

| Category key | Contest(s) | Level | Subject | Result tiers |
|---|---|---|---|---|
| `ioi` | IOI | International, individual | profile | Gold / Silver / Bronze / Honorable Mention / Participant |
| `apio` | APIO | International, individual | profile | Gold / Silver / Bronze / Participant |
| `intl_other` | Other international olympiads (invitationals, ISIJ-style, etc.) | International, individual | profile | Gold / Silver / Bronze / Other |
| `icpc_wf` | ICPC World Finals | International, team | team | Champion / Gold / Silver / Bronze / Rank / Honorable Mention |
| `icpc_asia` | ICPC Asia-Pacific Championship, Asia regionals | Regional, team | team | Rank / Medal |
| `icpc_vn` | ICPC Vietnam National & Regional | National, team | team | Rank / Award (split by `teamType`: university vs high school) |
| `voi` | VOI - HSG Quốc gia môn Tin học | National, individual | profile | Giải Nhất / Giải Nhì / Giải Ba / Khuyến khích |
| `tst` | TST / đội tuyển quốc gia (IOI/APIO selection) | National, individual | profile | Selected / Rank |
| `olp` | Olympic Tin học Sinh viên | National (university), individual | profile | Siêu cúp / Chuyên tin (Nhất/Nhì/Ba/KK) / Không chuyên (Nhất/Nhì/Ba/KK) |
| `departmental` | HSG cấp Tỉnh/Thành phố môn Tin học | Departmental, individual | profile | Nhất / Nhì / Ba / Khuyến khích |

Tier keys are stable slugs (`gold`, `giai-nhat`, `sieu-cup`, …); display names localize via i18n (§9).

### 5.2 Extensibility

Categories/tiers are data, not code: the frontend renders whatever the taxonomy in the API returns, keyed by `category` + `resultTier`. Adding a category in Phase 2 must not require frontend changes beyond i18n strings and (optionally) a leaderboard tab entry.

### 5.3 Rating badges are NOT achievements

Codeforces LGM/IGM, AtCoder colors etc. are continuous ratings, not discrete proofable events. They appear only as **display-only profile badges** (`Profile.ratingBadges`) - never counted in any ranking mode, never listed in achievement tables.

---

## 6. Ranking & Leaderboard Logic

**Decision (was OPEN-1):** Multi-mode ranking. No single contentious hard-coded order.

### 6.1 Modes

1. **Overall (default)** - weighted-point score. Each `(category, resultTier)` pair has a point value from `RankingConfig` (§4.7). A person's score = sum over their achievements (team achievements credit each member). Weights are placeholders in fixtures (illustrative: IOI Gold 100, APIO Gold 60, VOI Nhất 30, Departmental Nhất 8) and admin-tunable in Phase 2 - the community debates numbers, not the mechanism.
2. **Per-category medal tables** - one tab per category group (IOI / APIO / ICPC / VOI / OLP / Departmental), each ranked **lexicographically by tier** (gold → silver → bronze → …, then count of appearances), exactly cphof-style.

### 6.2 Auditability

Every profile page shows a **points breakdown card**: each achievement, its `(category, tier)` weight, and the sum - so any Overall rank is verifiable by inspection. The leaderboard links the config version in the footer ("Scoring v3 - see About").

### 6.3 Filters & sorts (guest-facing)

- **Filter by:** category, contest, contest edition/year, department, organization/organization, team type.
- **Sort by (within a mode):** score (default), specific medal counts (e.g. IOI golds, VOI Nhất), most recent achievement, name (Vietnamese collation - §9).
- All filter/sort/mode state lives in **URL search params** - shareable, back-button-safe, server-renderable.

### 6.4 Computation boundary

Scores and rank ordering are **computed by the API** (mock now, backend later), not the client. The client requests `mode` + filters and renders the returned order. This keeps ranking logic in one place and the leaderboard cacheable.

### 6.5 Compact tier display (G/S/B mapping)

Leaderboard rows and other compact summaries use a single medal-token language even for non-medal Vietnamese tiers. Each `resultTier` maps to a **visual tier** for the compact cluster; the true tier name always appears on hover (tooltip) and on the profile/contest pages.

| Visual tier | Maps from |
|---|---|
| Gold token | IOI/APIO/intl Gold · ICPC Champion/Gold · Giải Nhất · OLP Siêu cúp / Nhất |
| Silver token | Silver medals · ICPC Silver · Giải Nhì · OLP Nhì |
| Bronze token | Bronze medals · ICPC Bronze · Giải Ba · OLP Ba |
| Neutral token | Khuyến khích · Honorable Mention · Participant / other |

The mapping lives in the taxonomy data (each tier key carries a `visualTier` field), not in component code.

---

## 7. API Contract

REST, JSON, base path `/api/v1`. All responses zod-validated at the client boundary. Mocked with **MSW** (node handlers for SSR, browser worker for client navigation) backed by fixture data (§11); swapping `NEXT_PUBLIC_API_BASE_URL` to the real backend must require **zero component changes**.

### 7.1 Endpoints

| Endpoint | Query params | Returns |
|---|---|---|
| `GET /leaderboard` | `mode` (overall\|ioi\|apio\|icpc\|voi\|olp\|departmental), `department`, `organization`, `category`, `year`, `teamType`, `sort`, `cursor`, `limit` (default 50) | `{ items: RankedEntry[], nextCursor: string \| null, total: number, configVersion: number }` |
| `GET /profiles/:slug` | - | `Profile` + `achievements: AchievementExpanded[]` + `teams: TeamSummary[]` + `pointsBreakdown` |
| `GET /contests` | `scope`, `category` | `Contest[]` with edition counts |
| `GET /contests/:slug` | - | `Contest` + `editions: ContestEdition[]` |
| `GET /contests/:slug/editions/:editionLabel` | - | Edition + ranked results (people or teams, expanded) |
| `GET /departments` | - | `Department[]` + per-department aggregate medal counts |
| `GET /departments/:code` | - | `Department` + people (ranked) + organizations + aggregates |
| `GET /organizations` | `type`, `department` | `Organization[]` + counts |
| `GET /organizations/:slug` | - | `Organization` + people + teams + aggregates |
| `GET /teams/:slug` | - | `Team` expanded (members, org, edition, result) |
| `GET /search` | `q` (min 2 chars) | `{ profiles: [], contests: [], organizations: [], departments: [] }` - grouped, max 5 each |
| `GET /config/ranking` | - | `RankingConfig` |

```ts
interface RankedEntry {
  rank: number;
  profile: ProfileSummary;           // id, slug, fullName, displayHandle, avatarUrl, departmentCode
  medalSummary: { category: AchievementCategory; tier: string; count: number }[];
  points?: number;                   // overall mode only
}
```

### 7.2 Contract rules

- **Cursor pagination** everywhere a list can grow (leaderboard, department/org people lists). Opaque `cursor` string; `nextCursor: null` terminates.
- **Search is diacritic-insensitive and case-insensitive**: server normalizes NFD and strips combining marks ("le van" matches "Lê Văn"). The mock implements this; the backend must match.
- Errors: standard envelope `{ error: { code, message } }` with 400/404; client surfaces a localized error state.
- All IDs/slugs are stable; slugs are URL-safe ASCII (diacritics stripped, e.g. `le-van-a`).
- No private data in any Phase 1 endpoint (no emails, no proof files, no submission records).

---

## 8. Pages & Routes

Next.js App Router with a `[locale]` segment (§9). Desktop-first layouts.

```
src/app/[locale]/
  page.tsx                                  /            Leaderboard (home)
  p/[slug]/page.tsx                         /p/le-van-a  Individual profile
  contests/page.tsx                         /contests    Contest index
  contests/[slug]/page.tsx                  /contests/ioi
  contests/[slug]/[edition]/page.tsx        /contests/ioi/2023   Edition results
  departments/page.tsx                        /departments
  departments/[code]/page.tsx                 /departments/hcm
  organizations/page.tsx                          /organizations     Org index
  organizations/[slug]/page.tsx                   /organizations/hsgs-le-hong-phong-hcm
  teams/[slug]/page.tsx                     /teams/hcmus-aleajactaest
  about/page.tsx                            /about       Methodology, scoring weights, credits
```

### 8.1 Leaderboard (home)

- Server component renders **page 1** for the current URL state (mode/filters/sort) - fast paint + SEO.
- Hydrates into a TanStack Query **infinite list**; rows beyond ~100 rendered through TanStack Virtual.
- **Mode tabs:** Overall / IOI / APIO / ICPC / VOI / OLP / Departmental - canonical 7 (resolved over the design mockup's 6-tab "National" variant).
- **No "Submit a profile" button in Phase 1** - `/submit` ships with the backend; no dead buttons in production (resolved design conflict).
- **Filter bar:** department, organization, category, year, team type - comboboxes (shadcn `Command` inside `Popover`), all reflected in search params.
- **Row:** rank #, avatar, full name (+ handle), department tag, compact medal badges with counts, points (Overall mode).
- **Search:** ⌘K command palette (shadcn `Command` dialog) hitting `GET /search`, grouped results, keyboard-first.

### 8.2 Profile

- **Header:** name (full diacritics), avatar, department, organizations with era labels, external accounts as linked icons, rating badges.
- **Points breakdown card** (§6.2).
- **Achievement timeline:** chronological list, each with contest edition link, tier badge, verified ✓, proof link.
- **Track record table:** grouped by category (cphof-style columns).
- **Team appearances:** ICPC teams with results, linking to team pages.
- Bio rendered as escaped plain text with URL auto-linking (§10.3).

### 8.3 Contest / edition

- Contest page: description, homepage link, list of editions.
- Edition page: ranked results table - rank, person or team (+ expandable member list for teams), organization, tier badge, verified ✓.

### 8.4 Department

- Header with canonical name; if the page is reached via a historical alias context, show an explanatory note ("formerly Hà Tây, merged 2008").
- Aggregate medal counts by category, top people (mini-leaderboard scoped to department), organizations in the department.

### 8.5 Organization / team

- Org page: type, department, people (ranked), ICPC teams by edition, aggregates.
- Team page: members, coach, organization, edition, result.

### 8.6 SEO & metadata

- `generateMetadata` on every route: localized title/description, Open Graph (type=profile for people), canonical URL, `hreflang` alternates between `/vi` and `/en`.
- Profile/contest/department pages SSG via `generateStaticParams` against fixtures, written ISR-ready (`revalidate` works once a real backend exists).
- OG image generation (`next/og`) for profiles - stretch goal, not MVP-blocking.

---

## 9. Internationalization

**Decision (was OPEN-7/NFR-2):** Bilingual, Vietnamese default.

- `next-intl` with locale path prefix: `/vi/...` (default) and `/en/...`; middleware redirects `/` → `/vi`.
- Message catalogs `messages/vi.json`, `messages/en.json`. Result tiers localize (`Giải Nhất` ↔ `First Prize`); proper names, team names, and handles never translate.
- Vietnamese-aware alphabetical sorting via `Intl.Collator('vi')`.
- Locale switcher in the header preserves the current path and search params.

---

## 10. Non-Functional Requirements

### 10.1 Accessibility (desktop-first pass)

- Results and leaderboards use real `<table>` semantics: `<caption>`, header `scope`, `aria-sort` on sortable columns.
- Medal/tier signals are **never color-only**: badge = icon + text + color token.
- Filters, tabs, comboboxes, and the ⌘K palette fully keyboard-operable (Radix primitives provide focus management; verify tab order across the filter bar).
- Skip-to-content link; `lang` attribute follows locale; visible focus rings throughout.
- Infinite scroll: `aria-live="polite"` announcement of newly loaded counts, plus an explicit **"Load more" button** as the baseline (scroll-trigger is progressive enhancement).

### 10.2 Performance

- SSR/SSG first paint for every public page; leaderboard page 1 server-rendered per URL state.
- Cursor-paginated infinite scroll; TanStack Virtual beyond ~100 rendered rows.
- Ranking computed API-side and cacheable (§6.4); `RankingConfig` fetched once and cached.
- Images via `next/image`; avatar fixtures sized appropriately.

### 10.3 Security - XSS posture

- **Bio and every user-originated string is plain text.** React's default escaping renders it; **`dangerouslySetInnerHTML` is banned project-wide** (enforce via ESLint `react/no-danger`).
- URL auto-linking in bios via a dedicated component that parses URLs from text and renders `<a rel="noopener noreferrer nofollow" target="_blank">` - never HTML injection.
- All external URLs (`ExternalAccount.url`, `proofUrl`, `homepageUrl`) validated by zod to `http(s)` schemes at the client boundary - defense in depth against a future compromised/buggy backend.
- CSP headers in `next.config.ts`: no `unsafe-inline` scripts, restrictive `default-src`; plus `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

### 10.4 Vietnamese text handling

- Full Unicode throughout; names stored and displayed with diacritics.
- Diacritic-insensitive, case-insensitive search (§7.2).
- Vietnamese collation for alphabetical sorts (§9).

---

## 11. Fixture / Seed Data Plan (`src/mocks/fixtures/`)

Hand-curated, realistic-shaped mock data (structure mirrors real sources; not scraped in Phase 1):

- **Departments:** all 34 canonical post-2025 units + key historical aliases (e.g. Hà Tây → Hà Nội).
- **Organizations:** ~20 in ICPC VN naming style - `HSGS <Name> - <Department>` high schools, full-name universities.
- **Contests:** full catalog per §5 taxonomy (IOI, APIO, ICPC WF/Asia/VN, VOI, TST, OLP, HSG tỉnh) with 2–5 editions each.
- **Profiles:** ~40 with mixed-tier achievement sets (a few IOI medalists, VOI laureates, OLP winners, departmental-only juniors) - enough variety to exercise every mode/filter.
- **Teams:** ~15 ICPC teams across both `teamType` values.
- **Leaderboard padding:** generate to ~200 ranked entries to exercise infinite scroll + virtualization.
- **RankingConfig:** illustrative placeholder weights (§6.1).

Real seed sources for Phase 2 backfill: cphof.org `/country/VNM`, ICPC VN scoreboards (also the org-name list), official IOI/APIO archives, VOI results.

---

## 12. Design System

Merged from the Claude Design handoff (wireframes, 2026-06-10) and the approved hi-fi pass. **Approach A selected for all four screens**: dense ranked table · two-column profile rail · single results table · stats-header department page.

### 12.1 Principles

- **Prestigious, archival, trustworthy** - a permanent record book, editorial and restrained. The data is the hero.
- **Flat only.** No 3D, no glassmorphism, no skeuomorphism, no heavy drop shadows, no busy gradients, no stock-photo heroes.
- Strong grid, generous whitespace, crisp hairline dividers, comfortable table density.
- Hierarchy through **type weight and size**, not decoration.
- Rank emphasis understated: top-3 get a 3px accent inset hairline + accent rank numeral - "celebratory but not gamified".

### 12.2 Color tokens

| Token | Value | Use |
|---|---|---|
| `paper` | `#FAF9F5` | Page background (warm off-white) |
| `card` | `#FFFFFF` | Cards, table surfaces |
| `ink` | `#1C1B17` | Primary text |
| `ink-soft` | `#6E6B62` | Secondary text |
| `ink-faint` | `#A8A49A` | Tertiary / placeholders |
| `line` | `#E7E4DC` | Hairline dividers, row borders |
| `line-strong` | `#CFCBBF` | Card borders, table header rule |
| `accent` | `#08558C` | THE accent - links, active states, top-3 markers, emphasis. Single accent; deep blue chosen over red in design review |
| `accent-deep` | `#07406B` | Accent hover |
| `accent-soft` | `rgba(8,85,140,.06)` | Row hover, tinted fills |
| `gold` / `silver` / `bronze` | `#A8821F` / `#81817B` / `#9A6537` | Medal tokens, each with a 10%-alpha tinted background |
| `logo-circle` | `#FFC40C` | Full-color logo background circle. SVG sources live in `public/logos/` (`logo.svg`, `logo-substract.svg`); both variants render inline via `src/components/logo.tsx` so all logo tokens are themeable via CSS variables |
| `logo-star` | `#F99F1B` | Full-color logo star |
| `logo-subtract` | `#FFFFFF` | Single-color subtract variant (star cut from circle), used on the blue header; falls back to `currentColor` |

Per-department identity: a small deterministic muted color dot per department on department tags (token set, not random). Optional dark mode: deferred, not in Phase 1.

### 12.3 Typography

**Primary family: SVN-Gotham** (licensed, Vietnamese-diacritic-complete; files in repo). Loaded via `next/font/local` from `src/fonts/svn-gotham/`:

| File | Weight | Role |
|---|---|---|
| `SVN-Gotham-Book.otf` | 400 | Body |
| `SVN-Gotham-Book-Italic.otf` | 400 italic | Rare emphasis |
| `SVN-Gotham-Regular.otf` | 500 | Labels, nav, chips |
| `SVN-Gotham-Bold.otf` | 700 | Names, row emphasis |
| `SVN-Gotham-Black.otf` | 800 | Headings, rank numerals, big stats |

Fallback stack: `Montserrat, "Helvetica Neue", Helvetica, Arial, sans-serif`. The full SVN-Gotham family (Thin→Ultra) stays in `assets/fonts/svn-gotham/` source folder; only the five files above ship.

**Data/label family: IBM Plex Mono** - micro-labels (10px, uppercase, 1.4px tracking), handles, scores, years. All numeric columns use `font-variant-numeric: tabular-nums`.

Scale: h1 30/800 (−0.4px tracking) · h3 18/800 · body 13.5–14/400 · table headers mono 10/500 uppercase · big stat numerals 26/800.

### 12.4 Component inventory

Canonical pieces (all visible in `design-preview.html`); build each once in `src/components/`:

- **Medal token** - colored pip (17px circle, 1.5px border, tinted bg) + letter G/S/B + count/word. Color is **never** the only signal (NFR-6). Uses §6.5 visual-tier mapping.
- **Department tag** - bordered chip: per-department color dot + name.
- **Person cell** - avatar (initials placeholder until photos exist) + bold name + mono handle.
- **Rank cell / top-3 marker** - 800-weight tabular numeral; top-3 add accent color + 3px inset hairline.
- **Mode tabs** - underline style, accent active (the 7 canonical tabs).
- **Filter chip** - pill with caret; active = accent border/text/tint.
- **Search** - inline pill in filter bar + global ⌘K command palette.
- **Stat card** - bordered card, 800-weight numeral (accent for the hero stat), mono label.
- **Timeline item** - left rule, medal-tinted dot, mono year, bold title, soft meta.
- **Track-record table** - category-grouped borderless table: year · contest · detail · award.
- **Verified badge** - small accent-bordered `✓ verified` pill (maps to `verificationStatus`).
- **Account chip** - platform glyph square + mono handle, linked.
- **Department seal** - flat circular accent-bordered monogram placeholder.

### 12.5 Site header

- **Accent-blue bar** (`accent` background), all text white: wordmark, nav links (`white/75` → white on hover), search trigger, locale toggle (active = white pill with accent text).
- **Logo:** the `logo-substract.svg` variant in white (`logo-subtract` token).
- **Wordmark, locale-specific:**
  - EN - topline `Vietnam | Competitive Programming`, name `HALL OF FAME`
  - VI - topline `Việt Nam`, name `BẢNG VÀNG LẬP TRÌNH THI ĐẤU`
- **Search trigger:** wide field-style button (~16rem) with search icon, placeholder text, and `⌘K` kbd hint; opens the command palette.

### 12.6 Layout & motion

- Container 1180px; desktop-first (mobile deferred, NFR).
- Real `<table>` semantics everywhere data is tabular (see §10.1).
- Motion: restrained - one-time staggered fade-up on screen entry (~0.45s, ≤0.3s stagger), row-hover tint. **`prefers-reduced-motion` disables entrance animation.** No scroll-jacking, no parallax.

---

## 13. Tech Stack & Project Conventions

- **Base:** clone of local `nextjs-template` - Next.js 15 (App Router, Turbopack), React 19, TypeScript, Tailwind 4.
- **UI:** shadcn/ui on Radix primitives (table, tabs, badge, command, popover, select, avatar, skeleton, tooltip, separator), themed with §12 tokens.
- **Fonts:** SVN-Gotham via `next/font/local` (§12.3); IBM Plex Mono via `next/font/google`.
- **Data:** zod schemas → typed fetch client → TanStack Query (incl. infinite queries) → MSW mocks (node + browser).
- **Virtualization:** TanStack Virtual.
- **i18n:** next-intl.
- Project root: `/Users/dvtdat/Work/vn-cphof` (this directory).

---

## 14. Milestones (forward-looking; detailed implementation plan is a separate follow-up document)

1. Spec sign-off (this document).
2. Scaffold: template clone, deps, shadcn init, next-intl, layout/nav shell.
3. Data layer: schemas, client, MSW, fixtures.
4. Leaderboard: modes, filters, search, infinite scroll/virtualization.
5. Profile page: breakdown card, timeline, track record.
6. Contests index + edition results.
7. Departments, organizations, teams pages.
8. Polish: About page, metadata/OG, CSP, a11y pass.

---

## 15. Decision Log

| # | Question (v0.1) | Resolution |
|---|---|---|
| OPEN-1 | Ranking approach; weights? | Multi-mode (weighted Overall + per-category tables). Weights are admin-tunable placeholders served by `GET /config/ranking`; breakdown shown on profiles. |
| OPEN-2 | Auth: admin-only vs user accounts? | Admin-only. No self-service profile ownership for now. |
| OPEN-3 | One unified profile per person? | Yes - one profile spans high-organization and university eras, deduped by handles. |
| OPEN-4 | Taxonomy extensions? | All included: TST, OLP Tin học Sinh viên, other-intl olympiads. CF/AtCoder ratings = display-only badges, never achievements. |
| OPEN-5 | Department reorganization (2025)? | Canonical 34 current units + historical aliases with validity periods; era-correct display, canonical roll-up. |
| OPEN-6 | Proof visibility? | Proof files admin-only, absent from the public API entirely. Public sees verified ✓ badge + public `proofUrl`. |
| OPEN-7 | Language? | Bilingual, VI default, `/vi` `/en` path prefixes, hreflang alternates. |
| OPEN-8 | Stack? | Frontend-only project (backend separate, later). Next.js App Router + shadcn/ui + TanStack Query/Virtual + zod + MSW + next-intl. |
| OPEN-9 | Design/build priority? | Public browse only: Leaderboard → Profile → Contest → Department/Organization/Team. Submit form and admin deferred to Phase 2. Desktop-first; mobile later. |

### Design review resolutions (v0.3 - design handoff merged)

| # | Conflict (design vs spec) | Resolution |
|---|---|---|
| D-1 | Screen layouts - wireframes offered 2 approaches per screen | **Approach A everywhere**: dense ranked table, two-column profile rail, single results table, stats-header department page. Submission-form screen not built (Phase 2). |
| D-2 | Accent color - brief proposed deep red | **Blue `#08558C`** (chosen during design session, confirmed). |
| D-3 | Mode tabs - design had 6 ("National", no OLP) | **Spec's 7 tabs canonical**: Overall / IOI / APIO / ICPC / VOI / OLP / Departmental. |
| D-4 | "+ Submit a profile" button on leaderboard | **Hidden until Phase 2** - no dead buttons in production. |
| D-5 | Typography - Gotham requested, license concern | **SVN-Gotham** (licensed family provided in repo, full Vietnamese diacritics). Five faces mapped to `src/fonts/svn-gotham/`, loaded via `next/font/local`; Montserrat documented fallback. |
| D-6 | Non-medal VN tiers in compact medal clusters | **Map to G/S/B visual tiers** (§6.5): Giải Nhất→gold, Nhì→silver, Ba→bronze, KK→neutral; true tier name on hover and detail pages. Mapping lives in taxonomy data. |
| D-7 | Dark mode - brief said "consider optional" | **Deferred** - not in Phase 1. |
| D-8 | Terminology (v0.4) | **Province → Department, everywhere**: entity (`Department`, `departmentCode`, `departmentAliasRef`), API (`GET /departments`), routes (`/departments/[code]`), EN UI copy, and achievement category `provincial` → `departmental`. Vietnamese display copy unchanged (Tỉnh/Thành phố, HSG tỉnh) via i18n. Earlier log rows predate the rename and were updated mechanically. |
| D-9 | Terminology (v0.5) | **School → Organization, everywhere**: `Profile.organizations` (`OrganizationAffiliation`), leaderboard `?organization=` param, routes (`/organizations`, `/organizations/[slug]`), nav + EN copy "Organizations", VI copy "Tổ chức". The org **type value** `high_school` and "high school"/"THPT" display strings are intentionally untouched - they describe the organization's kind, not the entity. |
