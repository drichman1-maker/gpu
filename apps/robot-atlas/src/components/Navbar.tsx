import Link from 'next/link';
import Search from './Search';

export default function Navbar() {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold tracking-tighter hover:opacity-80 transition">
                    ROBOT<span className="text-cyan-400">ATLAS</span>
                </Link>

                <div className="hidden md:flex gap-8 text-sm font-medium text-gray-300">
                    <Link href="/rankings" className="hover:text-white transition">Rankings</Link>
                    <Link href="/compare/all" className="hover:text-white transition">Compare</Link>
                    <Link href="/blog" className="hover:text-white transition">Blog</Link>
                </div>

                <div className="flex gap-4">
                    <Search />
                </div>
            </div>
        </nav>
    );
}
