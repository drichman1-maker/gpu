'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type SearchResult = {
    id: string;
    name: string;
    brand: string;
    slug: string;
    score: number | null;
    type: 'robot';
};

export default function Search() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Handle Ctrl+K / Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const search = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setResults(data.results ?? []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => search(query), 200);
        return () => clearTimeout(timer);
    }, [query, search]);

    function close() {
        setIsOpen(false);
        setQuery('');
        setResults([]);
    }

    function navigate(slug: string) {
        router.push(slug);
        close();
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-gray-400 transition group"
                aria-label="Search robots"
            >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search RobotAtlas...</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono bg-white/10 rounded border border-white/10 group-hover:border-cyan-500/30 transition">
                    {typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? '⌘K' : 'Ctrl K'}
                </kbd>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                onClick={close}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                {/* Input */}
                <div className="flex items-center px-5 py-4 border-b border-white/10">
                    <svg className="w-5 h-5 text-cyan-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search robots by name or brand..."
                        className="flex-1 bg-transparent text-base text-white placeholder-gray-500 focus:outline-none"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && results.length > 0) {
                                navigate(results[0].slug);
                            }
                        }}
                    />
                    {loading && (
                        <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mr-2" />
                    )}
                    <button
                        onClick={close}
                        className="px-2 py-1 hover:bg-white/10 rounded text-gray-500 text-xs font-mono transition"
                    >
                        ESC
                    </button>
                </div>

                {/* Results */}
                {query && results.length > 0 && (
                    <div className="p-2 max-h-80 overflow-y-auto">
                        <div className="text-xs font-semibold text-gray-600 px-3 py-2 uppercase tracking-wider">
                            {results.length} result{results.length !== 1 ? 's' : ''}
                        </div>
                        {results.map(item => (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.slug)}
                                className="w-full flex items-center px-3 py-3 hover:bg-white/5 rounded-xl group transition text-left"
                            >
                                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mr-4 shrink-0">
                                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <circle cx="12" cy="12" r="3" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium group-hover:text-cyan-400 transition truncate">{item.name}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{item.brand}</div>
                                </div>
                                {item.score != null && (
                                    <div className="text-xs font-mono text-cyan-400 ml-3 shrink-0">
                                        RAI {item.score}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* No results */}
                {query && !loading && results.length === 0 && (
                    <div className="p-8 text-center text-gray-600">
                        No robots found for &ldquo;{query}&rdquo;
                    </div>
                )}

                {/* Empty state / suggestions */}
                {!query && (
                    <div className="p-5 bg-white/[0.02]">
                        <div className="text-xs text-gray-600 uppercase tracking-wider mb-3">Quick searches</div>
                        <div className="flex gap-2 flex-wrap">
                            {['Roborock', 'Dreame', 'iRobot', 'Roomba', 'Self-emptying'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setQuery(tag)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 rounded-full text-xs text-gray-400 hover:text-white transition"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
