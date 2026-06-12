/**
 * Sample fixture data - SPEC §11.
 * Stands in for the real backend during Phase 1. ICPC Vietnam National
 * 2021–2025 is real scoreboard data (src/mocks/icpc-vn/); profiles are
 * invented placeholders.
 */
import type {
  Achievement,
  Contest,
  ContestEdition,
  ContestProblem,
  Department,
  Organization,
  Profile,
  RankingConfig,
  Team,
  VisualTier,
} from '@/lib/api/schemas'
import { slugify } from '@/lib/text'
import {
  icpcApacProblems,
  icpcApacTeams,
  icpcRegionalHsProblems,
  icpcRegionalHsTeams,
  icpcRegionalProblems,
  icpcRegionalTeams,
  icpcVnOrganizations,
  icpcVnProblems,
  icpcVnTeams,
} from './icpc-vn'

// ── Departments: official MOE unit codes (Mã ĐV) - SPEC §4.6 ──────────
// 01–34 provinces/cities, 35–42 university-administered units that field
// their own HSG/VOI delegations.
const d = (
  code: string,
  name: string,
  nameEn: string,
  aliases: { name: string; nameEn: string; validUntil: number }[] = []
): Department => ({ code, name, nameEn, historicalAliases: aliases })

export const departments: Department[] = [
  d('01', 'Cần Thơ', 'Can Tho', [
    { name: 'Hậu Giang', nameEn: 'Hau Giang', validUntil: 2025 },
    { name: 'Sóc Trăng', nameEn: 'Soc Trang', validUntil: 2025 },
  ]),
  d('02', 'Đà Nẵng', 'Da Nang', [
    { name: 'Quảng Nam', nameEn: 'Quang Nam', validUntil: 2025 },
  ]),
  d('03', 'Hà Nội', 'Hanoi', [
    { name: 'Hà Tây', nameEn: 'Ha Tay', validUntil: 2008 },
  ]),
  d('04', 'Hải Phòng', 'Hai Phong', [
    { name: 'Hải Dương', nameEn: 'Hai Duong', validUntil: 2025 },
  ]),
  d('05', 'TP. Hồ Chí Minh', 'Ho Chi Minh City', [
    { name: 'Bình Dương', nameEn: 'Binh Duong', validUntil: 2025 },
    {
      name: 'Bà Rịa – Vũng Tàu',
      nameEn: 'Ba Ria - Vung Tau',
      validUntil: 2025,
    },
  ]),
  d('06', 'Huế', 'Hue'),
  d('07', 'An Giang', 'An Giang', [
    { name: 'Kiên Giang', nameEn: 'Kien Giang', validUntil: 2025 },
  ]),
  d('08', 'Bắc Ninh', 'Bac Ninh', [
    { name: 'Bắc Giang', nameEn: 'Bac Giang', validUntil: 2025 },
  ]),
  d('09', 'Cà Mau', 'Ca Mau', [
    { name: 'Bạc Liêu', nameEn: 'Bac Lieu', validUntil: 2025 },
  ]),
  d('10', 'Cao Bằng', 'Cao Bang'),
  d('11', 'Đắk Lắk', 'Dak Lak', [
    { name: 'Phú Yên', nameEn: 'Phu Yen', validUntil: 2025 },
  ]),
  d('12', 'Điện Biên', 'Dien Bien'),
  d('13', 'Đồng Nai', 'Dong Nai'),
  d('14', 'Đồng Tháp', 'Dong Thap', [
    { name: 'Tiền Giang', nameEn: 'Tien Giang', validUntil: 2025 },
  ]),
  d('15', 'Gia Lai', 'Gia Lai', [
    { name: 'Bình Định', nameEn: 'Binh Dinh', validUntil: 2025 },
  ]),
  d('16', 'Hà Tĩnh', 'Ha Tinh'),
  d('17', 'Hưng Yên', 'Hung Yen', [
    { name: 'Thái Bình', nameEn: 'Thai Binh', validUntil: 2025 },
  ]),
  d('18', 'Khánh Hòa', 'Khanh Hoa', [
    { name: 'Ninh Thuận', nameEn: 'Ninh Thuan', validUntil: 2025 },
  ]),
  d('19', 'Lai Châu', 'Lai Chau'),
  d('20', 'Lạng Sơn', 'Lang Son'),
  d('21', 'Lào Cai', 'Lao Cai', [
    { name: 'Yên Bái', nameEn: 'Yen Bai', validUntil: 2025 },
  ]),
  d('22', 'Lâm Đồng', 'Lam Dong', [
    { name: 'Bình Thuận', nameEn: 'Binh Thuan', validUntil: 2025 },
  ]),
  d('23', 'Nghệ An', 'Nghe An'),
  d('24', 'Ninh Bình', 'Ninh Binh', [
    { name: 'Nam Định', nameEn: 'Nam Dinh', validUntil: 2025 },
    { name: 'Hà Nam', nameEn: 'Ha Nam', validUntil: 2025 },
  ]),
  d('25', 'Phú Thọ', 'Phu Tho', [
    { name: 'Vĩnh Phúc', nameEn: 'Vinh Phuc', validUntil: 2025 },
    { name: 'Hòa Bình', nameEn: 'Hoa Binh', validUntil: 2025 },
  ]),
  d('26', 'Quảng Ngãi', 'Quang Ngai', [
    { name: 'Kon Tum', nameEn: 'Kon Tum', validUntil: 2025 },
  ]),
  d('27', 'Quảng Ninh', 'Quang Ninh'),
  d('28', 'Quảng Trị', 'Quang Tri', [
    { name: 'Quảng Bình', nameEn: 'Quang Binh', validUntil: 2025 },
  ]),
  d('29', 'Sơn La', 'Son La'),
  d('30', 'Tây Ninh', 'Tay Ninh', [
    { name: 'Long An', nameEn: 'Long An', validUntil: 2025 },
  ]),
  d('31', 'Thái Nguyên', 'Thai Nguyen', [
    { name: 'Bắc Kạn', nameEn: 'Bac Kan', validUntil: 2025 },
  ]),
  d('32', 'Thanh Hóa', 'Thanh Hoa'),
  d('33', 'Tuyên Quang', 'Tuyen Quang', [
    { name: 'Hà Giang', nameEn: 'Ha Giang', validUntil: 2025 },
  ]),
  d('34', 'Vĩnh Long', 'Vinh Long', [
    { name: 'Bến Tre', nameEn: 'Ben Tre', validUntil: 2025 },
    { name: 'Trà Vinh', nameEn: 'Tra Vinh', validUntil: 2025 },
  ]),
  d('35', 'Đại học Quốc gia Hà Nội', 'Vietnam National University, Hanoi'),
  d(
    '36',
    'Đại học Quốc gia TP. Hồ Chí Minh',
    'Vietnam National University Ho Chi Minh City'
  ),
  d('37', 'Đại học Huế', 'Hue University'),
  d('38', 'Trường ĐHSP Hà Nội', 'Hanoi National University of Education'),
  d(
    '39',
    'Trường ĐHSP TP. Hồ Chí Minh',
    'Ho Chi Minh City University of Education'
  ),
  d('40', 'Trường Đại học Vinh', 'Vinh University'),
  d('41', 'Trường Đại học Tân Tạo', 'Tan Tao University'),
  d('42', 'Trường Phổ thông Vùng cao Việt Bắc', 'Viet Bac Highland School'),
]

