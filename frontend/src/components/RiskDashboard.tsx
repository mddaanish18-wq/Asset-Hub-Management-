'use client';
import { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Zap, Eye, Pin, Send, X, ChevronRight, Clock, Bot, Cpu, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const FleetMap = dynamic(() => import('./FleetMap'), { ssr: false });

// Mock Data for Tiles - will be calculated from real assets
const getTiles = (assets: any[]) => [
    {
        id: 'Critical',
        label: 'Critical Assets',
        count: assets.filter(a => a.risk_level === 'Critical').length,
        icon: AlertTriangle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        activeBorder: 'border-red-600',
        description: 'Immediate attention required'
    },
    {
        id: 'High',
        label: 'High Risk',
        count: assets.filter(a => a.risk_level === 'High').length,
        icon: Zap,
        color: 'text-ups-orange',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        activeBorder: 'border-ups-orange',
        description: 'Action recommended within 7 days'
    },
    {
        id: 'Watchlist',
        label: 'Watchlist',
        count: assets.filter(a => a.risk_level === 'Medium' || a.risk_level === 'Low').length,
        icon: Eye,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        activeBorder: 'border-blue-600',
        description: 'Monitor for potential issues'
    },
];

// Helper function to filter assets by category
const getFilteredAssets = (assets: any[], category: string) => {
    if (category === 'Watchlist') {
        return assets.filter(a => a.risk_level === 'Medium' || a.risk_level === 'Low');
    }
    return assets.filter(a => a.risk_level === category);
};

// Mock Assets for Drill-down
const mockAssets: Record<string, Array<{ id: string; type: string; issue: string; time: string }>> = {
    'Critical': [
        { id: 'TRK-1501', type: 'Tractor', issue: 'Brake Failure Detected', time: '2 hrs ago' },
        { id: 'TRK-1502', type: 'Tractor', issue: 'Engine Overheat Warning', time: '4 hrs ago' },
        { id: 'TRL-8890', type: 'Trailer', issue: 'Tire Pressure Critical', time: '5 hrs ago' },
        { id: 'VAN-4421', type: 'Van', issue: 'Battery Voltage Low', time: '1 day ago' },
        { id: 'TRK-1100', type: 'Tractor', issue: 'Transmission Fault', time: '1 day ago' },
    ],
    'High': [
        { id: 'TRK-2201', type: 'Tractor', issue: 'Oil Change Overdue', time: '3 days ago' },
        { id: 'TRL-9921', type: 'Trailer', issue: 'Brake Pad Wear (80%)', time: '4 days ago' },
        { id: 'VAN-3301', type: 'Van', issue: 'Check Engine Light', time: '5 days ago' },
        { id: 'TRK-2205', type: 'Tractor', issue: 'Coolant Level Low', time: '6 days ago' },
        { id: 'TRK-2210', type: 'Tractor', issue: 'High Idle detected', time: '1 week ago' },
    ],
    'Watchlist': [
        { id: 'TRK-3001', type: 'Tractor', issue: 'Minor Vibration Variance', time: '1 week ago' },
        { id: 'TRL-5501', type: 'Trailer', issue: 'Door Sensor Glitch', time: '1 week ago' },
        { id: 'VAN-1102', type: 'Van', issue: 'MPG Efficiency Drop', time: '2 weeks ago' },
    ]
};

const barData = [
    { name: 'Brakes', value: 12 },
    { name: 'Tires', value: 8 },
    { name: 'Engine', value: 15 },
    { name: 'Battery', value: 6 },
    { name: 'Trans', value: 9 },
];

const uptimeData = Array.from({ length: 7 }, (_, i) => ({
    day: `D${i + 1}`,
    uptime: 98 + Math.random() * 2
}));

// Chat Message Types
type Message = {
    role: 'user' | 'assistant';
    text?: string;
    type?: 'text' | 'plan' | 'confirmation' | 'asset_list' | 'question';
    data?: any;
};

export default function RiskDashboard() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // AI Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            text: "Hello! How can I help you today?",
            type: 'text'
        }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);

    // Fetch real assets from backend
    useEffect(() => {
        async function fetchAssets() {
            try {
                const ports = [4000];
                let data = null;

                for (const port of ports) {
                    try {
                        const res = await fetch(`http://127.0.0.1:${port}/api/assets`);
                        if (res.ok) {
                            data = await res.json();
                            break;
                        }
                    } catch (err) {
                        continue;
                    }
                }

                if (data) {
                    setAssets(data);
                }
            } catch (error) {
                console.error('Error fetching assets:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchAssets();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleTileClick = (id: string) => {
        setSelectedCategory(prev => prev === id ? null : id);
    };

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
                setIsChatOpen(false);
            }
        }

        if (isChatOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isChatOpen]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: 'user', text: input, type: 'text' };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput('');
        setIsTyping(true);

        // Get real assets based on selected category
        let contextAssets = [];
        if (selectedCategory) {
            contextAssets = getFilteredAssets(assets, selectedCategory);
        } else {
            // Default to all assets for context
            contextAssets = assets;
        }

        // Build conversation history for backend
        const conversationHistory = messages.map(m => ({
            role: m.role,
            message: m.text || '',
            type: m.type,
            awaitingInput: m.data?.awaitingInput,
            pendingAction: m.data?.pendingAction
        }));

        // Call Real AI Backend with conversation context
        try {
            const ports = [4000];
            let data = null;

            console.log('🤖 Sending message to FleetAI:', currentInput);
            console.log('📊 Context assets count:', contextAssets.length);
            console.log('💬 Conversation history:', conversationHistory.length);

            for (const port of ports) {
                try {
                    console.log(`🔌 Trying backend on port ${port}...`);
                    const response = await fetch(`http://127.0.0.1:${port}/api/copilot/fleet-chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            asset_ids: contextAssets.map(a => a.id),
                            asset_context: contextAssets,
                            prompt: currentInput,
                            conversationHistory: conversationHistory
                        })
                    });

                    console.log(`✅ Port ${port} responded:`, response.status, response.statusText);

                    if (response.ok) {
                        data = await response.json();
                        console.log('📦 Received data from backend:', data);
                        break;
                    }
                } catch (err) {
                    console.warn(`❌ Port ${port} failed:`, err);
                    continue;
                }
            }

            setIsTyping(false);

            // Check response and display
            if (!data) {
                console.error('❌ No data received from any backend port');
                throw new Error('Backend not responding');
            }

            if (data.plan) {
                console.log('✨ Displaying AI response, type:', data.plan.type);

                // Handle different response types
                const aiResponse: Message = {
                    role: 'assistant',
                    type: data.plan.type || 'plan',
                    text: data.plan.message,
                    data: data.plan
                };

                setMessages(prev => [...prev, aiResponse]);
            } else {
                console.error('❌ Response missing plan field:', data);
                throw new Error('Invalid response format');
            }

        } catch (error) {
            console.error('🚨 AI request error:', error);
            setIsTyping(false);

            // Friendly fallback message
            const fallbackMsg: Message = {
                role: 'assistant',
                text: "I'm here to help! 😊 Try asking me:\n\n• 'Show critical assets'\n• 'Fleet status'\n• 'Schedule maintenance'",
                type: 'text'
            };
            setMessages(prev => [...prev, fallbackMsg]);
        }
    };

    const handleGeneratePlan = async () => {
        setIsTyping(true);
        try {
            // Try both ports
            const ports = [4000];
            let data = null;
            for (const port of ports) {
                try {
                    const res = await fetch(`http://127.0.0.1:${port}/api/copilot/plan`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ asset_ids: [] }) // Empty = all
                    });
                    if (res.ok) {
                        data = await res.json();
                        break;
                    }
                } catch (e) { continue; }
            }

            if (data && data.success) {
                // Force assign technician if missing (Frontend Fallback)
                const techList = ["John Smith", "Mike Chen", "Sarah Johnson", "Emily Davis"];
                data.assets = data.assets.map((a: any) => ({
                    ...a,
                    assigned_technician: a.assigned_technician || techList[Math.floor(Math.random() * techList.length)]
                }));

                // Save to LocalStorage for Action Board
                localStorage.setItem('maintenancePlan', JSON.stringify(data));

                // Add success message
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    type: 'text',
                    text: `✅ **Maintenance Plan Generated**\n\n${data.plan_summary}\n\nPlease check the **Action Board** to review and approve these actions.`
                }]);
            } else {
                throw new Error('Failed to generate plan');
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', type: 'text', text: "❌ Failed to generate plan. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] bg-gray-50 relative">
            {/* MAIN DASHBOARD CONTENT (Full Width) */}
            <div className="h-full overflow-y-auto p-8 pb-0">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-ups-brown mb-6">Risk Dashboard</h1>

                    {/* Big Tiles */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {getTiles(assets).map((tile) => {
                            const Icon = tile.icon;
                            const isSelected = selectedCategory === tile.id;
                            return (
                                <div
                                    key={tile.id}
                                    onClick={() => handleTileClick(tile.id)}
                                    className={clsx(
                                        "bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all duration-200 hover:shadow-md relative overflow-hidden group",
                                        isSelected ? `ring-2 ring-offset-2 ${tile.activeBorder} border-transparent` : "border-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    <div className="flex items-start justify-between relative z-10">
                                        <div>
                                            <p className="text-neutral-text text-sm font-medium">{tile.label}</p>
                                            <p className="text-4xl font-bold text-neutral-heading mt-2">{tile.count}</p>
                                            <p className="text-xs text-gray-500 mt-2 font-medium">{tile.description}</p>
                                        </div>
                                        <div className={clsx("p-3 rounded-full transition-transform group-hover:scale-110", tile.bg)}>
                                            <Icon className={clsx("w-8 h-8", tile.color)} />
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className={clsx("absolute inset-0 opacity-5 pointer-events-none", tile.bg)} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Drill Down List */}
                    <AnimatePresence>
                        {selectedCategory && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                            {getTiles(assets).find(t => t.id === selectedCategory)?.icon && (() => {
                                                const Icon = getTiles(assets).find(t => t.id === selectedCategory)!.icon;
                                                return <Icon className="w-5 h-5 text-gray-500" />;
                                            })()}
                                            {selectedCategory} Assets List
                                        </h3>
                                        <button onClick={() => setSelectedCategory(null)} className="p-1 hover:bg-gray-200 rounded-full">
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                    <div className="p-0">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-3 font-medium">Asset ID</th>
                                                    <th className="px-6 py-3 font-medium">Type</th>
                                                    <th className="px-6 py-3 font-medium">Issue Detected</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {getFilteredAssets(assets, selectedCategory || '').map((asset) => (
                                                    <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-ups-brown">{asset.id}</td>
                                                        <td className="px-6 py-4 text-gray-600">{asset.type}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-gray-700 font-medium">{asset.predicted_failure || 'No issues detected'}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {getFilteredAssets(assets, selectedCategory || '').length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                            No assets found in this category.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Geospatial Intelligence (Fleet Map) */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                                <Pin className="w-5 h-5 text-ups-brown" /> Geospatial Intelligence
                            </h3>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">LIVE VIEW</span>
                        </div>
                        <FleetMap assets={assets} />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 h-auto lg:h-80">
                        {/* Bar Chart - Risk by Component */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <h3 className="font-bold text-gray-700 mb-4">Risk by Component</h3>
                            <div className="flex-1 min-h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
                                        <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" fill="#662F12" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Uptime Line Chart */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <h3 className="font-bold text-gray-700 mb-4">Fleet Uptime Trend</h3>
                            <div className="flex-1 min-h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={uptimeData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                        <YAxis domain={[90, 100]} tick={{ fontSize: 12 }} />
                                        <RechartsTooltip />
                                        <Line type="monotone" dataKey="uptime" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Draggable Chat Bubble */}
            <AnimatePresence>
                {!isChatOpen && (
                    <motion.div
                        drag
                        dragMomentum={false}
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // Constraints relative to parent, simplified for now
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        onClick={() => setIsChatOpen(true)}
                        className="absolute bottom-1 right-6 z-50 cursor-pointer group"
                    >
                        <div className="bg-gradient-to-br from-ups-brown to-[#3E1C0A] text-ups-gold p-4 rounded-full flex items-center justify-center border-t border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.5),_0_4px_6px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-110">
                            <Bot className="w-8 h-8 drop-shadow-md" />
                            {/* Unread dot simulation */}
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Dialog / Modal */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        ref={chatRef}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="absolute bottom-20 right-6 z-50 w-96 h-[500px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-ups-brown text-white shadow-md flex items-center justify-between cursor-move">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white/10 rounded-full">
                                    <Bot className="w-5 h-5 text-ups-gold" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-sm">Maintenance Copilot</h2>
                                    <p className="text-xs text-ups-cream/80">AI Assistant</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                                    onClick={() => setIsChatOpen(false)}
                                    title="Close Chat"
                                >
                                    Close <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions Toolbar */}
                        <div className="bg-gray-50 p-2 flex gap-2 justify-center border-b border-gray-100">
                            <button
                                onClick={handleGeneratePlan}
                                className="bg-ups-gold/20 hover:bg-ups-gold/30 text-ups-brown text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                            >
                                <Zap className="w-3 h-3" /> Auto-Plan
                            </button>
                            <button
                                onClick={() => { setInput('Show Critical Assets'); handleSendMessage(); }}
                                className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                            >
                                <AlertTriangle className="w-3 h-3" /> Critical
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={clsx("flex flex-col max-w-[90%]", msg.role === 'user' ? "self-end items-end" : "self-start items-start")}>
                                    {/* User Messages */}
                                    {msg.role === 'user' && (
                                        <div className="p-3 rounded-2xl text-sm shadow-sm bg-ups-brown text-white rounded-tr-none whitespace-pre-wrap">
                                            {msg.text}
                                        </div>
                                    )}

                                    {/* AI Text Responses */}
                                    {msg.role === 'assistant' && (
                                        <div className="w-full space-y-2">
                                            <div className="bg-white border border-gray-200 text-gray-800 rounded-tl-none p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap">
                                                {msg.text || msg.data?.message}
                                            </div>

                                            {/* Inline Option Buttons */}
                                            {msg.data?.options && msg.data.options.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {msg.data.options.map((option: string, optIdx: number) => (
                                                        <button
                                                            key={optIdx}
                                                            onClick={() => {
                                                                setInput(option);
                                                                setTimeout(() => handleSendMessage(), 100);
                                                            }}
                                                            className="px-3 py-1.5 bg-white text-ups-brown border border-ups-brown/50 shadow-sm hover:bg-ups-brown hover:text-white rounded-lg text-xs font-bold transition-all"
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="flex gap-1 p-3 bg-white border border-gray-200 rounded-2xl rounded-tl-none w-16 shadow-sm">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-200 relative z-20">
                            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-2 focus-within:ring-1 focus-within:ring-ups-brown transition-all">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Prioritize brakes..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-gray-800 placeholder:text-gray-400"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!input.trim() || isTyping}
                                    className="p-2 bg-ups-brown text-white rounded-lg hover:bg-[#50240E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
