export class Monetization {
    private static AMAZON_TAG = 'robotatlas-20';
    private static BESTBUY_ID = '1234567'; // Example affiliate ID

    /**
     * Wraps a raw product URL with the appropriate affiliate tracking parameters.
     */
    static wrapUrl(url: string, retailerId?: string): string {
        const affiliateUrl = new URL(url);

        if (url.includes('amazon.com')) {
            affiliateUrl.searchParams.set('tag', this.AMAZON_TAG);
            return affiliateUrl.toString();
        }

        if (url.includes('bestbuy.com')) {
            // BestBuy usually uses a distinct impact radius link structure which is more complex
            // For this mock, we append a ref id
            affiliateUrl.searchParams.set('ref', this.BESTBUY_ID);
            return affiliateUrl.toString();
        }

        return url;
    }

    static getBuyButtonLabel(retailerName: string): string {
        if (retailerName.toLowerCase().includes('amazon')) return 'Check Price on Amazon';
        if (retailerName.toLowerCase().includes('best buy')) return 'View at Best Buy';
        return 'View Retailer';
    }
}