// ── Organizations - canonical ICPC VN registry - SPEC §4.5 ──────────
// Curated VI/EN names + MOE dept codes live in src/mocks/icpc-vn/orgs.ts.
export const organizations: Organization[] = icpcVnOrganizations

// ── Contests + editions - SPEC §4.3 / §5 ─────────────────────────────
// Release 1 ships ICPC Vietnam National, the ICPC Asia Regional hosted in
// Vietnam (incl. its high-school division) and the ICPC Asia Pacific
// Championship. ICPC WF and the individual
// contests (IOI/APIO/VOI/TST/OLP/HSG) keep their schema support but their
// content returns in a later release.
export const contests: Contest[] = [
  {
    id: 'c-icpc-vn',
    slug: 'icpc-vietnam',
    name: 'ICPC Quốc gia',
    nameEn: 'ICPC Vietnam National',
    shortName: 'ICPC VN',
    category: 'icpc_vn',
    scope: 'national',
    isTeamBased: true,
  },
  {
    id: 'c-icpc-regional-vn',
    slug: 'icpc-regional-vietnam',
    name: 'ICPC Regional Việt Nam',
    nameEn: 'ICPC Regional Vietnam',
    shortName: 'ICPC Regional VN',
    category: 'icpc_asia',
    scope: 'regional',
    isTeamBased: true,
  },
  {
    id: 'c-icpc-regional-vn-hs',
    slug: 'icpc-regional-vietnam-hsgs',
    name: 'ICPC Regional Việt Nam - Bảng THPT',
    nameEn: 'ICPC Regional Vietnam - High School',
    shortName: 'ICPC Regional VN - HSGS',
    category: 'icpc_asia',
    scope: 'regional',
    isTeamBased: true,
  },
  {
    id: 'c-icpc-apac',
    slug: 'icpc-asia-pacific-championship',
    name: 'ICPC Championship Châu Á - Thái Bình Dương',
    nameEn: 'ICPC Asia Pacific Championship',
    shortName: 'ICPC APAC',
    category: 'icpc_asia',
    scope: 'regional',
    isTeamBased: true,
  },
]

