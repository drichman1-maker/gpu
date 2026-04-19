'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
    { href: '/gpu', label: 'All GPUs' },
    { href: '/gpu/refurb', label: 'Refurb' },
    { href: '/gpu-price-drops-today', label: 'Deals' },
    { href: '/compare', label: 'Compare' },
    { href: '/retailers', label: 'Retailers' },
    { href: '/blog', label: 'Blog' },
]

export function NavBar() {
    const path = usePathname()

    return (
        <nav className="nav">
            <div className="container">
                <div className="nav__inner">
                    <Link href="/" className="nav__brand">
                        ⚡ GPU<span>Drip</span>
                    </Link>

                    <div className="nav__links" style={{ display: 'flex', gap: 2 }}>
                        {LINKS.map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`nav__link ${path.startsWith(href) && href !== '/' ? 'nav__link--active' : path === href ? 'nav__link--active' : ''}`}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>

                    <Link href="/alerts" className="btn btn--outline" style={{ padding: '7px 14px', fontSize: 13 }}>
                        🔔 Price Alert
                    </Link>
                </div>
            </div>
        </nav>
    )
}
