/**
 * Scrape ICPC Vietnam scoreboards (icpcvn.github.io) into mock data files.
 *
 * Series:
 *   national       - ICPC Vietnam National 2021–2025
 *   regional       - ICPC Asia Regional (Vietnam host) 2021–2025
 *   regional-hsgs  - high-school division of the regional 2022/2024/2025
 *   apac           - ICPC Asia Pacific Championship 2024–2026 (DOMjudge
 *                    static dumps on files.icpc.jp)
 *
 * Usage:
 *   node scripts/scrape-icpcvn.mjs                  # fetch live from icpcvn.github.io
 *   node scripts/scrape-icpcvn.mjs --from-dir /tmp  # read /tmp/{fileKey}.html
 *   node scripts/scrape-icpcvn.mjs --only apac      # boards whose key starts with "apac"
 *
 * Emits, per board:
 *   src/mocks/icpc-vn/teams-{key}.json     - every ranked team (medal kept where shown)
 *   src/mocks/icpc-vn/problems-{key}.json  - problem set, labels A.. by column
 *
 * Org names resolve through src/mocks/icpc-vn/org-seeds.json; the script
 * FAILS if any scoreboard org name is unmapped, so the registry stays total.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src/mocks/icpc-vn')

/**
 * One scoreboard to scrape. `key` names the output files
 * (teams-{key}.json / problems-{key}.json); national keys stay the bare
 * year for backwards compatibility.
 */
const board = (series, year, path, key, editionId, idPrefix, slugSuffix) => ({
  series,
  year,
  url: `https://icpcvn.github.io/${year}/${path}`,
  key,
  editionId,
  idPrefix,
  slugSuffix,
})

const nat = (y) =>
  board(
    'national',
    y,
    'national/scoreboard.html',
    y,
    `e-icpc-vn-${y}`,
    `t-vn${y.slice(2)}`,
    `vn${y.slice(2)}`
  )
const reg = (y) =>
  board(
    'regional',
    y,
    'regional/scoreboard.html',
    `regional-${y}`,
    `e-icpc-regional-vn-${y}`,
    `t-rvn${y.slice(2)}`,
    `rvn${y.slice(2)}`
  )
const hsgs = (y, file) =>
  board(
    'regional-hsgs',
    y,
    `regional/${file}`,
    `regional-hsgs-${y}`,
    `e-icpc-regional-vn-hs-${y}`,
    `t-rvnhs${y.slice(2)}`,
    `rvnhs${y.slice(2)}`
  )
// APAC championship standings are DOMjudge static dumps (different markup,
// handled by parseDomjudge). `medalsByRank` applies the official medal rule
// (ranks 1–4 gold / 5–8 silver / 9–12 bronze) to boards exported before the
// medal markup was added - the 2024 board carries the same split natively.
const apac = (y, opts = {}) => ({
  series: 'apac',
  format: 'domjudge',
  year: y,
  url: `https://storage.googleapis.com/files.icpc.jp/championship${y}/standings.html`,
  key: `apac-${y}`,
  editionId: `e-icpc-apac-${y}`,
  idPrefix: `t-apac${y.slice(2)}`,
  slugSuffix: `apac${y.slice(2)}`,
  ...opts,
})

const BOARDS = [
  nat('2021'),
  nat('2022'),
  nat('2023'),
  nat('2024'),
  nat('2025'),
  reg('2021'),
  reg('2022'),
  reg('2023'),
  reg('2024'),
  reg('2025'),
  hsgs('2022', 'hsgs-scoreboard.html'),
  hsgs('2024', 'scoreboard-hsgs.html'),
  hsgs('2025', 'scoreboard-hsgs.html'),
  apac('2024'),
  apac('2025', { medalsByRank: true }),
  apac('2026', { medalsByRank: true }),
]

const fromDirIdx = process.argv.indexOf('--from-dir')
const fromDir = fromDirIdx > -1 ? process.argv[fromDirIdx + 1] : null
const onlyIdx = process.argv.indexOf('--only')
const only = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null

const seeds = JSON.parse(readFileSync(join(OUT, 'org-seeds.json'), 'utf8'))
const orgByRaw = new Map(seeds.flatMap((s) => s.raw.map((r) => [r, s])))

// Mirrors src/lib/text.ts slugify (diacritic-stripping, đ→d)
const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()

async function loadHtml(b) {
  if (fromDir)
    return readFileSync(join(fromDir, `icpcvn-${b.key}.html`), 'utf8')
  const res = await fetch(b.url)
  if (!res.ok) throw new Error(`${b.url} -> ${res.status}`)
  return res.text()
}

/** Split a <tr> body into top-level <td> chunks. */
function splitCells(rowHtml) {
  const cells = []
  const re = /<td([^>]*)>([\s\S]*?)<\/td>/g
  let m
  while ((m = re.exec(rowHtml))) cells.push({ attrs: m[1], html: m[2] })
  return cells
}

const MEDALS = [
  ['gold-medal', 'gold'],
  ['silver-medal', 'silver'],
  ['bronze-medal', 'bronze'],
]

