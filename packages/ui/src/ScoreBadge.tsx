'use client'

import React from 'react'

export interface ScoreBadgeProps {
    score: number | null | undefined
    label?: string
    color?: 'cyan' | 'violet' | 'green' | 'yellow' | 'white'
    size?: 'sm' | 'md' | 'lg'
    showMax?: boolean
    max?: number
}

const colorMap = {
    cyan: '#22d3ee',
    violet: '#a78bfa',
    green: '#4ade80',
    yellow: '#facc15',
    white: '#ffffff',
}

export function ScoreBadge({
    score,
    label = 'RAI',
    color = 'cyan',
    size = 'md',
    showMax = false,
    max = 100,
}: ScoreBadgeProps) {
    const hexColor = colorMap[color]

    const fontSizeMap = { sm: 11, md: 13, lg: 16 }
    const scoreSizeMap = { sm: 13, md: 16, lg: 20 }
    const paddingMap = { sm: '2px 6px', md: '3px 8px', lg: '4px 10px' }

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: paddingMap[size],
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6,
                fontSize: fontSizeMap[size],
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'inherit',
                lineHeight: 1,
            }}
        >
            {label && <span style={{ letterSpacing: '0.05em' }}>{label}</span>}
            <span
                style={{
                    color: hexColor,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    fontSize: scoreSizeMap[size],
                }}
            >
                {score ?? '—'}
            </span>
            {showMax && score != null && (
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: fontSizeMap[size] - 2 }}>
                    /{max}
                </span>
            )}
        </span>
    )
}
