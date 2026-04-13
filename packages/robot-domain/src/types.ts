export type RobotStatus = 'announced' | 'released' | 'discontinued';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  website: string;
  logoUrl?: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
}

export interface Feature {
  id: string;
  name: string;
  slug: string; // e.g., 'lidar-navigation', 'self-emptying'
  categoryId: string;
  description?: string;
}

export interface RobotFeature {
  robotId: string;
  featureId: string;
  value?: string; // For specs like "5000Pa", "200 mins"
  booleanValue?: boolean; // For yes/no features
}

export interface Price {
  id: string;
  robotId: string;
  retailerId: string;
  currency: string;
  amount: number;
  url: string;
  timestamp: Date;
  isPromo: boolean;
}

export interface AutonomyScore {
  robotId: string;
  navigationScore: number; // 0-100
  obstacleAvoidanceScore: number; // 0-100
  automationLevel: number; // 0-100
  maintenanceIndependence: number; // 0-100
  totalScore: number; // 0-100
  generatedAt: Date;
}

export interface Robot {
  id: string;
  brandId: string;
  categoryId: string;
  modelName: string;
  slug: string; // unique identifier
  status: RobotStatus;
  releaseDate?: Date;
  
  // Images
  mainImage: string;
  imageGallery: string[];

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Computed
  lowestPrice?: number;
  autonomyScore?: number;
}

export interface Comparison {
  id: string;
  robotAId: string;
  robotBId: string;
  views: number;
  lastGenerated: Date;
}
