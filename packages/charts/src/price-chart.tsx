'use client'

import { useEffect, useRef } from 'react'
import {
    createChart,
    ColorType,
    CrosshairMode,
    type IChartApi,
    type ISeriesApi,
    type LineSeriesPartialOptions,
} from 'lightweight-charts'

export interface PricePoint {
    time: string   // 'YYYY-MM-DD' or Unix timestamp
    value: number
}

interface PriceChartProps {
    data: PricePoint[]
    height?: number
    lineColor?: string
    showVolume?: boolean
    msrp?: number
}

export function PriceChart({
    data,
    height = 280,
    lineColor = '#4f80ff',
    msrp,
}: PriceChartProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height,
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#888888',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
            },
            grid: {
                vertLines: { color: '#1a1a1a' },
                horzLines: { color: '#1a1a1a' },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: { color: '#444', labelBackgroundColor: '#222' },
                horzLine: { color: '#444', labelBackgroundColor: '#222' },
            },
            rightPriceScale: {
                borderColor: '#222',
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderColor: '#222',
                timeVisible: true,
                secondsVisible: false,
            },
            handleScroll: true,
            handleScale: true,
        })

        const lineOptions: LineSeriesPartialOptions = {
            color: lineColor,
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 5,
            crosshairMarkerBorderColor: lineColor,
            crosshairMarkerBackgroundColor: '#0f0f0f',
            lastValueVisible: true,
            priceLineVisible: true,
            priceLineColor: lineColor,
            priceLineStyle: 2, // dashed
        }

        const series = chart.addLineSeries(lineOptions)

        // Filter and sort valid data
        const sorted = [...data]
            .filter(p => p.value > 0)
            .sort((a, b) => a.time.localeCompare(b.time))
        series.setData(sorted)

        // MSRP reference line
        if (msrp) {
            const msrpLine = chart.addLineSeries({
                color: '#ef4444',
                lineWidth: 1,
                lineStyle: 3, // dotted
                lastValueVisible: true,
                priceLineVisible: false,
                title: 'MSRP',
                crosshairMarkerVisible: false,
            })
            if (sorted.length >= 2) {
                msrpLine.setData([
                    { time: sorted[0].time, value: msrp },
                    { time: sorted[sorted.length - 1].time, value: msrp },
                ])
            }
        }

        chart.timeScale().fitContent()
        chartRef.current = chart
        seriesRef.current = series

        // Resize observer
        const ro = new ResizeObserver(() => {
            if (containerRef.current) {
                chart.applyOptions({ width: containerRef.current.clientWidth })
            }
        })
        ro.observe(containerRef.current)

        return () => {
            ro.disconnect()
            chart.remove()
        }
    }, [data, height, lineColor, msrp])

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height, position: 'relative' }}
        />
    )
}

