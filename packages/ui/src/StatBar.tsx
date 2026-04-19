'use client'

import React from 'react'

export interface Stat {
    label: string
    value: React.ReactNode
    /** Optional tailwind-style hex color for the value, e.g. '#22d3ee' */
    color?: string
}

export interface StatBarProps {
    stats: Stat[]
    /** Optional gap between stats (default: 32px) */
    gap?: number
}

export function StatBar({ stats, gap = 32 }: StatBarProps) {
    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap,
                padding: '20px 0',
            }}
        >
            {stats.map((stat, i) => (
                <div key={i}>
                    <div
                        style={{
                            fontSize: 11,
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: 4,
                        }}
                    >
                        {stat.label}
                    </div>
                    <div
                        style={{
                            fontSize: 28,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: stat.color ?? '#fff',
                            lineHeight: 1,
                        }}
                    >
                        {stat.value}
                    </div>
                </div>
            ))}
        </div>
    )
}
