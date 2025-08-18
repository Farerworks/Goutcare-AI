import React, { useMemo, useState } from 'react';
import type { SymptomEntry } from '../types';
import type { TranslationKey } from '../translations';
import { TrendingUpIcon } from './IconComponents';

interface PainTrendChartProps {
    symptomEntries: SymptomEntry[];
    t: (key: TranslationKey) => string;
}

const PainTrendChart: React.FC<PainTrendChartProps> = ({ symptomEntries, t }) => {
    // Chart dimensions
    const width = 300;
    const height = 150;
    const padding = { top: 20, right: 20, bottom: 30, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const [activePoint, setActivePoint] = useState<SymptomEntry | null>(null);

    const data = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return symptomEntries
            .filter(entry => entry.date >= thirtyDaysAgo)
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [symptomEntries]);

    if (data.length < 2) {
        return (
            <div className="bg-zinc-800 rounded-lg p-4">
                <h3 className="flex items-center text-md font-semibold text-teal-300 mb-2">
                    <TrendingUpIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                    {t('painTrendChartTitle')}
                </h3>
                <div className="flex items-center justify-center h-[150px] text-center text-sm text-zinc-400">
                    <p>{t('painTrendChartNoData')}</p>
                </div>
            </div>
        );
    }
    
    const minDate = data[0].date.getTime();
    const maxDate = data[data.length - 1].date.getTime();
    const dateRange = maxDate - minDate || 1; // Avoid division by zero

    const getX = (date: Date) => padding.left + ((date.getTime() - minDate) / dateRange) * chartWidth;
    const getY = (level: number) => padding.top + chartHeight - (level / 10) * chartHeight;
    
    const pathData = data.map(point => `${getX(point.date)},${getY(point.painLevel)}`).join(' L ');

    return (
        <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="flex items-center text-md font-semibold text-teal-300 mb-2">
                <TrendingUpIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                {t('painTrendChartTitle')}
            </h3>
            <div className="relative">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-labelledby="chart-title">
                    <title id="chart-title">{t('painTrendChartTitle')}</title>
                    {/* Y-Axis labels */}
                    <text x={padding.left - 8} y={getY(10) + 4} textAnchor="end" className="text-xs fill-zinc-400">10</text>
                    <text x={padding.left - 8} y={getY(5) + 4} textAnchor="end" className="text-xs fill-zinc-400">5</text>
                    <text x={padding.left - 8} y={getY(0) + 4} textAnchor="end" className="text-xs fill-zinc-400">0</text>
                    
                    {/* Grid lines */}
                    <line x1={padding.left} y1={getY(10)} x2={width - padding.right} y2={getY(10)} className="stroke-zinc-700" strokeWidth="0.5" />
                    <line x1={padding.left} y1={getY(5)} x2={width - padding.right} y2={getY(5)} className="stroke-zinc-700" strokeWidth="0.5" strokeDasharray="2" />
                    <line x1={padding.left} y1={getY(0)} x2={width - padding.right} y2={getY(0)} className="stroke-zinc-700" strokeWidth="0.5" />
                    
                    {/* Data line */}
                    <path d={`M ${pathData}`} fill="none" className="stroke-teal-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Data points and hover areas */}
                    {data.map((point, index) => (
                        <g key={index}>
                            <circle
                                cx={getX(point.date)}
                                cy={getY(point.painLevel)}
                                r="4"
                                className="fill-teal-400"
                                onMouseEnter={() => setActivePoint(point)}
                                onMouseLeave={() => setActivePoint(null)}
                            />
                            <rect
                                x={getX(point.date) - 10}
                                y={padding.top}
                                width="20"
                                height={chartHeight}
                                fill="transparent"
                                onMouseEnter={() => setActivePoint(point)}
                                onMouseLeave={() => setActivePoint(null)}
                             />
                        </g>
                    ))}

                    {/* Tooltip */}
                    {activePoint && (
                        <g transform={`translate(${getX(activePoint.date)}, ${getY(activePoint.painLevel)})`}>
                            <rect x="-40" y="-40" width="80" height="30" rx="4" className="fill-zinc-900/80 stroke-zinc-600" />
                            <text x="0" y="-25" textAnchor="middle" className="text-xs font-semibold fill-zinc-200">
                                {activePoint.painLevel}/10
                            </text>
                            <text x="0" y="-13" textAnchor="middle" className="text-[10px] fill-zinc-400">
                                {activePoint.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </text>
                        </g>
                    )}
                </svg>
            </div>
        </div>
    );
};

export default PainTrendChart;