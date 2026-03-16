'use client';
import { useState, useEffect } from 'react';
import { AssetCard } from '@/components/AssetCard';
import { FailureDrawer } from '@/components/FailureDrawer';
import { Search } from 'lucide-react';
import clsx from 'clsx';

export default function AssetHealthHub() {
    const [assets, setAssets] = useState<any[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filterRegion, setFilterRegion] = useState('All');
    const [filterRisk, setFilterRisk] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchAssets(retries = 3) {
            try {
                // Try both possible backend ports
                const ports = [4000, 5001];
                let data = null;

                for (const port of ports) {
                    try {
                        const res = await fetch(`http://localhost:${port}/api/assets?_t=${Date.now()}`);
                        if (res.ok) {
                            data = await res.json();
                            break;
                        }
                    } catch (err) {
                        continue;
                    }
                }

                if (!data) throw new Error('Failed to fetch');
                setAssets(data);
            } catch (err) {
                if (retries > 0) {
                    // Retry after 1s
                    setTimeout(() => fetchAssets(retries - 1), 1000);
                    return;
                }

                console.warn("Backend unavailable, handling gracefully with Mock Data:", err);

                // Fallback for demo if backend not running
                const mockAssets = Array.from({ length: 12 }).map((_, i) => {
                    const type = i % 3 === 0 ? 'Tractor' : i % 3 === 1 ? 'Trailer' : 'Van';
                    const prefix = type === 'Tractor' ? 'TRK' : type === 'Trailer' ? 'TRL' : 'VAN';
                    return {
                        id: `${prefix}-MOCK-${i}`,
                        region: i % 2 === 0 ? 'Midwest' : 'South',
                        type: type,
                        health_score: 80 - i * 5,
                        risk_level: i < 2 ? 'Critical' : i < 5 ? 'High' : 'Low',
                        predicted_failure: i < 2 ? 'Brake pads: 48hrs' : 'None',
                        sensor_trends: { vibration: 2.4, temp: 180 },
                        confidence: 'High'
                    };
                });
                setAssets(mockAssets);
            } finally {
                setLoading(false);
            }
        }

        fetchAssets();
    }, []);

    const filteredAssets = assets.filter(asset => {
        if (filterRegion !== 'All' && asset.region !== filterRegion) return false;
        if (filterRisk !== 'All' && asset.risk_level !== filterRisk) return false;
        if (filterType !== 'All' && asset.type !== filterType) return false;
        if (searchQuery && !asset.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-ups-brown">Asset Health Hub</h1>
                    <p className="text-neutral-text text-sm mt-1">Predict failures before they happen</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Filters */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        <Search className="w-4 h-4 text-gray-400 ml-2" />
                        <input
                            placeholder="Search assets..."
                            className="outline-none text-sm p-1 text-gray-700 w-32 placeholder-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <select
                        className="bg-white border text-sm rounded-lg p-2.5 shadow-sm outline-none text-gray-700"
                        value={filterRegion}
                        onChange={(e) => setFilterRegion(e.target.value)}
                    >
                        <option value="All">All Regions</option>
                        <option value="Midwest">Midwest</option>
                        <option value="South">South</option>
                        <option value="Northeast">Northeast</option>
                        <option value="West">West</option>
                    </select>

                    <select
                        className="bg-white border text-sm rounded-lg p-2.5 shadow-sm outline-none text-gray-700"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        <option value="Tractor">Tractor</option>
                        <option value="Trailer">Trailer</option>
                        <option value="Van">Van</option>
                    </select>

                    <select
                        className="bg-white border text-sm rounded-lg p-2.5 shadow-sm outline-none text-gray-700"
                        value={filterRisk}
                        onChange={(e) => setFilterRisk(e.target.value)}
                    >
                        <option value="All">All Risks</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">Loading assets...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAssets.map((asset) => (
                        <AssetCard
                            key={asset.id}
                            id={asset.id}
                            type={asset.type}
                            region={asset.region}
                            healthScore={asset.health_score}
                            riskLevel={asset.risk_level}
                            predictedFailure={asset.predicted_failure}
                            onClick={() => setSelectedAsset(asset)}
                        />
                    ))}
                </div>
            )}

            {/* Drawer */}
            <FailureDrawer
                isOpen={!!selectedAsset}
                onClose={() => setSelectedAsset(null)}
                asset={selectedAsset}
                onScheduleConfirm={async (date, tech) => {
                    try {
                        // Try both ports for backend
                        const ports = [4000, 5001];
                        let data = null;

                        for (const port of ports) {
                            try {
                                const response = await fetch(`http://localhost:${port}/api/actions/schedule`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        asset_id: selectedAsset.id,
                                        action_type: 'Maintenance',
                                        description: selectedAsset.predicted_failure || 'Scheduled maintenance',
                                        scheduled_date: date,
                                        priority: selectedAsset.risk_level === 'Critical' ? 'high' :
                                            selectedAsset.risk_level === 'High' ? 'medium' : 'low',
                                        created_by: tech
                                    })
                                });

                                if (response.ok) {
                                    data = await response.json();
                                    break;
                                }
                            } catch (err) {
                                continue;
                            }
                        }

                        if (data && data.success) {
                            alert(`✅ Maintenance Scheduled!\n\n${selectedAsset.id} added to ${data.action.timeline} queue.\n\nAction ID: ${data.action.id}\nAssigned to: ${tech}`);
                            setSelectedAsset(null);
                        } else {
                            alert('❌ Failed to schedule maintenance. Please try again.');
                        }
                    } catch (error) {
                        console.error('Error scheduling maintenance:', error);
                        alert('❌ Error connecting to server. Please ensure backend is running.');
                    }
                }}
            />
        </div>
    );
}
