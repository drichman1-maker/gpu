import { NormalizedRobotSpec } from './types';

export class Normalizer {

    /**
     * Normalizes raw key-value specs into a structured format
     */
    normalizeSpecs(rawSpecs: Record<string, string>): NormalizedRobotSpec {
        const specs: NormalizedRobotSpec = {
            modelName: rawSpecs['model_name'] || rawSpecs['Model Name'] || 'Unknown Model',
            suctionPowerPa: this.parseSuction(rawSpecs),
            batteryLifeMin: this.parseBattery(rawSpecs),
            dustbinCapacityMl: this.parseCapacity(rawSpecs),
            moppingType: this.determineMoppingType(rawSpecs),
            navigationType: this.determineNavigation(rawSpecs),
            selfEmptying: this.checkBoolean(rawSpecs, ['self_empty', 'auto_empty', 'base_station']),
            obstacleAvoidance: this.checkBoolean(rawSpecs, ['obstacle_avoidance', 'ai_avoidance', 'camera']),
            noiseLevelDb: this.parseNoise(rawSpecs),
        };

        return specs;
    }

    /**
     * PATENT-PENDING: Robot Autonomy Index (RAI) Scoring System
     * Scores robots from 0-100 based on their ability to operate without human intervention.
     */
    calculateAutonomyScore(specs: NormalizedRobotSpec): number {
        let score = 0;
        const weights = {
            navigation: 30,
            maintenance: 25,
            obstacleAvoidance: 25,
            automation: 20
        };

        // 1. Navigation Intelligence (0-30 pts)
        if (specs.navigationType === 'lidar' || specs.navigationType === 'vslam') score += 30;
        else if (specs.navigationType === 'gyro') score += 15;
        else score += 5; // Random bounce

        // 2. Obstacle Avoidance (0-25 pts)
        if (specs.obstacleAvoidance) score += 25;

        // 3. Maintenance Independence (0-25 pts)
        if (specs.selfEmptying) score += 25;

        // 4. Automation Level (0-20 pts)
        // Bonus for combo of features
        if (specs.moppingType && specs.moppingType !== 'none') {
            // If it mops and self-empties, that's high automation
            if (specs.selfEmptying) score += 10;
            // If it has advanced mopping (rotating/vibrating)
            if (specs.moppingType === 'rotating' || specs.moppingType === 'vibrating') score += 10;
        } else {
            // Pure vacuum automation bonus
            if (specs.batteryLifeMin && specs.batteryLifeMin > 120) score += 10;
        }

        return Math.min(Math.max(Math.round(score), 0), 100);
    }

    // Parses "5000Pa" or "5000 Pa" -> 5000
    private parseSuction(specs: Record<string, string>): number | undefined {
        const val = specs['suction'] || specs['Suction Power'];
        if (!val) return undefined;
        const match = val.match(/(\d+)/);
        return match ? parseInt(match[0]) : undefined;
    }

    private parseBattery(specs: Record<string, string>): number | undefined {
        const val = specs['battery_life'] || specs['Runtime'];
        if (!val) return undefined;
        const match = val.match(/(\d+)/); // assumes minutes
        return match ? parseInt(match[0]) : undefined;
    }

    private parseCapacity(specs: Record<string, string>): number | undefined {
        const val = specs['dustbin_capacity'] || specs['Capacity'];
        if (!val) return undefined;
        const match = val.match(/(\d+)/);
        return match ? parseInt(match[0]) : undefined;
    }

    private parseNoise(specs: Record<string, string>): number | undefined {
        const val = specs['noise_level'] || specs['Noise'];
        if (!val) return undefined;
        const match = val.match(/(\d+)/);
        return match ? parseInt(match[0]) : undefined;
    }

    private determineNavigation(specs: Record<string, string>): NormalizedRobotSpec['navigationType'] {
        const val = (specs['navigation'] || specs['Navigation'] || '').toLowerCase();
        if (val.includes('lidar') || val.includes('laser')) return 'lidar';
        if (val.includes('camera') || val.includes('vslam') || val.includes('visual')) return 'vslam';
        if (val.includes('gyro')) return 'gyro';
        return 'random';
    }

    private determineMoppingType(specs: Record<string, string>): NormalizedRobotSpec['moppingType'] {
        const val = (specs['mopping'] || specs['Mop'] || '').toLowerCase();
        if (val.includes('rotating') || val.includes('spin')) return 'rotating';
        if (val.includes('vibrating') || val.includes('sonic')) return 'vibrating';
        if (val.includes('static') || val.includes('drag') || val.includes('cloth')) return 'static';
        return 'none';
    }

    private checkBoolean(specs: Record<string, string>, keys: string[]): boolean {
        for (const key of keys) {
            const val = specs[key] || specs[key.replace('_', ' ')] || '';
            if (val.toLowerCase() === 'yes' || val.toLowerCase() === 'true') return true;
        }
        return false;
    }
}
