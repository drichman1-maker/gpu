import { RetailerAdapter, IngestionResult, RawProductData } from './types';
import { AmazonAdapter } from './adapters/amazon';
import { BestBuyAdapter } from './adapters/bestbuy';
import { Normalizer } from './normalizer';
import { Robot, Price, RobotStatus } from '../types';

export class IngestionPipeline {
    private adapters: RetailerAdapter[];
    private normalizer: Normalizer;

    constructor() {
        this.adapters = [
            new AmazonAdapter(),
            new BestBuyAdapter()
        ];
        this.normalizer = new Normalizer();
    }

    async ingestFromUrl(url: string): Promise<IngestionResult> {
        const adapter = this.findAdapter(url);
        if (!adapter) {
            return { success: false, errors: [`No adapter found for URL: ${url}`] };
        }

        try {
            const rawData = await adapter.fetchProduct(url);
            return this.processRawData(rawData);
        } catch (error) {
            return { success: false, errors: [(error as Error).message] };
        }
    }

    private findAdapter(url: string): RetailerAdapter | undefined {
        if (url.includes('amazon')) return this.adapters.find(a => a.retailerId.startsWith('AMZ'));
        if (url.includes('bestbuy')) return this.adapters.find(a => a.retailerId.startsWith('BBY'));
        return undefined;
    }

    private processRawData(raw: RawProductData): IngestionResult {
        const specs = this.normalizer.normalizeSpecs(raw.specifications);
        const raiScore = this.normalizer.calculateAutonomyScore(specs);

        const robot: Partial<Robot> = {
            modelName: specs.modelName,
            status: 'released' as RobotStatus,
            mainImage: raw.images[0],
            imageGallery: raw.images,
            autonomyScore: raiScore,
            // slug would be generated here or in DB service
            slug: this.generateSlug(raw.title)
        };

        const price: Partial<Price> = {
            amount: raw.price,
            currency: raw.currency,
            url: raw.url,
            retailerId: raw.retailerId,
            timestamp: new Date(),
            isPromo: false // logic to determine if promo
        };

        return {
            success: true,
            robot,
            price,
            specs
        };
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
}
