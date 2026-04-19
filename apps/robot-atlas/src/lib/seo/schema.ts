import { Robot, Brand, Price } from '../types';

export function generateProductSchema(robot: Robot, brand: Brand, prices: Price[]) {
    const lowPrice = Math.min(...prices.map(p => p.amount));
    const highPrice = Math.max(...prices.map(p => p.amount));

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: robot.modelName,
        image: robot.imageGallery,
        description: robot.metaDescription,
        brand: {
            '@type': 'Brand',
            name: brand.name
        },
        offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'USD',
            lowPrice: lowPrice,
            highPrice: highPrice,
            offerCount: prices.length
        },
        additionalProperty: [
            {
                '@type': 'PropertyValue',
                name: 'Robot Autonomy Index',
                value: robot.autonomyScore
            }
        ]
    };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `https://robotatlas.com${item.url}`
        }))
    };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer
            }
        }))
    };
}