function reportUnmapped(b, unmapped) {
  if (!unmapped.size) return
  console.error(`\n${b.key}: UNMAPPED ORG NAMES (add to org-seeds.json):`)
  unmapped.forEach((n) => console.error(`  - ${JSON.stringify(n)}`))
  process.exitCode = 1
}

/** Parsed rows → Team-shaped objects with unique ids/slugs. */
function buildTeams(b, teams) {
  const slugCount = new Map()
  return teams
    .sort((a, b2) => a.rank - b2.rank)
    .map((t, i) => {
      let slug = `${slugify(t.name) || 'team'}-${b.slugSuffix}`
      const n = (slugCount.get(slug) ?? 0) + 1
      slugCount.set(slug, n)
      if (n > 1) slug = `${slug}-${n}`
      return {
        id: `${b.idPrefix}-${i + 1}`,
        slug,
        name: t.name,
        organizationId: t.organizationId,
        contestEditionId: b.editionId,
        teamType: t.teamType,
        ...(t.countryCode ? { countryCode: t.countryCode } : {}),
        memberProfileIds: [],
        result: {
          rank: t.rank,
          ...(t.medal ? { medal: t.medal } : {}),
          solved: t.solved,
          penalty: t.penalty,
          problems: t.problems,
        },
      }
    })
}

function parseBoard(b, html) {
  const rows = html.match(/<tr[^>]*id="user-[^"]*"[\s\S]*?<\/tr>/g) ?? []
  const teams = []
  const unmapped = new Set()
  let problemCount = 0
  const problemCodes = [] // per column index, e.g. 'icpc_a' or 'kquery'

  for (const row of rows) {
    const cells = splitCells(row)
    const nameIdx = cells.findIndex((c) => c.attrs.includes('user-name'))
    const pointsIdx = cells.findIndex((c) => c.attrs.includes('user-points'))
    const penaltyIdx = cells.findIndex((c) => c.attrs.includes('user-penalty'))
    if (nameIdx === -1 || pointsIdx === -1 || penaltyIdx === -1) continue // header/banned rows

    const rankCell = cells[nameIdx - 1]
    const rank = parseInt(rankCell?.html.replace(/<[^>]*>/g, '').trim(), 10)
    if (!Number.isFinite(rank)) continue // unranked/disqualified
    const medal = MEDALS.find(([cls]) => rankCell.attrs.includes(cls))?.[1]

    const nameMatch = cells[nameIdx].html.match(
      /<a [^>]*>\s*([\s\S]*?)\s*<\/a>/
    )
    const teamName = decode(nameMatch?.[1].replace(/<[^>]*>/g, '') ?? '')
    const orgMatch =
      cells[nameIdx].html.match(/class="uni-name">([^<]*)</) ??
      cells[nameIdx].html.match(
        /<span class="organization"><a [^>]*>\s*([^<]*?)\s*<\/a><\/span>/
      ) ??
      cells[nameIdx].html.match(
        /<span class="organization"><a [^>]*>(?:<img[^>]*>)?<p class="[^"]*">([^<]*)<\/p>/
      )
    const rawOrg = decode(orgMatch?.[1] ?? '')
    const org = orgByRaw.get(rawOrg)
    if (!org) {
      unmapped.add(rawOrg)
      continue
    }

    const solved = parseInt(
      cells[pointsIdx].html.replace(/<[^>]*>/g, '').trim(),
      10
    )
    const penalty = parseInt(
      cells[penaltyIdx].html.replace(/<[^>]*>/g, '').trim(),
      10
    )
    if (!Number.isFinite(solved) || solved < 0) continue // banned/practice (-9999 marker)

    // Problem cells: every td that is not rank/name/points/penalty, in order.
    const problemCells = cells.filter(
      (c, i) =>
        i !== nameIdx - 1 &&
        i !== nameIdx &&
        i !== pointsIdx &&
        i !== penaltyIdx
    )
    if (problemCells.length > problemCount) problemCount = problemCells.length

    const problems = []
    problemCells.forEach((c, i) => {
      const label = String.fromCharCode(65 + i)
      const code = c.html.match(/\/submissions\/[^/]+\/([^/]+)\//)?.[1]
      if (code && !problemCodes[i]) problemCodes[i] = code
      const solvedAt = c.html.match(/solving-time-minute">(-?\d+)</)?.[1]
      const tries = c.html.match(/(\d+)\s*(?:tries|try)/)?.[1]
      const isSolved = /full-score/.test(c.attrs) || /full-score/.test(c.html)
      const firstSolve = /first-solve/.test(c.attrs)
      if (!tries && !isSolved) return // untouched
      const cell = { label, tries: tries ? parseInt(tries, 10) : 1 }
      if (isSolved && solvedAt != null)
        cell.solvedAt = Math.max(0, parseInt(solvedAt, 10))
      if (firstSolve) cell.firstSolve = true
      problems.push(cell)
    })

    teams.push({
      rank,
      medal,
      name: teamName,
      organizationId: org.id,
      countryCode: org.countryCode,
      teamType: org.type === 'university' ? 'university' : 'high_school',
      solved,
      penalty,
      problems,
    })
  }

  reportUnmapped(b, unmapped)
  const out = buildTeams(b, teams)

  // Problem set: statement URL from the submission origin where available
  const origin = html.match(
    /href="(https:\/\/[^"]+)\/contest\/[^"]+\/submissions\//
  )?.[1]
  const problemSet = Array.from({ length: problemCount }, (_, i) => {
    const label = String.fromCharCode(65 + i)
    const code = problemCodes[i]
    return code && origin
      ? { label, statementUrl: `${origin}/problem/${code}` }
      : { label }
  })

  return { teams: out, problems: problemSet, rawRows: rows.length }
}

