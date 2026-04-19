'use client'

import React from 'react'
import { ScoreBadge } from './ScoreBadge'

export interface ProductCardProps {
    /** Product image URL */
    image?: string | null
    /** Brand display name */
    brand: string
    /** Model / product name */
    model: string
    /** Score value (0-100) */
    score?: number | null
    /** Score label, e.g. "RAI" or "PPD" */
    scoreLabel?: string
    /** Score badge color */
    scoreColor?: 'cyan' | 'violet' | 'green' | 'yellow' | 'white'
    /** Formatted price string, e.g. "$1,599.99" */
    price?: string | null
    /** Link to product detail page */
    href: string
    /** Link for the compare action (optional) */
    compareHref?: string
    /** Compare link label */
    compareLinkLabel?: string
    /** Placeholder content when no image available */
    placeholderIcon?: React.ReactNode
}

function DefaultPlaceholder() {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #111 0%, #000 100%)',
            }}
        >
            <svg
                style={{ width: 48, height: 48, color: '#374151' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
            >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
            </svg>
            <span style={{ color: '#374151', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                No image
            </span>
        </div>
    )
}

export function ProductCard({
    image,
    brand,
    model,
    score,
    scoreLabel = 'RAI',
    scoreColor = 'cyan',
    price,
    href,
    compareHref,
    compareLinkLabel = 'Compare →',
    placeholderIcon,
}: ProductCardProps) {
    return (
        <div
            style={{
                position: 'relative',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
                cursor: 'pointer',
            }}
            onMouseEnter={e => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(6,182,212,0.4)'
            }}
            onMouseLeave={e => {
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)'
            }}
        >
            {/* Image area */}
            <div
                style={{
                    aspectRatio: '1/1',
                    background: 'rgba(0,0,0,0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {score != null && (
                    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                        <ScoreBadge score={score} label={scoreLabel} color={scoreColor} size="sm" />
                    </div>
                )}

                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={image}
                        alt={model}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: 24,
                            opacity: 0.9,
                            transition: 'opacity 0.2s',
                        }}
                        loading="lazy"
                    />
                ) : (
                    placeholderIcon ?? <DefaultPlaceholder />
                )}
            </div>

            {/* Info area */}
            <div style={{ padding: '14px 16px' }}>
                <div
                    style={{
                        fontSize: 10,
                        color: '#22d3ee',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: 4,
                    }}
                >
                    {brand}
                </div>

                <h3
                    style={{
                        fontWeight: 700,
                        fontSize: 16,
                        lineHeight: 1.3,
                        margin: '0 0 12px',
                        color: '#fff',
                    }}
                >
                    <a
                        href={href}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                        onMouseEnter={e => {
                            ;(e.currentTarget as HTMLAnchorElement).style.color = '#67e8f9'
                        }}
                        onMouseLeave={e => {
                            ;(e.currentTarget as HTMLAnchorElement).style.color = '#fff'
                        }}
                    >
                        {model}
                    </a>
                </h3>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                    }}
                >
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                        {price ?? <span style={{ color: '#4b5563', fontSize: 14, fontFamily: 'inherit' }}>Price TBD</span>}
                    </div>

                    {compareHref && (
                        <a
                            href={compareHref}
                            style={{
                                fontSize: 11,
                                color: '#6b7280',
                                textDecoration: 'underline',
                                textDecorationColor: '#374151',
                                textUnderlineOffset: 3,
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => {
                                ;(e.currentTarget as HTMLAnchorElement).style.color = '#22d3ee'
                            }}
                            onMouseLeave={e => {
                                ;(e.currentTarget as HTMLAnchorElement).style.color = '#6b7280'
                            }}
                        >
                            {compareLinkLabel}
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}
