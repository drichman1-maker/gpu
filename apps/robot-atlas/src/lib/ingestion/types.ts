import { Robot, Price } from '../types';

export interface RawProductData {
    url: string;
    title: string;
    price: number;
    currency: string;
    originalPrice?: number;
    availability: boolean;
    specifications: Record<string, string>;
    images: string[];
    description: string;
    retailerId: string;
}

export interface NormalizedRobotSpec {
    modelName: string;
    suctionPowerPa?: number;
    batteryLifeMin?: number;
    dustbinCapacityMl?: number;
    moppingType?: 'none' | 'static' | 'vibrating' | 'rotating';
    navigationType?: 'lidar' | 'vslam' | 'gyro' | 'random';
    selfEmptying?: boolean;
    obstacleAvoidance?: boolean;
    noiseLevelDb?: number;
}

export interface IngestionResult {
    success: boolean;
    robot?: Partial<Robot>;
    price?: Partial<Price>;
    specs?: NormalizedRobotSpec;
    errors?: string[];
}

export interface RetailerAdapter {
    retailerId: string;
    retailerName: string;

    /**
     * Fetches product data from a specific URL
     */
    fetchProduct(url: string): Promise<RawProductData>;

    /**
     * Search for products based on a query (e.g. "robot vacuum")
     */
    searchProducts(query: string): Promise<RawProductData[]>;
}

export interface Normalizer {
    normalizeSpecs(rawSpecs: Record<string, string>): NormalizedRobotSpec;
    calculateAutonomyScore(specs: NormalizedRobotSpec): number;
}
