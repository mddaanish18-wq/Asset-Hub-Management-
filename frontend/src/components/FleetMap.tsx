'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { divIcon } from 'leaflet';
import { AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default Leaflet icon issues in Next.js
import L from 'leaflet';

interface Asset {
    id: string;
    unit_id: string;
    description: string;
    risk_level: string; // Changed from status to risk_level to match backend
    status: string;     // Keep status just in case, or for display
    issue?: string;
    predicted_failure?: string;
    type?: string;      // Added missing type definition
    lat?: number;
    lng?: number;
}

interface FleetMapProps {
    assets: Asset[];
}

export default function FleetMap({ assets }: FleetMapProps) {
    // Center of USA
    const position: [number, number] = [39.8283, -98.5795];

    // Helper to get icon based on status
    const getIcon = (asset: Asset) => {
        // Use risk_level for coloring logic as it's the primary classifier in RiskDashboard
        const isCritical = asset.risk_level === 'Critical' || asset.status === 'Critical';
        const isHighRisk = asset.risk_level === 'High' || asset.status === 'High Risk';

        // Use Lucide icons rendered to HTML string
        const iconMarkup = renderToStaticMarkup(
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-lg transition-transform hover:scale-110 
                ${isCritical ? 'bg-red-500 border-red-200' :
                    isHighRisk ? 'bg-orange-500 border-orange-200' : 'bg-green-500 border-green-200'}`}>

                {/* Pulsing Ring for Critical */}
                {isCritical && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                )}

                {isCritical ? <Flame className="w-5 h-5 text-white z-10" /> :
                    isHighRisk ? <AlertTriangle className="w-5 h-5 text-white" /> :
                        <CheckCircle className="w-5 h-5 text-white" />
                }
            </div>
        );

        return divIcon({
            html: iconMarkup,
            className: 'custom-marker-icon', // Use this class to remove default leaflet square bg if needed
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });
    };

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0 relative">
            <MapContainer
                center={position}
                zoom={4}
                scrollWheelZoom={true}
                touchZoom={true}
                doubleClickZoom={true}
                dragging={true}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                {assets.map((asset, idx) => {
                    // Mock coordinates based on index if missing to spread them out across US
                    // This is temporary until we have real lat/lng
                    // Spread: lat 30-48, lng -120 to -75
                    const lat = asset.lat || 30 + (Math.random() * 15);
                    const lng = asset.lng || -120 + (Math.random() * 45);

                    return (
                        <Marker key={asset.id} position={[lat, lng]} icon={getIcon(asset)}>
                            <Popup className="custom-popup min-w-[200px]">
                                <div className="p-2 space-y-2">
                                    <div className='flex justify-between items-start'>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm">{asset.unit_id}</h3>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{asset.type || 'Vehicle'}</p>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold text-white
                                            ${asset.risk_level === 'Critical' ? 'bg-red-500' :
                                                asset.risk_level === 'High' ? 'bg-orange-500' : 'bg-green-500'}`}>
                                            {asset.risk_level || asset.status}
                                        </div>
                                    </div>

                                    {/* Health Score Calculation Mock */}
                                    {(() => {
                                        let score = 95;
                                        // Use risk_level for score calculation
                                        if (asset.risk_level === 'Critical') score = Math.floor(Math.random() * 30) + 10; // 10-40
                                        else if (asset.risk_level === 'High') score = Math.floor(Math.random() * 30) + 40; // 40-70
                                        else score = Math.floor(Math.random() * 20) + 80; // 80-100

                                        let barColor = 'bg-green-500';
                                        if (score < 50) barColor = 'bg-red-500';
                                        else if (score < 80) barColor = 'bg-orange-500';

                                        return (
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-600 font-medium">Health Score</span>
                                                    <span className={`font-bold ${score < 50 ? 'text-red-600' : score < 80 ? 'text-orange-600' : 'text-green-600'}`}>
                                                        {score}%
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                                    <div
                                                        className={`h-full ${barColor} transition-all duration-500`}
                                                        style={{ width: `${score}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {asset.predicted_failure && (
                                        <div className="pt-2 border-t border-gray-100 text-xs">
                                            <span className="text-red-600 font-bold flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> Issue:
                                            </span>
                                            <span className="text-gray-700">{asset.predicted_failure}</span>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
