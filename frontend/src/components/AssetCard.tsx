'use client';
import { AlertTriangle, CheckCircle, Clock, Truck, Container, Car } from 'lucide-react';
import clsx from 'clsx';

interface AssetCardProps {
    id: string;
    type: string;
    region: string;
    healthScore: number;
    riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
    predictedFailure: string;
    onClick: () => void;
}

export function AssetCard({ id, type, region, healthScore, riskLevel, predictedFailure, onClick }: AssetCardProps) {
    const isCritical = riskLevel === 'Critical';
    const isHigh = riskLevel === 'High';

    const getIcon = () => {
        switch (type) {
            case 'Tractor': return <Truck className="w-4 h-4 text-neutral-500" />;
            case 'Trailer': return <Container className="w-4 h-4 text-neutral-500" />;
            case 'Van': return <Car className="w-4 h-4 text-neutral-500" />;
            default: return <Truck className="w-4 h-4 text-neutral-500" />;
        }
    };

    return (
        <div
            onClick={onClick}
            className={clsx(
                "bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-xl transition-all border-l-4",
                isCritical ? "border-ups-orange" : isHigh ? "border-yellow-500" : "border-green-500"
            )}
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-lg font-bold text-neutral-heading">{id}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                        {getIcon()}
                        <span className="text-xs text-neutral-text">{type} • {region}</span>
                    </div>
                </div>
                <div className={clsx(
                    "px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                    isCritical ? "bg-red-100 text-red-800" : isHigh ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                )}>
                    {isCritical && <AlertTriangle className="w-3 h-3" />}
                    {healthScore}/100
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-text">Risk Level:</span>
                    <span className={clsx(
                        "font-semibold",
                        isCritical ? "text-ups-orange" : "text-neutral-heading"
                    )}>{riskLevel}</span>
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-neutral-text">Failure Prediction:</span>
                    <span className="font-medium text-neutral-heading truncate max-w-[120px]" title={predictedFailure}>
                        {predictedFailure}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-text mt-3 pt-3 border-t border-gray-100">
                    <Clock className="w-3 h-3" />
                    Updated 2 mins ago
                </div>
            </div>
        </div>
    );
}