const ed = (
  contestId: string,
  year: number,
  label: { vi: string; en: string },
  officialUrl: string,
  problems: ContestProblem[] | undefined,
  location?: string,
  extra: Partial<ContestEdition> = {}
): ContestEdition => ({
  id: `e-${contestId.slice(2)}-${year}`,
  contestId,
  editionLabel: `${label.vi} ${year}`,
  editionLabelEn: `${label.en} ${year}`,
  year,
  location,
  countryCode: 'vn',
  officialUrl,
  problems,
  ...extra,
})

const natEd = (
  year: number,
  location?: string,
  extra: Partial<ContestEdition> = {}
) =>
  ed(
    'c-icpc-vn',
    year,
    { vi: '', en: '' },
    `https://icpcvn.github.io/${year}/national/scoreboard.html`,
    icpcVnProblems[year],
    location,
    {
      editionLabel: `Kỳ thi ICPC Quốc gia ${year}`,
      editionLabelEn: `The ${year} ICPC Vietnam National Contest`,
      ...extra,
    }
  )
// Official titles follow icpc.global convention: "The {year} ICPC Asia {City}
// Regional Contest". The host city changes per year.
const regEd = (year: number, city: string, location?: string) =>
  ed(
    'c-icpc-regional-vn',
    year,
    { vi: '', en: '' },
    `https://icpcvn.github.io/${year}/regional/scoreboard.html`,
    icpcRegionalProblems[year],
    location,
    {
      editionLabel: `Kỳ thi ICPC Asia ${city} Regional ${year}`,
      editionLabelEn: `The ${year} ICPC Asia ${city} Regional Contest`,
    }
  )
const hsEd = (year: number, city: string, file: string, location?: string) =>
  ed(
    'c-icpc-regional-vn-hs',
    year,
    { vi: '', en: '' },
    `https://icpcvn.github.io/${year}/regional/${file}`,
    icpcRegionalHsProblems[year],
    location,
    {
      editionLabel: `Kỳ thi ICPC Asia ${city} Regional ${year} - Bảng THPT`,
      editionLabelEn: `The ${year} ICPC Asia ${city} Regional Contest - Unofficial High School Division`,
    }
  )
// Asia Pacific Championship - rotating host (Hanoi '24, Singapore '25,
// Taoyuan '26). Standings are the DOMjudge dumps on files.icpc.jp.
const apacEd = (
  year: number,
  location: string,
  countryCode: string,
  extra: Partial<ContestEdition> = {}
) =>
  ed(
    'c-icpc-apac',
    year,
    { vi: '', en: '' },
    `https://storage.googleapis.com/files.icpc.jp/championship${year}/standings.html`,
    icpcApacProblems[year],
    location,
    {
      editionLabel: `Kỳ thi ICPC Chung kết khu vực Châu Á - Thái Bình Dương ${year}`,
      editionLabelEn: `The ${year} ICPC Asia Pacific Championship`,
      countryCode,
      ...extra,
    }
  )

export const editions: ContestEdition[] = [
  natEd(2021),
  natEd(2022),
  natEd(2023),
  natEd(2024, undefined, {
    dateStart: '2024-10-12',
    dateEnd: '2024-10-12',
  }),
  natEd(2025, undefined, {
    dateStart: '2025-10-11',
    dateEnd: '2025-10-11',
  }),
  regEd(2021, 'Hanoi', 'Hà Nội, Việt Nam'),
  regEd(2022, 'HCMC', 'TP. Hồ Chí Minh, Việt Nam'),
  regEd(2023, 'Hue', 'Huế, Việt Nam'),
  regEd(2024, 'Hanoi', 'Hà Nội, Việt Nam'),
  regEd(2025, 'HCMC', 'TP. Hồ Chí Minh, Việt Nam'),
  // High-school (HSGS) division - only held alongside these editions.
  hsEd(2022, 'HCMC', 'hsgs-scoreboard.html', 'TP. Hồ Chí Minh, Việt Nam'),
  hsEd(2024, 'Hanoi', 'scoreboard-hsgs.html', 'Hà Nội, Việt Nam'),
  hsEd(2025, 'HCMC', 'scoreboard-hsgs.html', 'TP. Hồ Chí Minh, Việt Nam'),
  apacEd(2024, 'Hà Nội, Việt Nam', 'vn', {
    dateStart: '2024-02-29',
    dateEnd: '2024-03-03',
  }),
  apacEd(2025, 'Singapore', 'sg', {
    dateStart: '2025-02-27',
    dateEnd: '2025-03-02',
  }),
  apacEd(2026, 'Đào Viên, Đài Loan', 'tw', {
    dateStart: '2026-03-08',
    dateEnd: '2026-03-08',
  }),
]

