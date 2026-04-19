import { Robot } from '../types';

/**
 * The Internal Linking Machine
 * Automatically connects:
 * Robot -> Alternatives (same category, similar price)
 * Robot -> Comparisons (same brand or top competitors)
 * Robot -> Category hubs
 */
export function getRelatedEntities(currentRobot: Robot, allRobots: Robot[]) {
    const alternatives: Robot[] = allRobots.filter(r =>
        r.id !== currentRobot.id &&
        r.categoryId === currentRobot.categoryId &&
        Math.abs((r.lowestPrice || 0) - (currentRobot.lowestPrice || 0)) < 200
    ).slice(0, 3);

    const sameBrand = allRobots.filter(r =>
        r.id !== currentRobot.id &&
        r.brandId === currentRobot.brandId
    ).slice(0, 3);

    const comparisons = alternatives?.map(r => ({
        url: `/compare/${currentRobot.slug}-vs-${r.slug}`,
        anchor: `${currentRobot.modelName} vs ${r.modelName}`
    })) || [];

  return {
    alternatives,
    sameBrand,
    comparisons
  };
}
