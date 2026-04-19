/**
 * Compute the Robot Autonomy Index (RAI) total score.
 * All sub-scores are 0-100. The total is the average, rounded to the nearest integer.
 * Returns null if no valid scores are provided.
 */
export function computeRAI(
    navigation: number | null | undefined,
    obstacleAvoidance: number | null | undefined,
    automationLevel: number | null | undefined,
    maintenanceIndependence: number | null | undefined,
): number | null {
    const scores = [navigation, obstacleAvoidance, automationLevel, maintenanceIndependence]
        .map(s => (s == null || isNaN(Number(s)) ? null : Math.min(100, Math.max(0, Number(s)))))
        .filter((s): s is number => s !== null)

    if (scores.length === 0) return null

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    return Math.round(avg)
}

/**
 * Returns a human-readable label for an RAI score.
 */
export function raiLabel(score: number | null | undefined): string {
    if (score == null) return 'Unrated'
    if (score >= 90) return 'Elite Autonomous'
    if (score >= 80) return 'Highly Autonomous'
    if (score >= 70) return 'Autonomous'
    if (score >= 60) return 'Semi-Autonomous'
    if (score >= 50) return 'Assisted'
    return 'Manual'
}
