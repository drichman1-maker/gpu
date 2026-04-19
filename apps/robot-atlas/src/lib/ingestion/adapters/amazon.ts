import { RetailerAdapter, RawProductData } from '../types';

export class AmazonAdapter implements RetailerAdapter {
    retailerId = 'AMZ-001';
    retailerName = 'Amazon';

    async fetchProduct(url: string): Promise<RawProductData> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock data based on URL (deterministic for testing)
        const isRoborock = url.includes('roborock');

        return {
            url,
            title: isRoborock
                ? 'Roborock S8 Pro Ultra Robot Vacuum and Mop, Auto Drying, Self Emptying, Self Refilling, AI Obstacle Avoidance'
                : 'iRobot Roomba j7+ Self-Emptying Robot Vacuum - Avoids Pet Waste, Smart Mapping',
            price: isRoborock ? 1599.99 : 799.00,
            currency: 'USD',
            availability: true,
            specifications: {
                'Model Name': isRoborock ? 'S8 Pro Ultra' : 'j7+',
                'Suction Power': isRoborock ? '6000Pa' : '2000Pa', // Roomba doesn't publish Pa usually, mock value
                'Runtime': isRoborock ? '180 min' : '75 min',
                'Navigation': isRoborock ? 'Lidar + RGB Camera' : 'VSLAM + Camera',
                'Mop': isRoborock ? 'Vibrating' : 'None',
                'Self Empty': 'Yes',
                'Obstacle Avoidance': 'Yes',
                'Noise': '68dB'
            },
            images: [
                'https://example.com/img1.jpg',
                'https://example.com/img2.jpg'
            ],
            description: 'Advanced robot vacuum...',
            retailerId: this.retailerId
        };
    }

    async searchProducts(query: string): Promise<RawProductData[]> {
        return [
            await this.fetchProduct('https://amazon.com/roborock-s8'),
            await this.fetchProduct('https://amazon.com/roomba-j7')
        ];
    }
}
