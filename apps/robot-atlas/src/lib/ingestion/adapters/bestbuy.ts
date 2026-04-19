import { RetailerAdapter, RawProductData } from '../types';

export class BestBuyAdapter implements RetailerAdapter {
    retailerId = 'BBY-001';
    retailerName = 'Best Buy';

    async fetchProduct(url: string): Promise<RawProductData> {
        await new Promise(resolve => setTimeout(resolve, 300));

        return {
            url,
            title: 'Dreame L20 Ultra Robot Vacuum with Mop Extend Technology',
            price: 1099.99,
            currency: 'USD',
            availability: true,
            specifications: {
                'model_name': 'L20 Ultra',
                'suction': '7000Pa',
                'battery_life': '210 minutes',
                'navigation': 'LDS Laser + AI Action',
                'mopping': 'Rotating Mop Pads with Extensions',
                'self_empty': 'true',
                'obstacle_avoidance': 'true',
                'noise_level': '63 dB'
            },
            images: ['https://bestbuy.com/img/dreame.jpg'],
            description: 'The most advanced mop extension technology...',
            retailerId: this.retailerId
        };
    }

    async searchProducts(query: string): Promise<RawProductData[]> {
        return [
            await this.fetchProduct('https://bestbuy.com/dreame-l20')
        ];
    }
}
