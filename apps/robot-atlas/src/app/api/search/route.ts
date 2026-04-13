import { NextRequest, NextResponse } from 'next/server'
import { getRobots } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.toLowerCase().trim() ?? ''

  if (!q) {
    return NextResponse.json({ results: [] })
  }

  try {
    const robots = await getRobots()
    const results = robots
      .filter(r =>
        r.modelName.toLowerCase().includes(q) ||
        r.brandId.toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map(r => ({
        id: r.id,
        name: r.modelName,
        brand: r.brandId,
        slug: `/robot/${r.slug}`,
        score: r.autonomyScore ?? null,
        type: 'robot' as const,
      }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