// ── Ranking weights (illustrative placeholders) - SPEC §6.1 ─────────
export const rankingConfig: RankingConfig = {
  version: 1,
  weights: {
    ioi: { gold: 100, silver: 70, bronze: 50, hm: 20, participant: 10 },
    apio: { gold: 60, silver: 40, bronze: 28, participant: 6 },
    intl_other: { gold: 40, silver: 28, bronze: 18, other: 8 },
    icpc_wf: {
      champion: 120,
      gold: 100,
      silver: 75,
      bronze: 55,
      rank: 30,
      hm: 15,
    },
    icpc_asia: { gold: 35, silver: 25, bronze: 18, rank: 8 },
    icpc_vn: { gold: 22, silver: 15, bronze: 10, rank: 5 },
    voi: { 'giai-nhat': 30, 'giai-nhi': 20, 'giai-ba': 12, 'khuyen-khich': 6 },
    tst: { selected: 25, rank: 10 },
    olp: {
      'sieu-cup': 24,
      'giai-nhat': 16,
      'giai-nhi': 10,
      'giai-ba': 6,
      'khuyen-khich': 3,
    },
    departmental: {
      'giai-nhat': 8,
      'giai-nhi': 5,
      'giai-ba': 3,
      'khuyen-khich': 1,
    },
  },
}

// Tier → compact visual tier - SPEC §6.5
export const visualTierMap: Record<string, VisualTier> = {
  champion: 'gold',
  gold: 'gold',
  'giai-nhat': 'gold',
  'sieu-cup': 'gold',
  silver: 'silver',
  'giai-nhi': 'silver',
  bronze: 'bronze',
  'giai-ba': 'bronze',
  hm: 'neutral',
  'khuyen-khich': 'neutral',
  participant: 'neutral',
  other: 'neutral',
  rank: 'neutral',
  selected: 'gold',
}

// ── Profiles ─────────────────────────────────────────────────────────
type Seed = {
  name: string
  handle: string
  dept: string
  organization: string
  era?: string
  bio?: string
  badges?: Profile['ratingBadges']
}

const NAMED: Seed[] = [
  {
    name: 'Lê Quang Minh',
    handle: 'minhlq',
    dept: '03',
    organization: 'o-khtn-hn',
    era: '2021–2024',
    bio: 'Competitive programmer from Hà Nội. Currently studying at UET. See https://codeforces.com/profile/minhlq for contest history.',
    badges: [{ platform: 'codeforces', title: 'IGM', colorToken: 'cf-red' }],
  },
  {
    name: 'Trần Hữu Phúc',
    handle: 'phuctran',
    dept: '05',
    organization: 'o-ptnk',
    era: '2020–2023',
    badges: [{ platform: 'codeforces', title: 'GM', colorToken: 'cf-red' }],
  },
  {
    name: 'Nguyễn Bảo Anh',
    handle: 'baoanh',
    dept: '04',
    organization: 'o-tranphu-hp',
    era: '2021–2024',
  },
  {
    name: 'Phạm Đức Duy',
    handle: 'duypham',
    dept: '24',
    organization: 'o-khtn-hn',
    era: '2020–2023',
  },
  {
    name: 'Vũ Hoàng Long',
    handle: 'longvu',
    dept: '08',
    organization: 'o-bacninh-hs',
    era: '2021–2024',
  },
  {
    name: 'Đỗ Khánh Vy',
    handle: 'vydo',
    dept: '02',
    organization: 'o-lqd-dn',
    era: '2022–2025',
  },
  {
    name: 'Hoàng Gia Bảo',
    handle: 'baohg',
    dept: '23',
    organization: 'o-phanboichau',
    era: '2020–2023',
  },
  {
    name: 'Bùi Thanh Tùng',
    handle: 'tungbt',
    dept: '03',
    organization: 'o-ams',
    era: '2021–2024',
  },
  {
    name: 'Mai Anh Khoa',
    handle: 'khoama',
    dept: '06',
    organization: 'o-quochoc',
    era: '2021–2024',
  },
  {
    name: 'Lý Gia Hân',
    handle: 'hanly',
    dept: '01',
    organization: 'o-lhp-hcm',
    era: '2020–2023',
  },
  {
    name: 'Đặng Minh Quân',
    handle: 'quandm',
    dept: '03',
    organization: 'o-khtn-hn',
    era: '2019–2022',
  },
  {
    name: 'Ngô Thảo My',
    handle: 'myngo',
    dept: '03',
    organization: 'o-ams',
    era: '2020–2023',
  },
  {
    name: 'Trịnh Văn Hùng',
    handle: 'hungtv',
    dept: '32',
    organization: 'o-lamson',
    era: '2019–2022',
  },
  {
    name: 'Cao Bảo Ngọc',
    handle: 'ngoccb',
    dept: '03',
    organization: 'o-ams',
    era: '2021–2024',
  },
  {
    name: 'Phan Nhật Nam',
    handle: 'namphan',
    dept: '05',
    organization: 'o-lhp-hcm',
    era: '2020–2023',
  },
  {
    name: 'Dương Thế Vinh',
    handle: 'vinhdt',
    dept: '27',
    organization: 'o-khtn-hn',
    era: '2019–2022',
  },
]

