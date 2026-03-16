'use client';
import { useState, useEffect } from 'react';
import { MoreHorizontal, AlertTriangle, User, Download, Share2, ClipboardList, TrendingUp, CheckCircle, Shield, RefreshCw, Bot } from 'lucide-react';
import { FailureDrawer } from '@/components/FailureDrawer';
import clsx from 'clsx';

// REMOVED COLUMNS constant
// const COLUMNS = [ ... ];

// Backend API URL
const API_URLS = ['http://127.0.0.1:4000'];

export default function ActionBoard() {
    const [actions, setActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters & Sorting
    const [filterDate, setFilterDate] = useState('');
    const [filterRisk, setFilterRisk] = useState('All');
    const [sortOption, setSortOption] = useState('schedule_date'); // 'asset_id', 'schedule_date', 'risk'

    const [planSummary, setPlanSummary] = useState<any>(null);

    // Fetch actions from backend with fallback
    const fetchActions = async () => {
        try {
            setRefreshing(true);
            setError(null);

            let data = null;
            let lastError = null;

            // Try each API URL
            for (const apiUrl of API_URLS) {
                try {
                    const res = await fetch(`${apiUrl}/api/actions?status=pending`);
                    if (res.ok) {
                        data = await res.json();
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    continue;
                }
            }

            // Check for Copilot Plan in LocalStorage
            const planStr = localStorage.getItem('maintenancePlan');
            let proposedActions: any[] = [];
            if (planStr) {
                const plan = JSON.parse(planStr);
                setPlanSummary(plan);

                proposedActions = plan.assets.map((asset: any, i: number) => ({
                    id: `prop-${i}`,
                    asset_id: asset.id,
                    description: asset.recommended_action, // Short desc
                    copilot_reason: asset.explanation, // Full explanation
                    priority: asset.risk_level === 'Critical' ? 'high' :
                        asset.risk_level === 'High' ? 'high' : 'medium', // Map risks
                    timeline: asset.recommended_time_window === '24h' ? 'today' :
                        asset.recommended_time_window === '48h' ? '48hrs' : 'next_week',
                    scheduled_date: new Date().toISOString(),
                    created_by: asset.assigned_technician || ["John Smith", "Mike Chen", "Sarah Johnson"][i % 3], // Fallback if missing
                    status: 'proposed',
                    is_plan_item: true
                }));
            }

            if (!data) {
                // If backend fails but we have a plan, show the plan
                if (proposedActions.length > 0) {
                    setActions(proposedActions);
                    return;
                }
                throw lastError || new Error('Backend not available');
            }

            if (data.success) {
                // Merge real actions with proposed actions (deduplicate if needed, but for now just concat)
                // Filter out proposed if they are already in real actions (by asset_id maybe?)
                // For prototype, simple concat is fine. Show proposed first.
                setActions([...proposedActions, ...data.actions]);
            }
        } catch (error) {
            console.error('Error fetching actions:', error);
            // Verify if we have plan at least
            const planStr = localStorage.getItem('maintenancePlan');
            if (planStr) {
                const plan = JSON.parse(planStr);
                setPlanSummary(plan);
                const proposed = plan.assets.map((asset: any, i: number) => ({
                    id: `prop-${i}`,
                    asset_id: asset.id,
                    description: asset.recommended_action,
                    copilot_reason: asset.explanation,
                    priority: asset.risk_level === 'Critical' ? 'high' : 'medium',
                    timeline: asset.recommended_time_window === '24h' || 'today' ? 'today' :
                        asset.recommended_time_window === '48h' ? '48hrs' : 'next_week',
                    scheduled_date: new Date().toISOString(),
                    created_by: asset.assigned_technician || ["John Smith", "Mike Chen", "Sarah Johnson"][i % 3],
                    status: 'proposed',
                    is_plan_item: true
                }));
                setActions(proposed);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchActions();
        // Auto-refresh every 10 seconds (disabled for prototype with static plan to avoid overwriting)
        // const interval = setInterval(fetchActions, 10000);
        // return () => clearInterval(interval);
    }, []);

    const completeAction = async (actionId: number | string) => {
        // Handle Copilot Proposed Actions (Local Only)
        if (typeof actionId === 'string' && actionId.startsWith('prop-')) {
            try {
                // 1. Remove from Local State
                setActions(actions.filter(a => a.id !== actionId));

                // 2. Remove from LocalStorage Plan
                const planStr = localStorage.getItem('maintenancePlan');
                if (planStr) {
                    const plan = JSON.parse(planStr);
                    // The ID matches the index in the original proposed list loop (prop-0, prop-1)
                    // But deleting by index is tricky if we remove items. 
                    // Better to rely on asset_id or reconstruction.

                    // Let's filter out the asset that matches this proposed action's asset_id
                    const actionToRemove = actions.find(a => a.id === actionId);
                    if (actionToRemove) {
                        plan.assets = plan.assets.filter((asset: any) => asset.id !== actionToRemove.asset_id);

                        // If plan is empty, clear it entirely
                        if (plan.assets.length === 0) {
                            localStorage.removeItem('maintenancePlan');
                            setPlanSummary(null);
                        } else {
                            localStorage.setItem('maintenancePlan', JSON.stringify(plan));
                            setPlanSummary(plan); // Update summary view if needed
                        }
                    }
                }

                alert('✅ Proposed action cleared from plan!');
                return;
            } catch (err) {
                console.error("Error clearing local action:", err);
                return;
            }
        }

        // Handle Backend Real Actions
        try {
            const res = await fetch(`http://127.0.0.1:4000/api/actions/${actionId}/complete`, {
                method: 'PUT'
            });
            const data = await res.json();

            if (data.success) {
                // Remove completed action from list
                setActions(actions.filter(a => a.id !== actionId));
                alert('✅ Action marked as completed!');
            }
        } catch (error) {
            console.error('Error completing action:', error);
            alert('❌ Failed to complete action');
        }
    };

    const updateStatus = async (actionId: number, status: string) => {
        try {
            const res = await fetch(`http://127.0.0.1:4000/api/actions/${actionId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();

            if (data.success) {
                // Update local state
                setActions(actions.map(a => a.id === actionId ? data.action : a));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleCardClick = async (action: any) => {
        // Fetch asset details from backend
        try {
            const res = await fetch(`http://127.0.0.1:4000/api/assets/${action.asset_id}`);
            const assetData = await res.json();
            setSelectedAsset(assetData);
        } catch (error) {
            console.error('Error fetching asset:', error);
            // Fallback to mock data
            setSelectedAsset({
                id: action.asset_id,
                type: action.asset_id.startsWith('TRK') ? 'Tractor' :
                    action.asset_id.startsWith('VAN') ? 'Van' : 'Package Car',
                region: 'Midwest',
                risk_level: action.timeline === 'today' ? 'Critical' : 'High',
                predicted_failure: action.description,
                confidence: 'High',
                sensor_trends: { vibration: 2.4, temp: 180 }
            });
        }
    };

    const generatePlanContent = () => {
        const date = new Date().toLocaleDateString();
        let content = `MAINTENANCE ACTION PLAN - ${date}\n\n`;

        content += "--- PLAN ANALYSIS ---\n";
        content += `Total Actions: ${actions.length}\n`;
        content += `Today: ${actions.filter(a => a.timeline === 'today').length}\n`;
        content += `48hrs: ${actions.filter(a => a.timeline === '48hrs').length}\n`;
        content += `Next Week: ${actions.filter(a => a.timeline === 'next_week').length}\n\n`;

        content += "--- SCHEDULED ACTIONS ---\n";
        actions.forEach(action => {
            content += `[${action.timeline.toUpperCase()}] ${action.asset_id} - ${action.description}\n`;
            content += `   Priority: ${action.priority} | Assigned: ${action.created_by}\n`;
            content += `   Scheduled: ${new Date(action.scheduled_date).toLocaleString()}\n\n`;
        });

        return { content, date };
    };

    const handleExport = () => {
        const { content, date } = generatePlanContent();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `maintenance_plan_${date.replace(/\//g, '-')}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleShare = async () => {
        const { content, date } = generatePlanContent();

        try {
            if (navigator.share) {
                const file = new File([content], `maintenance_plan_${date.replace(/\//g, '-')}.txt`, { type: 'text/plain' });
                const data = {
                    files: [file],
                    title: 'Maintenance Action Plan',
                    text: 'Key maintenance actions and risk analysis for immediate review.'
                };

                if (navigator.canShare && navigator.canShare(data)) {
                    await navigator.share(data);
                    return;
                }
            }

            await navigator.clipboard.writeText(content);
            alert("System share unavailable. Plan text copied to clipboard!");

        } catch (err) {
            console.error("Share failed:", err);
            await navigator.clipboard.writeText(content);
            alert("Plan text copied to clipboard!");
        }
    };

    const getFilteredAndSortedActions = () => {
        let result = [...actions];

        // Filter by Date
        if (filterDate) {
            const filterDay = new Date(filterDate).toDateString();
            result = result.filter(a => {
                const actionDate = new Date(a.scheduled_date);
                return actionDate.toDateString() === filterDay;
            });
        }

        // Filter by Risk (Priority)
        if (filterRisk !== 'All') {
            const riskMap: any = { 'Critical': 'high', 'High': 'medium', 'Watchlist': 'low' };
            // Note: Data uses 'high', 'medium', 'low'. Mapping UI terms to data.
            // Actually, let's simplify UI to match data or map data to UI.
            // Data: priority = 'high' | 'medium' | 'low'
            if (filterRisk === 'Critical') result = result.filter(a => a.priority === 'high');
            if (filterRisk === 'High') result = result.filter(a => a.priority === 'medium');
            if (filterRisk === 'Watchlist') result = result.filter(a => a.priority === 'low');
            // Let's adjust: Critical -> high, High -> medium (based on existing logic in fetchActions)
            // Wait, fetchActions maps Critical -> high, High -> high.
            // Let's strict filter:
            // If user selects Critical -> priority 'high'
            // If user selects High -> priority 'medium' (or just filter by priority string directly)
        }

        // Sort
        result.sort((a, b) => {
            if (sortOption === 'asset_id') return a.asset_id.localeCompare(b.asset_id);
            if (sortOption === 'schedule_date') return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
            if (sortOption === 'risk') {
                // High > Medium > Low
                const pA = a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1;
                const pB = b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1;
                return pB - pA;
            }
            return 0;
        });

        return result;
    };

    const displayActions = getFilteredAndSortedActions();

    return (
        <div className="h-[calc(100vh-64px)] overflow-y-auto bg-neutral-bg p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-ups-brown">Maintenance Action Board</h1>
                        <p className="text-sm text-gray-500">Real-time scheduled maintenance from Asset Health Hub</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Share2 className="w-4 h-4" /> Share
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-ups-brown text-white rounded-lg hover:bg-[#50240E] transition-colors shadow-sm"
                        >
                            <Download className="w-4 h-4" /> Export Plan
                        </button>
                        <button
                            onClick={fetchActions}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {/* Copilot Plan Summary Box */}
                {planSummary && (
                    <div className="bg-gradient-to-r from-ups-brown to-[#50240E] p-4 rounded-xl shadow-md text-white animate-in slide-in-from-top-2">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <Bot className="w-6 h-6 text-ups-gold" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-ups-gold">Copilot Plan Summary</h3>
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                        Confidence: {planSummary.plan_confidence}
                                    </span>
                                </div>
                                <p className="text-sm text-ups-cream leading-relaxed opacity-90">
                                    {planSummary.plan_summary}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('maintenancePlan');
                                    setPlanSummary(null);
                                    fetchActions();
                                }}
                                className="ml-auto text-xs opacity-50 hover:opacity-100 hover:bg-white/10 px-2 py-1 rounded"
                            >
                                Clear Plan
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters & Controls */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Sort By</label>
                            <select
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-ups-brown focus:border-ups-brown block w-40 p-2"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                            >
                                <option value="schedule_date">Schedule Date</option>
                                <option value="asset_id">Asset ID</option>
                                <option value="risk">Risk Priority</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Risk Filter</label>
                            <select
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-ups-brown focus:border-ups-brown block w-40 p-2"
                                value={filterRisk}
                                onChange={(e) => setFilterRisk(e.target.value)}
                            >
                                <option value="All">All Risks</option>
                                <option value="Critical">Critical (High)</option>
                                <option value="High">High (Medium)</option>
                                <option value="Watchlist">Watchlist (Low)</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Date Filter</label>
                            <input
                                type="date"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-ups-brown focus:border-ups-brown block w-40 p-2"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CheckCircle className="w-4 h-4" />
                        Showing <strong>{displayActions.length}</strong> actions
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-gray-500">Loading actions...</div>
                    </div>
                ) : displayActions.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64 text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                        <ClipboardList className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-600 mb-2">No Actions Found</h3>
                        <p className="text-sm text-gray-500">Try adjusting your filters or schedule maintenance from the Asset Health Hub.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayActions.map(action => (
                            <div
                                key={action.id}
                                onClick={() => handleCardClick(action)}
                                className={clsx(
                                    "bg-white p-5 rounded-xl shadow-sm border hover:shadow-md hover:border-ups-brown/30 transition-all cursor-pointer flex flex-col gap-3 group relative overflow-hidden",
                                    action.priority === 'high' ? "border-l-4 border-l-red-500" :
                                        action.priority === 'medium' ? "border-l-4 border-l-orange-500" :
                                            "border-l-4 border-l-blue-500"
                                )}
                            >
                                <div className="flex justify-between items-start z-10">
                                    <span className="font-bold text-ups-brown text-lg group-hover:text-ups-gold transition-colors">
                                        {action.asset_id}
                                    </span>
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        action.priority === 'high' ? "bg-red-100 text-red-700" :
                                            action.priority === 'medium' ? "bg-orange-100 text-orange-700" :
                                                "bg-blue-100 text-blue-700"
                                    )}>
                                        {action.priority}
                                    </span>
                                </div>

                                <div className="text-sm text-gray-800 flex-1 z-10">
                                    {action.is_plan_item && (
                                        <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold mb-1">
                                            <Bot className="w-3 h-3" /> Proposed
                                        </div>
                                    )}
                                    <p className="font-medium line-clamp-2 min-h-[40px]">{action.description}</p>
                                    {action.copilot_reason && (
                                        <p className="text-xs text-gray-500 mt-2 italic pl-2 border-l-2 border-gray-200">
                                            "{action.copilot_reason}"
                                        </p>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-gray-100 mt-auto z-10">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            {action.scheduled_date ? new Date(action.scheduled_date).toLocaleDateString() : 'Unscheduled'}
                                        </p>
                                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                                            <User className="w-3 h-3 text-ups-gold" />
                                            {action.created_by || 'Unassigned'}
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            completeAction(action.id);
                                        }}
                                        className="w-full text-xs font-bold bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" /> Complete Action
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Asset Details Drawer */}
            <FailureDrawer
                isOpen={!!selectedAsset}
                onClose={() => setSelectedAsset(null)}
                asset={selectedAsset}
                readOnly={true}
            />
        </div>
    );
}
