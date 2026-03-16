'use client';
import { useState } from 'react';
import { Activity, Truck, DollarSign, TrendingUp, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';
import clsx from 'clsx';

const usageData = [
    { day: 'Mon', miles: 12450 },
    { day: 'Tue', miles: 14200 },
    { day: 'Wed', miles: 13800 },
    { day: 'Thu', miles: 15100 },
    { day: 'Fri', miles: 14900 },
    { day: 'Sat', miles: 8400 },
    { day: 'Sun', miles: 4200 },
];

export default function OpsConsole() {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);

    const handleGenerateSummary = async () => {
        setLoadingSummary(true);
        try {
            const ports = [4000];
            let data = null;
            for (const port of ports) {
                try {
                    const res = await fetch(`http://localhost:${port}/api/copilot/summary`);
                    if (res.ok) {
                        data = await res.json();
                        break;
                    }
                } catch (e) { continue; }
            }

            if (data && data.success) {
                setDashboardData(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleDownloadPDF = async () => {
        setDownloadingPDF(true);
        try {
            const response = await fetch('http://localhost:4000/api/export/export-pdf');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fleet-executive-summary-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('PDF download failed:', error);
        } finally {
            setDownloadingPDF(false);
        }
    };

    const pieData = dashboardData?.dashboard?.breakdown ? [
        { name: 'Critical', value: dashboardData.dashboard.breakdown.critical, color: '#EF4444' },
        { name: 'High', value: dashboardData.dashboard.breakdown.high, color: '#F59E0B' },
        { name: 'Medium', value: dashboardData.dashboard.breakdown.medium, color: '#3B82F6' },
        { name: 'Low', value: dashboardData.dashboard.breakdown.low, color: '#10B981' },
    ] : [];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-ups-brown">Operations Console</h1>
                    <p className="text-neutral-text text-sm mt-1">Fleet-wide performance and AI insights</p>
                </div>
                <div className="flex gap-3">
                    {dashboardData && (
                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloadingPDF}
                            className="flex items-center gap-2 bg-ups-brown text-white font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-[#50240E] transition-colors disabled:opacity-50"
                        >
                            {downloadingPDF ? (
                                <>Generating PDF...</>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" /> Download PDF Report
                                </>
                            )}
                        </button>
                    )}
                    <button
                        onClick={handleGenerateSummary}
                        disabled={loadingSummary}
                        className="flex items-center gap-2 bg-ups-gold text-ups-brown font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-yellow-400 transition-colors disabled:opacity-50"
                    >
                        {loadingSummary ? (
                            <>Generating...</>
                        ) : (
                            <>
                                <Activity className="w-4 h-4" /> Generate Executive Summary
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Comprehensive Dashboard */}
            {dashboardData?.dashboard && (
                <div className="space-y-6 mb-8">
                    {/* Fleet Health Score - Hero Section */}
                    <div className="bg-gradient-to-br from-ups-brown to-[#3E1C0A] text-white p-8 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-ups-gold uppercase tracking-wide mb-2">Fleet Health Score</h2>
                                <div className="flex items-baseline gap-4">
                                    <span className="text-6xl font-bold">{dashboardData.dashboard.healthScore}%</span>
                                    <span className={clsx(
                                        "text-lg font-semibold px-3 py-1 rounded-full",
                                        dashboardData.dashboard.trends.healthScore.startsWith('+')
                                            ? "bg-green-500/20 text-green-300"
                                            : "bg-red-500/20 text-red-300"
                                    )}>
                                        {dashboardData.dashboard.trends.healthScore} vs last week
                                    </span>
                                </div>
                                <p className="text-ups-cream/80 mt-3 text-sm">
                                    Overall fleet performance indicator based on vehicle health metrics
                                </p>
                            </div>
                            <div className="w-48 h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* KPIs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-neutral-text font-medium">Fleet Uptime</p>
                                    <h2 className="text-4xl font-bold text-neutral-heading mt-2">{dashboardData.dashboard.kpis.uptime}</h2>
                                </div>
                                <div className="p-3 rounded-xl bg-green-50">
                                    <Activity className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">
                                    {dashboardData.dashboard.trends.uptime}
                                </span>
                                <span className="text-gray-400 ml-2">vs last week</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-neutral-text font-medium">Active Vehicles</p>
                                    <h2 className="text-4xl font-bold text-neutral-heading mt-2">{dashboardData.dashboard.kpis.activeVehicles}</h2>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-100">
                                    <Truck className="w-6 h-6 text-ups-brown" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                                    {dashboardData.dashboard.trends.criticalCount}
                                </span>
                                <span className="text-gray-400 ml-2">critical assets</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-neutral-text font-medium">Maintenance Cost</p>
                                    <h2 className="text-4xl font-bold text-neutral-heading mt-2">{dashboardData.dashboard.kpis.maintenanceCost}</h2>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-50">
                                    <DollarSign className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">
                                    {dashboardData.dashboard.trends.maintenanceCost}
                                </span>
                                <span className="text-gray-400 ml-2">vs last week</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Items */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-xl font-bold text-neutral-heading mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-ups-orange" />
                            Top Priority Action Items
                        </h3>
                        <div className="space-y-3">
                            {dashboardData.dashboard.actionItems.map((item: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Clock className="w-5 h-5 text-ups-brown mt-0.5 flex-shrink-0" />
                                    <p className="text-gray-700 font-medium">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Summary Text */}
                    <div className="bg-white border-l-4 border-ups-gold p-6 rounded-r-xl shadow-sm">
                        <h3 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2">
                            <span className="bg-ups-gold/20 p-1.5 rounded text-ups-brown">AI</span>
                            Executive Briefing
                        </h3>
                        <p className="text-gray-600 leading-relaxed">{dashboardData.executive_summary}</p>
                    </div>
                </div>
            )}

            {/* Main Chart */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-neutral-heading">Weekly Fleet Usage</h3>
                    <p className="text-sm text-neutral-text">Total miles driven across all regions</p>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={usageData}>
                            <defs>
                                <linearGradient id="colorMiles" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#662F12" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#662F12" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(value) => `${value / 1000}k`} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [`${value} miles`, 'Distance']}
                            />
                            <Area type="monotone" dataKey="miles" stroke="#662F12" strokeWidth={3} fillOpacity={1} fill="url(#colorMiles)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
