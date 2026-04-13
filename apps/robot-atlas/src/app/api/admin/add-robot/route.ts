import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

const ADMIN_KEY = 'robotatlas-admin-2026'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(req: NextRequest) {
  // Auth check
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== ADMIN_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      modelName,
      brand,
      category = 'robot-vacuums',
      status = 'released',
      price,
      amazonUrl,
      mainImage,
      navigationScore,
      obstacleAvoidanceScore,
      automationLevel,
      maintenanceIndependence,
    } = body

    if (!modelName || !brand) {
      return NextResponse.json({ success: false, error: 'Model name and brand are required' }, { status: 400 })
    }

    const slug = generateSlug(modelName)
    const brandSlug = generateSlug(brand)

    // Compute total score
    const scores = [navigationScore, obstacleAvoidanceScore, automationLevel, maintenanceIndependence]
      .map(Number)
      .filter(s => !isNaN(s) && s >= 0 && s <= 100)
    const totalScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null

    // 1. Upsert brand
    await sql`
      INSERT INTO brands (name, slug)
      VALUES (${brand}, ${brandSlug})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    `

    // 2. Get brand id
    const brandResult = await sql`SELECT id FROM brands WHERE slug = ${brandSlug}`
    const brandId = brandResult.rows[0]?.id
    if (!brandId) throw new Error('Failed to get brand ID')

    // 3. Get or create category
    await sql`
      INSERT INTO categories (name, slug)
      VALUES ('Robot Vacuums', ${category})
      ON CONFLICT (slug) DO NOTHING
    `
    const catResult = await sql`SELECT id FROM categories WHERE slug = ${category}`
    const categoryId = catResult.rows[0]?.id
    if (!categoryId) throw new Error('Failed to get category ID')

    // 4. Upsert robot
    await sql`
      INSERT INTO robots (brand_id, category_id, model_name, slug, status, main_image)
      VALUES (${brandId}, ${categoryId}, ${modelName}, ${slug}, ${status}, ${mainImage || null})
      ON CONFLICT (slug) DO UPDATE SET
        brand_id = EXCLUDED.brand_id,
        category_id = EXCLUDED.category_id,
        model_name = EXCLUDED.model_name,
        status = EXCLUDED.status,
        main_image = EXCLUDED.main_image,
        updated_at = NOW()
    `

    // 5. Get robot id
    const robotResult = await sql`SELECT id FROM robots WHERE slug = ${slug}`
    const robotId = robotResult.rows[0]?.id
    if (!robotId) throw new Error('Failed to get robot ID')

    // 6. Upsert autonomy scores
    if (totalScore !== null) {
      await sql`
        INSERT INTO autonomy_scores (
          robot_id, navigation_score, obstacle_avoidance_score,
          automation_level, maintenance_independence, total_score
        )
        VALUES (
          ${robotId},
          ${Number(navigationScore) || null},
          ${Number(obstacleAvoidanceScore) || null},
          ${Number(automationLevel) || null},
          ${Number(maintenanceIndependence) || null},
          ${totalScore}
        )
        ON CONFLICT (robot_id) DO UPDATE SET
          navigation_score = EXCLUDED.navigation_score,
          obstacle_avoidance_score = EXCLUDED.obstacle_avoidance_score,
          automation_level = EXCLUDED.automation_level,
          maintenance_independence = EXCLUDED.maintenance_independence,
          total_score = EXCLUDED.total_score,
          generated_at = NOW()
      `
    }

    // 7. Insert price if provided
    const priceNum = Number(price)
    if (priceNum > 0 && amazonUrl) {
      // Get or create Amazon retailer
      await sql`
        INSERT INTO retailers (name, slug, base_url, affiliate_tag)
        VALUES ('Amazon', 'amazon', 'https://amazon.com', 'Theresmac-20')
        ON CONFLICT (slug) DO NOTHING
      `
      const retailerResult = await sql`SELECT id FROM retailers WHERE slug = 'amazon'`
      const retailerId = retailerResult.rows[0]?.id

      if (retailerId) {
        await sql`
          INSERT INTO prices (robot_id, retailer_id, amount, url)
          VALUES (${robotId}, ${retailerId}, ${priceNum}, ${amazonUrl})
        `
      }
    }

    return NextResponse.json({ success: true, slug })
  } catch (err) {
    console.error('[admin/add-robot] error:', err)
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
