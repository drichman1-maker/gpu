import type { GPUWithPPD, PPDMetric, ValueRating } from './types'

// ─── Raw PPD Calculation ───────────────────────────────────────────────────────

export function calcRawPPD(benchmarkScore: number, price: number): number {
    if (price <= 0 || benchmarkScore <= 0) return 0
    return benchmarkScore / price
}

// ─── Market Median PPD ─────────────────────────────────────────────────────────

export function getMarketMedianPPD(gpus: Array<{ rawPPD: number }>): number {
    if (gpus.length === 0) return 1
    const sorted = gpus
        .map(g => g.rawPPD)
        .filter(ppd => ppd > 0)
        .sort((a, b) => a - b)
    if (sorted.length === 0) return 1
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2
}

// ─── Value Rating from normalized score ────────────────────────────────────────

function getValueRating(score: number): ValueRating {
    if (score >= 80) return 'Elite'
    if (score >= 65) return 'Great'
    if (score >= 50) return 'Good'
    if (score >= 35) return 'Fair'
    return 'Poor'
}

// ─── Compute PPD for a single GPU ──────────────────────────────────────────────

export function computePPD(
    benchmarkScore: number | null,
    price: number,
    allRawPPDs: number[]
): PPDMetric | null {
    if (!benchmarkScore || benchmarkScore <= 0 || price <= 0) return null

    const rawPPD = calcRawPPD(benchmarkScore, price)
    if (rawPPD <= 0) return null

    // Median of all GPUs with valid PPD
    const validPPDs = allRawPPDs.filter(p => p > 0).sort((a, b) => a - b)
    const mid = Math.floor(validPPDs.length / 2)
    const median = validPPDs.length % 2 !== 0
        ? validPPDs[mid] ?? 1
        : ((validPPDs[mid - 1] ?? 0) + (validPPDs[mid] ?? 0)) / 2 || 1

    // Normalize to 0-100 scale: median = 50
    const normalizedScore = Math.min(100, Math.max(0, (rawPPD / median) * 50))

    // Top 20% threshold
    const top20Index = Math.floor(validPPDs.length * 0.2)
    const top20Threshold = validPPDs[validPPDs.length - 1 - top20Index] ?? Infinity
    const isTop20 = rawPPD >= top20Threshold

    return {
        rawPPD,
        normalizedScore: Math.round(normalizedScore * 10) / 10,
        valueRating: getValueRating(normalizedScore),
        isTop20,
    }
}

// ─── Batch compute PPD for all GPUs ────────────────────────────────────────────

export function batchComputePPD(
    gpus: Array<{ benchmark_score: number | null; lowestPrice: number | null }>
): Map<string, PPDMetric> {
    // First pass: calculate raw PPD for all GPUs
    const rawPPDs: number[] = []
    const gpuRawPPDs: Array<{ slug: string; rawPPD: number }> = []

    for (const gpu of gpus as Array<{ slug: string; benchmark_score: number | null; lowestPrice: number | null }>) {
        if (gpu.benchmark_score && gpu.lowestPrice && gpu.lowestPrice > 0) {
            const rawPPD = calcRawPPD(gpu.benchmark_score, gpu.lowestPrice)
            if (rawPPD > 0) {
                rawPPDs.push(rawPPD)
                gpuRawPPDs.push({ slug: gpu.slug, rawPPD })
            }
        }
    }

    // Second pass: compute normalized scores
    const result = new Map<string, PPDMetric>()
    for (const { slug, rawPPD } of gpuRawPPDs) {
        const gpu = gpus.find(g => (g as any).slug === slug)
        if (gpu) {
            const ppd = computePPD(gpu.benchmark_score, gpu.lowestPrice!, rawPPDs)
            if (ppd) result.set(slug, ppd)
        }
    }
    return result
}

// ─── Comparison ────────────────────────────────────────────────────────────────

export function comparePPD(
    nameA: string,
    ppdA: PPDMetric | null,
    nameB: string,
    ppdB: PPDMetric | null
): string | null {
    if (!ppdA || !ppdB) return null
    if (ppdA.rawPPD === ppdB.rawPPD) return `${nameA} and ${nameB} offer identical performance per dollar.`
    const better = ppdA.rawPPD > ppdB.rawPPD ? nameA : nameB
    const worse = ppdA.rawPPD > ppdB.rawPPD ? nameB : nameA
    const pctDiff = Math.abs(((ppdA.rawPPD - ppdB.rawPPD) / Math.min(ppdA.rawPPD, ppdB.rawPPD)) * 100)
    return `The ${better} offers ${pctDiff.toFixed(1)}% better performance per dollar than the ${worse} at current prices.`
}

// ─── Color helpers ─────────────────────────────────────────────────────────────

export function getPPDColor(score: number): string {
    if (score >= 70) return 'var(--green)'
    if (score >= 45) return 'var(--yellow)'
    return 'var(--red)'
}

export function getPSUColor(watts: number): string {
    if (watts < 700) return 'var(--green)'
    if (watts < 850) return 'var(--yellow)'
    return 'var(--red)'
}
