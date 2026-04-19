import Link from 'next/link';
import { Robot } from '../lib/types';

interface ProductCardProps {
    robot: Robot;
}

function RobotImagePlaceholder() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-900 to-black">
            <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <circle cx="12" cy="12" r="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
            </svg>
            <span className="text-gray-700 text-xs uppercase tracking-widest">No image</span>
        </div>
    );
}

export default function ProductCard({ robot }: ProductCardProps) {
    const brandDisplay = (robot as { brandName?: string }).brandName ?? robot.brandId;

    return (
        <div className="group relative rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-cyan-500/50 transition duration-300">
            <div className="aspect-square bg-black/20 relative">
                {/* RAI Badge */}
                {robot.autonomyScore != null && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/80 backdrop-blur rounded text-xs border border-white/20 z-10">
                        RAI <span className="text-cyan-400 font-bold">{robot.autonomyScore}</span>
                    </div>
                )}

                {/* Robot Image */}
                {robot.mainImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={robot.mainImage}
                        alt={robot.modelName}
                        className="w-full h-full object-contain p-6 opacity-90 group-hover:opacity-100 transition duration-300"
                        loading="lazy"
                    />
                ) : (
                    <RobotImagePlaceholder />
                )}
            </div>

            <div className="p-4">
                <div className="text-xs text-cyan-400 mb-1 uppercase tracking-widest">{brandDisplay}</div>
                <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-cyan-300 transition">
                    <Link href={`/robot/${robot.slug}`}>
                        {robot.modelName}
                    </Link>
                </h3>

                <div className="flex justify-between items-end mt-4">
                    <div className="text-xl font-bold text-white">
                        {robot.lowestPrice != null ? `$${robot.lowestPrice.toLocaleString()}` : <span className="text-gray-600 text-sm">Price TBD</span>}
                    </div>
                    <Link
                        href={`/rankings`}
                        className="text-xs text-gray-400 hover:text-cyan-400 underline decoration-gray-600 underline-offset-4 transition"
                    >
                        Compare →
                    </Link>
                </div>
            </div>
        </div>
    );
}
