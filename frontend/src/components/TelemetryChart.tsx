'use client';
import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, Radio } from 'lucide-react';

interface TelemetryChartProps {
    label: string;
    unit: string;
    baseValue: number;
    threshold: number;
    color?: string;
}

export function TelemetryChart({ label, unit, baseValue, threshold, color = "#10B981" }: TelemetryChartProps) {
    const [data, setData] = useState<{ time: number; value: number }[]>([]);
    const [currentValue, setCurrentValue] = useState(baseValue);

    // Simulation Ref to keep loop running
    const frameRef = useRef<number>(0);

    useEffect(() => {
        // Init buffer
        const initialData = Array.from({ length: 50 }, (_, i) => ({
            time: i,
            value: baseValue + (Math.random() * 0.5 - 0.25)
        }));
        setData(initialData);

        const interval = setInterval(() => {
            setData(prev => {
                const now = Date.now();
                const noise = Math.random() * 0.8 - 0.4;
                const wave = Math.sin(now / 500) * 0.5; // Oscillation
                const newValue = Number((baseValue + wave + noise).toFixed(2));

                setCurrentValue(newValue);

                const newPoint = { time: now, value: newValue };
                return [...prev.slice(1), newPoint]; // Keep window size constant
            });
        }, 100); // 10Hz update

        return () => clearInterval(interval);
    }, [baseValue]);

    const isCritical = currentValue > threshold;

    return (
        <div className="bg-white text-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            {/* Header */}
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                        <Activity className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</h4>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm"></span>
                            <span className="text-[10px] text-green-600 font-mono font-bold">LIVE</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-2xl font-mono font-bold ${isCritical ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                        {currentValue.toFixed(1)} <span className="text-xs text-gray-400 font-sans">{unit}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">Limit: {threshold}{unit}</div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-32 -mx-4 -mb-4 relative">
                {/* Background Grid Simulation */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-50">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="border-r border-b border-gray-100"></div>
                    ))}
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                        <ReferenceLine y={threshold} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'CRIT', fill: '#EF4444', fontSize: 10, position: 'insideTopRight', fontWeight: 'bold' }} />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={isCritical ? "#EF4444" : color}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false} // Disable recharts animation for smooth realtime
                        />
                    </LineChart>
                </ResponsiveContainer>

                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
}
