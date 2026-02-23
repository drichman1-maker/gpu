'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
    { href: '/', label: 'Markets' },
    { href: '/gpu', label: 'All GPUs' },
    { href: '/gpu-price-drops-today', label: 'Drops Today' },
    { href: '/best-gpu-under-500', label: 'Best Deals' },
]

export function NavBar() {
    const path = usePathname()

    return (
        <nav className="nav">
            <div className="container">
                <div className="nav__inner">
                    <Link href="/" className="nav__brand">
                        ⚡ GPU<span>Watch</span>
                    </Link>

                    <div className="nav__links" style={{ display: 'flex', gap: 2 }}>
                        {LINKS.map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`nav__link ${path === href ? 'nav__link--active' : ''}`}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>

                    <Link href="/alerts" className="btn btn--outline" style={{ padding: '7px 14px', fontSize: 13 }}>
                        🔔 Set Alert
                    </Link>
                </div>
            </div>
        </nav>
    )
}