const mkProfile = (s: Seed, i: number): Profile => ({
  id: `p-${i}`,
  slug: slugify(s.name),
  fullName: s.name,
  displayHandle: s.handle,
  bio: s.bio,
  hometownDepartmentCode: s.dept,
  organizations: [
    { organizationId: s.organization, role: 'student', eraLabel: s.era },
  ],
  externalAccounts: [
    {
      platform: 'codeforces',
      handle: s.handle,
      url: `https://codeforces.com/profile/${s.handle}`,
    },
    {
      platform: 'vnoj',
      handle: s.handle,
      url: `https://oj.vnoi.info/user/${s.handle}`,
    },
  ],
  ratingBadges: s.badges,
  status: 'published',
})

// Generated long-tail (deterministic) so the leaderboard exercises
// pagination/infinite scroll - SPEC §11 (~120 total entries).
const FIRST = [
  'Anh',
  'Bình',
  'Châu',
  'Dũng',
  'Giang',
  'Hải',
  'Khang',
  'Linh',
  'Minh',
  'Nam',
  'Phong',
  'Quỳnh',
  'Sơn',
  'Thảo',
  'Uyên',
  'Việt',
  'Xuân',
  'Yến',
  'Đạt',
  'Hương',
]
const LAST = [
  'Nguyễn Văn',
  'Trần Thị',
  'Lê Đức',
  'Phạm Minh',
  'Hoàng Thu',
  'Vũ Quốc',
  'Đặng Hồng',
  'Bùi Khánh',
  'Đỗ Thanh',
  'Ngô Bảo',
]

const GENERATED: Seed[] = Array.from({ length: 104 }, (_, i) => {
  const name = `${LAST[i % LAST.length]} ${FIRST[(i * 7) % FIRST.length]}`
  return {
    name: `${name} ${String.fromCharCode(65 + (i % 24))}`, // disambiguate duplicates
    handle: `user${i + 100}`,
    dept: departments[(i * 5) % departments.length].code,
    organization: organizations[i % organizations.length].id,
  }
})

export const profiles: Profile[] = [...NAMED, ...GENERATED].map(mkProfile)

// ── Teams - SPEC §4.4 ────────────────────────────────────────────────
// Real ICPC Vietnam National + Regional (incl. HSGS division) + APAC
// championship scoreboard data, generated by scripts/scrape-icpcvn.mjs.
// Member rosters are not published, so memberProfileIds stay empty. Medals
// carried where the official scoreboard shows them (regional/HSGS 2024+,
// national 2025, APAC 2024) or per the official rank rule (APAC 2025/2026).
export const teams: Team[] = [
  ...icpcVnTeams,
  ...icpcRegionalTeams,
  ...icpcRegionalHsTeams,
  ...icpcApacTeams,
]

// ── Achievements - SPEC §4.2 ─────────────────────────────────────────
let achSeq = 0
const ach = (
  profileOrTeam: { p?: string; t?: string },
  editionId: string,
  category: Achievement['category'],
  resultTier: string,
  year: number,
  extra: Partial<Achievement> = {}
): Achievement => ({
  id: `a-${achSeq++}`,
  subject: profileOrTeam.p
    ? { kind: 'profile', profileId: profileOrTeam.p }
    : { kind: 'team', teamId: profileOrTeam.t! },
  contestEditionId: editionId,
  category,
  resultTier,
  year,
  verificationStatus: 'verified',
  ...extra,
})

// Release 1: no achievement content - medals/prizes are a later feature
// (official prize lists pending), and individual-contest achievements
// return together with their fixtures. The ach() helper stays for then.
void ach
export const achievements: Achievement[] = []