/**
 * DOMjudge 8.x static scoreboard (files.icpc.jp APAC dumps). Cells:
 * scorepl = rank (+ medal class where awarded), scoretn = team (title holds
 * the untruncated "NN: name"; span.univ the affiliation), scorenc = solved,
 * scorett = penalty, then one score_cell per problem in column order.
 */
function parseDomjudge(b, html) {
  const rows = html.match(/<tr[^>]*id="team:[^"]*"[\s\S]*?<\/tr>/g) ?? []
  const teams = []
  const unmapped = new Set()

  for (const row of rows) {
    const cells = splitCells(row)
    const rankCell = cells.find((c) => c.attrs.includes('scorepl'))
    const nameCell = cells.find((c) => c.attrs.includes('scoretn'))
    const solvedCell = cells.find((c) => c.attrs.includes('scorenc'))
    const penaltyCell = cells.find((c) => c.attrs.includes('scorett'))
    if (!rankCell || !nameCell || !solvedCell || !penaltyCell) continue

    const rank = parseInt(rankCell.html.replace(/<[^>]*>/g, '').trim(), 10)
    if (!Number.isFinite(rank)) continue // unranked/exhibition
    let medal = MEDALS.find(([cls]) => rankCell.attrs.includes(cls))?.[1]
    if (!medal && b.medalsByRank && rank <= 12)
      medal = rank <= 4 ? 'gold' : rank <= 8 ? 'silver' : 'bronze'

    const title = nameCell.attrs.match(/title="([^"]*)"/)?.[1] ?? ''
    const teamName = decode(title).replace(/^\d+:\s*/, '')
    const rawOrg = decode(
      nameCell.html
        .match(/class="univ forceWidth">([\s\S]*?)<\/span>/)?.[1]
        .replace(/<[^>]*>/g, '') ?? ''
    )
    const org = orgByRaw.get(rawOrg)
    if (!org) {
      unmapped.add(rawOrg)
      continue
    }

    const solved = parseInt(solvedCell.html.replace(/<[^>]*>/g, '').trim(), 10)
    const penalty = parseInt(
      penaltyCell.html.replace(/<[^>]*>/g, '').trim(),
      10
    )

    const problems = []
    cells
      .filter((c) => c.attrs.includes('score_cell'))
      .forEach((c, i) => {
        const label = String.fromCharCode(65 + i)
        const div = c.html.match(/<div class="(score_[^"]*)">([\s\S]*?)<\/div>/)
        if (!div) return // untouched
        const isSolved = div[1].includes('score_correct')
        const tries = div[2].match(/(\d+)\s*(?:tries|try)/)?.[1]
        const solvedAt = div[2].match(/^\s*(\d+)/)?.[1] // leading minutes
        const cell = { label, tries: tries ? parseInt(tries, 10) : 1 }
        if (isSolved && solvedAt != null) cell.solvedAt = parseInt(solvedAt, 10)
        if (div[1].includes('score_first')) cell.firstSolve = true
        problems.push(cell)
      })

    teams.push({
      rank,
      medal,
      name: teamName,
      organizationId: org.id,
      countryCode: org.countryCode,
      teamType: org.type === 'university' ? 'university' : 'high_school',
      solved,
      penalty,
      problems,
    })
  }

  reportUnmapped(b, unmapped)

  // Problem names live in the header; no statement URLs on these dumps.
  const problemSet = [...html.matchAll(/<th title="problem ([^"]*)"/g)].map(
    (m, i) => ({ label: String.fromCharCode(65 + i), name: decode(m[1]) })
  )

  return {
    teams: buildTeams(b, teams),
    problems: problemSet,
    rawRows: rows.length,
  }
}

for (const b of BOARDS) {
  if (only && !String(b.key).startsWith(only)) continue
  const html = await loadHtml(b)
  const parse = b.format === 'domjudge' ? parseDomjudge : parseBoard
  const { teams, problems, rawRows } = parse(b, html)
  writeFileSync(
    join(OUT, `teams-${b.key}.json`),
    JSON.stringify(teams, null, 2) + '\n'
  )
  writeFileSync(
    join(OUT, `problems-${b.key}.json`),
    JSON.stringify(problems, null, 2) + '\n'
  )
  console.log(
    `${b.key}: ${teams.length} teams (of ${rawRows} rows), ${problems.length} problems, top: ${teams[0]?.name} (${teams[0]?.result.solved} solved)`
  )
}
