'use client'

import React from 'react'

export interface NavLink {
    href: string
    label: string
}

export interface SiteNavProps {
    /** Brand element — can be a string or ReactNode (e.g. styled span) */
    brand: React.ReactNode
    /** Navigation links */
    links?: NavLink[]
    /** Right-side actions (buttons, search, etc.) */
    actions?: React.ReactNode
    /** Current pathname for active link highlighting */
    currentPath?: string
}

export function SiteNav({ brand, links = [], actions, currentPath }: SiteNavProps) {
    return (
        <nav
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }}
        >
            <div
                style={{
                    maxWidth: 1280,
                    margin: '0 auto',
                    padding: '0 16px',
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                {/* Brand */}
                <a
                    href="/"
                    style={{
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: '-0.04em',
                        color: '#fff',
                        textDecoration: 'none',
                        transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => {
                        ;(e.currentTarget as HTMLAnchorElement).style.opacity = '0.75'
                    }}
                    onMouseLeave={e => {
                        ;(e.currentTarget as HTMLAnchorElement).style.opacity = '1'
                    }}
                >
                    {brand}
                </a>

                {/* Links */}
                {links.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            gap: 28,
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        {links.map(link => {
                            const isActive = currentPath === link.href
                            return (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    style={{
                                        color: isActive ? '#fff' : '#9ca3af',
                                        textDecoration: 'none',
                                        transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        ;(e.currentTarget as HTMLAnchorElement).style.color = '#fff'
                                    }}
                                    onMouseLeave={e => {
                                        ;(e.currentTarget as HTMLAnchorElement).style.color = isActive
                                            ? '#fff'
                                            : '#9ca3af'
                                    }}
                                >
                                    {link.label}
                                </a>
                            )
                        })}
                    </div>
                )}

                {/* Actions */}
                {actions && <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{actions}</div>}
            </div>
        </nav>
    )
}
