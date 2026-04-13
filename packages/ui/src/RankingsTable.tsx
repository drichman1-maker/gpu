'use client'

import React from 'react'

export interface RankingsRow {
    id: string
    rank: number
    name: string
    brand: string
    score?: number | null
    scoreLabel?: string
    price?: string | null
    href: string
}

export interface RankingsTableProps {
    rows: RankingsRow[]
    scoreLabel?: string
    emptyMessage?: string
}

export function RankingsTable({
    rows,
    scoreLabel = 'Score',
    emptyMessage = 'No items indexed yet.',
}: RankingsTableProps) {
    return (
        <div>
            {/* Header row */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 120px 100px 100px',
                    gap: 16,
                    padding: '8px 16px',
                    fontSize: 10,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: 4,
                }}
            >
                <div>#</div>
                <div>Name</div>
                <div>Brand</div>
                <div style={{ textAlign: 'right' }}>{scoreLabel}</div>
                <div style={{ textAlign: 'right' }}>Price</div>
            </div>

            {/* Data rows */}
            <div>
                {rows.map(row => (
                    <div
                        key={row.id}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 120px 100px 100px',
                            gap: 16,
                            padding: '14px 16px',
                            alignItems: 'center',
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => {
                            ;(e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'
                        }}
                        onMouseLeave={e => {
                            ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                        }}
                    >
                        {/* Rank */}
                        <div
                            style={{
                                fontFamily: 'monospace',
                                fontSize: 13,
                                color: row.rank === 1 ? '#22d3ee' : '#4b5563',
                                fontWeight: row.rank === 1 ? 700 : 400,
                            }}
                        >
                            #{row.rank}
                        </div>

                        {/* Name */}
                        <div>
                            <a
                                href={row.href}
                                style={{
                                    fontWeight: 600,
                                    fontSize: 14,
                                    color: '#fff',
                                    textDecoration: 'none',
                                    transition: 'color 0.15s',
                                }}
                                onMouseEnter={e => {
                                    ;(e.currentTarget as HTMLAnchorElement).style.color = '#67e8f9'
                                }}
                                onMouseLeave={e => {
                                    ;(e.currentTarget as HTMLAnchorElement).style.color = '#fff'
                                }}
                            >
                                {row.name}
                            </a>
                        </div>

                        {/* Brand */}
                        <div
                            style={{
                                fontSize: 12,
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                            }}
                        >
                            {row.brand}
                        </div>

                        {/* Score */}
                        <div style={{ textAlign: 'right' }}>
                            {row.score != null ? (
                                <>
                                    <span
                                        style={{
                                            fontFamily: 'monospace',
                                            fontWeight: 700,
                                            fontSize: 18,
                                            color: '#22d3ee',
                                        }}
                                    >
                                        {row.score}
                                    </span>
                                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#374151' }}>
                                        /100
                                    </span>
                                </>
                            ) : (
                                <span style={{ color: '#374151', fontSize: 13 }}>—</span>
                            )}
                        </div>

                        {/* Price */}
                        <div
                            style={{
                                textAlign: 'right',
                                fontFamily: 'monospace',
                                fontSize: 13,
                                color: '#fff',
                            }}
                        >
                            {row.price ?? <span style={{ color: '#374151' }}>—</span>}
                        </div>
                    </div>
                ))}
            </div>

            {rows.length === 0 && (
                <div
                    style={{
                        padding: '80px 16px',
                        textAlign: 'center',
                        color: '#4b5563',
                        fontSize: 14,
                    }}
                >
                    {emptyMessage}
                </div>
            )}
        </div>
    )
}
