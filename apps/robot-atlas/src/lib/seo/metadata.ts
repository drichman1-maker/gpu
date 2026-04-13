import { Robot } from '../types';

export function generateComparisonMetadata(robotA: Robot, robotB: Robot) {
    const title = `${robotA.modelName} vs ${robotB.modelName} (2026): Which is Better? | RobotAtlas`;
    const description = `Detailed comparison of ${robotA.modelName} vs ${robotB.modelName}. See which robot wins on suction power, navigation, and autonomy score.`;

    return { title, description };
}

export function generateIntentMetadata(intent: string, year: number = 2026) {
    const formattedIntent = intent.replace('-', ' ');
    const title = `Best Robot Vacuums for ${formattedIntent} (${year}) - Top Rated & Tested | RobotAtlas`;
    const description = `Looking for the best robot vacuum for ${formattedIntent}? We analyzed specs, autonomy scores, and prices to find the top performers for ${year}.`;

    return { title, description };
}

export function generateProductMetadata(robot: Robot) {
    const title = `${robot.modelName} Specs, Price History & Autonomy Score | RobotAtlas`;
    const description = `Full specifications for ${robot.modelName}. RAI Score: ${robot.autonomyScore}/100. Compare prices, features, and alternatives.`;

    return { title, description };
}
