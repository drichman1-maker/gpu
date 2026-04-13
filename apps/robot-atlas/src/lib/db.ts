import { sql } from '@vercel/postgres'
import { Robot } from './types'
import { MOCK_ROBOTS } from './mockData'

// ---------------------------------------------------------------------------
// Helper: check if DB is configured
// ---------------------------------------------------------------------------

function isDbConfigured(): boolean {
  return Boolean(process.env.POSTGRES_URL)
}

// ---------------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------------

interface RobotRow {
  id: string
  brand_id: string
  category_id: string
  model_name: string
  slug: string
  status: string
  release_date: string | null
  main_image: string | null
  image_gallery: string[] | null
  meta_title: string | null
  meta_description: string | null
  total_score: number | null
  navigation_score: number | null
  obstacle_avoidance_score: number | null
  automation_level: number | null
  maintenance_independence: number | null
  lowest_price: number | null
  brand_name: string | null
  brand_slug: string | null
  affiliate_url: string | null
}

// Extended type for detail page
export interface RobotDetail extends Robot {
  navigationScore?: number
  obstacleAvoidanceScore?: number
  automationLevel?: number
  maintenanceIndependence?: number
  brandName?: string
  brandSlug?: string
  affiliateUrl?: string
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function rowToRobot(row: RobotRow): Robot {
  return {
    id: row.id,
    brandId: row.brand_slug ?? row.brand_id,
    categoryId: row.category_id,
    modelName: row.model_name,
    slug: row.slug,
    status: row.status as Robot['status'],
    releaseDate: row.release_date ? new Date(row.release_date) : undefined,
    mainImage: row.main_image ?? '',
    imageGallery: row.image_gallery ?? [],
    metaTitle: row.meta_title ?? undefined,
    metaDescription: row.meta_description ?? undefined,
    autonomyScore: row.total_score ?? undefined,
    lowestPrice: row.lowest_price ?? undefined,
  }
}

function rowToRobotDetail(row: RobotRow): RobotDetail {
  return {
    ...rowToRobot(row),
    navigationScore: row.navigation_score ?? undefined,
    obstacleAvoidanceScore: row.obstacle_avoidance_score ?? undefined,
    automationLevel: row.automation_level ?? undefined,
    maintenanceIndependence: row.maintenance_independence ?? undefined,
    brandName: row.brand_name ?? undefined,
    brandSlug: row.brand_slug ?? undefined,
    affiliateUrl: row.affiliate_url ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/**
 * Fetch all robots. Falls back to mock data if DB not configured.
 */
export async function getRobots(): Promise<Robot[]> {
  if (!isDbConfigured()) return MOCK_ROBOTS

  try {
    const { rows } = await sql<RobotRow>`
      SELECT
        r.*,
        b.name AS brand_name,
        b.slug AS brand_slug,
        a.total_score,
        a.navigation_score,
        a.obstacle_avoidance_score,
        a.automation_level,
        a.maintenance_independence,
        p.min_amount AS lowest_price,
        p.affiliate_url
      FROM robots r
      LEFT JOIN brands b ON b.id = r.brand_id
      LEFT JOIN autonomy_scores a ON a.robot_id = r.id
      LEFT JOIN (
        SELECT robot_id, MIN(amount) AS min_amount, MAX(url) AS affiliate_url
        FROM prices
        GROUP BY robot_id
      ) p ON p.robot_id = r.id
      ORDER BY r.created_at DESC
    `
    return rows.map(rowToRobot)
  } catch (err) {
    console.error('[db] getRobots error:', err)
    return MOCK_ROBOTS
  }
}

/**
 * Fetch a single robot with full detail by slug.
 */
export async function getRobotBySlug(slug: string): Promise<RobotDetail | null> {
  if (!isDbConfigured()) {
    const r = MOCK_ROBOTS.find((r) => r.slug === slug)
    return r ? { ...r, brandName: r.brandId } : null
  }

  try {
    const { rows } = await sql<RobotRow>`
      SELECT
        r.*,
        b.name AS brand_name,
        b.slug AS brand_slug,
        a.total_score,
        a.navigation_score,
        a.obstacle_avoidance_score,
        a.automation_level,
        a.maintenance_independence,
        p.min_amount AS lowest_price,
        p.affiliate_url
      FROM robots r
      LEFT JOIN brands b ON b.id = r.brand_id
      LEFT JOIN autonomy_scores a ON a.robot_id = r.id
      LEFT JOIN (
        SELECT robot_id, MIN(amount) AS min_amount, MAX(url) AS affiliate_url
        FROM prices
        GROUP BY robot_id
      ) p ON p.robot_id = r.id
      WHERE r.slug = ${slug}
      LIMIT 1
    `
    return rows[0] ? rowToRobotDetail(rows[0]) : null
  } catch (err) {
    console.error('[db] getRobotBySlug error:', err)
    const r = MOCK_ROBOTS.find((r) => r.slug === slug)
    return r ? { ...r, brandName: r.brandId } : null
  }
}

/**
 * Fetch top robots sorted by autonomy score descending.
 */
export async function getTopRobots(limit = 10): Promise<Robot[]> {
  if (!isDbConfigured()) {
    return [...MOCK_ROBOTS]
      .sort((a, b) => (b.autonomyScore ?? 0) - (a.autonomyScore ?? 0))
      .slice(0, limit)
  }

  try {
    const { rows } = await sql<RobotRow>`
      SELECT
        r.*,
        b.name AS brand_name,
        b.slug AS brand_slug,
        a.total_score,
        a.navigation_score,
        a.obstacle_avoidance_score,
        a.automation_level,
        a.maintenance_independence,
        p.min_amount AS lowest_price,
        p.affiliate_url
      FROM robots r
      LEFT JOIN brands b ON b.id = r.brand_id
      INNER JOIN autonomy_scores a ON a.robot_id = r.id
      LEFT JOIN (
        SELECT robot_id, MIN(amount) AS min_amount, MAX(url) AS affiliate_url
        FROM prices
        GROUP BY robot_id
      ) p ON p.robot_id = r.id
      ORDER BY a.total_score DESC
      LIMIT ${limit}
    `
    return rows.map(rowToRobot)
  } catch (err) {
    console.error('[db] getTopRobots error:', err)
    return [...MOCK_ROBOTS]
      .sort((a, b) => (b.autonomyScore ?? 0) - (a.autonomyScore ?? 0))
      .slice(0, limit)
  }
}

/**
 * Count total robots in the index.
 */
export async function getRobotCount(): Promise<number> {
  if (!isDbConfigured()) return MOCK_ROBOTS.length

  try {
    const { rows } = await sql<{ count: string }>`SELECT COUNT(*)::text AS count FROM robots`
    return parseInt(rows[0]?.count ?? '0', 10)
  } catch (err) {
    console.error('[db] getRobotCount error:', err)
    return MOCK_ROBOTS.length
  }
}

/**
 * Get average autonomy score across all scored robots.
 */
export async function getAvgAutonomyScore(): Promise<number> {
  if (!isDbConfigured()) {
    const scored = MOCK_ROBOTS.filter((r) => r.autonomyScore != null)
    if (scored.length === 0) return 0
    const sum = scored.reduce((acc, r) => acc + (r.autonomyScore ?? 0), 0)
    return Math.round((sum / scored.length) * 10) / 10
  }

  try {
    const { rows } = await sql<{ avg: string }>`
      SELECT ROUND(AVG(total_score)::numeric, 1)::text AS avg FROM autonomy_scores
    `
    return parseFloat(rows[0]?.avg ?? '0')
  } catch (err) {
    console.error('[db] getAvgAutonomyScore error:', err)
    return 0
  }
}

/**
 * Count total brands in the index.
 */
export async function getBrandCount(): Promise<number> {
  if (!isDbConfigured()) {
    const brands = new Set(MOCK_ROBOTS.map((r) => r.brandId))
    return brands.size
  }

  try {
    const { rows } = await sql<{ count: string }>`SELECT COUNT(*)::text AS count FROM brands`
    return parseInt(rows[0]?.count ?? '0', 10)
  } catch (err) {
    console.error('[db] getBrandCount error:', err)
    const brands = new Set(MOCK_ROBOTS.map((r) => r.brandId))
    return brands.size
  }
}
