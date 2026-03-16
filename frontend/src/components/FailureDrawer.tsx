'use client';
import { useState, useEffect } from 'react';
import { X, Calendar, Activity, Thermometer, Droplet, Clock, CheckCircle, AlertTriangle, User, Wrench, Bot, Cpu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { TelemetryChart } from './TelemetryChart';

// Mock generating trend history
const generateHistory = (baseValue: number, variance = 0.1) => {
    return Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        value: Number((baseValue * (1 + (Math.random() * variance * 2 - variance))).toFixed(1))
    }));
};

const TECHNICIANS = [
    'John Smith', 'Sarah Connor', 'Mike Ross', 'Rachel Green',
    'Harvey Specter', 'Louis Litt', 'Donna Paulsen', 'Jessica Pearson',
    'Alex Williams', 'Samantha Wheeler'
];

interface FailureDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    asset: any;
    readOnly?: boolean;
    onScheduleConfirm?: (date: string, technician: string) => void;
}

export function FailureDrawer({ isOpen, onClose, asset, readOnly = false, onScheduleConfirm }: FailureDrawerProps) {
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [selectedTech, setSelectedTech] = useState('');

    // RCA & Chat State
    const [rcaResult, setRcaResult] = useState<{ root_cause_summary: string; corrective_steps: string[] } | null>(null);
    const [chatQuestion, setChatQuestion] = useState('');
    const [chatAnswer, setChatAnswer] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [isRunningRCA, setIsRunningRCA] = useState(false);

    // Reset state when asset changes
    useEffect(() => {
        if (asset?.id) {
            setRcaResult(null);
            setChatQuestion('');
            setChatAnswer('');
            setIsRunningRCA(false);
            setIsAsking(false);
        }
    }, [asset?.id]);

    if (!asset) return null;

    const sensorTrends = asset.sensor_trends || {};
    const vibrationData = generateHistory(Number(sensorTrends.vibration || 0), 0.2);
    const tempData = generateHistory(Number(sensorTrends.temp || 180), 0.05);
    // Mock Frequency Data (sine waveish)
    const freqData = Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        value: Math.floor(50 + Math.sin(i) * 10 + Math.random() * 5)
    }));

    const handleInvite = () => {
        if (!scheduleDate || !selectedTech) {
            alert('Please select date and technician');
            return;
        }

        if (onScheduleConfirm) {
            onScheduleConfirm(scheduleDate, selectedTech);
        } else {
            alert(`Maintenance Scheduled for ${asset.id} on ${scheduleDate} with ${selectedTech}`);
        }

        setIsScheduling(false);
        onClose();
    };

    const handleRunRCA = async () => {
        setIsRunningRCA(true);
        try {
            console.log('Running RCA for asset:', asset.id);
            // using 127.0.0.1 to avoid localhost resolution issues in some envs
            const res = await fetch('http://127.0.0.1:4000/api/copilot/rca', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ asset_id: asset.id })
            });
            console.log('RCA Response status:', res.status);

            if (res.ok) {
                const data = await res.json();
                setRcaResult(data);
            } else {
                const text = await res.text();
                console.error('RCA Failed:', text);
                alert(`Analysis failed: ${res.statusText}`);
            }
        } catch (e: any) {
            console.error('RCA Error:', e);
            alert(`Network error: ${e.message}`);
        } finally {
            setIsRunningRCA(false);
        }
    };

    const handleAskCopilot = async () => {
        if (!chatQuestion.trim()) return;
        setIsAsking(true);
        try {
            const res = await fetch('http://127.0.0.1:4000/api/copilot/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ asset_id: asset.id, question: chatQuestion })
            });
            if (res.ok) {
                const data = await res.json();
                setChatAnswer(data.answer);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAsking(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black z-40"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-neutral-bg shadow-2xl border-l border-gray-200 flex flex-col"
                    >
                        {/* 1. Sticky Header */}
                        <div className="p-6 border-b border-gray-200 bg-white z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-ups-brown">{asset.id}</h2>
                                    <p className="text-neutral-text font-medium">{asset.type} • {asset.region}</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* 2. Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-neutral-bg">

                            {/* Copilot Explanation (if available in asset) */}
                            {asset.explanation && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Bot className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-bold text-blue-800 text-sm">Copilot Insight</h3>
                                    </div>
                                    <p className="text-sm text-blue-900 leading-relaxed">
                                        {asset.explanation}
                                    </p>
                                </div>
                            )}

                            {/* Predicted Failure */}
                            <div className={clsx(
                                "p-4 rounded-xl border border-l-4 shadow-sm",
                                asset.risk_level === 'Critical' ? "bg-red-50 border-l-ups-orange border-red-200" : "bg-green-50 border-l-green-500 border-green-200"
                            )}>
                                <div className="flex items-start gap-4">
                                    <Activity className={clsx("w-6 h-6 mt-1", asset.risk_level === 'Critical' ? "text-ups-orange" : "text-green-600")} />
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">Failure Prediction</h3>
                                        <div className="text-lg font-bold mt-1 text-gray-800">
                                            {asset.predicted_failure}
                                        </div>
                                        <div className="mt-2 text-sm text-gray-600 bg-white/50 px-2 py-1 rounded inline-block">
                                            Confidence: <strong>{asset.confidence}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Root Cause Analysis Section */}
                            <div>
                                <h3 className="text-lg font-bold text-ups-brown mb-4 flex items-center gap-2">
                                    <Cpu className="w-5 h-5" /> Root Cause & Fix
                                </h3>
                                {!rcaResult ? (
                                    <button
                                        onClick={handleRunRCA}
                                        disabled={isRunningRCA}
                                        className="text-sm font-bold text-white bg-ups-brown px-4 py-2 rounded-lg hover:bg-[#50240E] transition-colors disabled:opacity-50"
                                    >
                                        {isRunningRCA ? 'Analyzing...' : 'Run Root Cause Analysis'}
                                    </button>
                                ) : (
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="text-sm text-gray-800 font-medium border-b border-gray-100 pb-2">
                                            {rcaResult.root_cause_summary}
                                        </div>
                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                            {rcaResult.corrective_steps.map((step, i) => (
                                                <li key={i}>{step}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>




                            {/* Live Telemetry Preview */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-ups-brown mb-4 flex items-center gap-2">
                                    <Activity className="w-5 h-5" /> Live Sensor Telemetry
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Logic to determine critical values based on issue text */}
                                    {(() => {
                                        const issue = (asset.predicted_failure || "").toLowerCase() + (asset.issue || "").toLowerCase();
                                        const isHeat = issue.includes('overheat') || issue.includes('temp') || issue.includes('coolant');
                                        const isVib = issue.includes('brake') || issue.includes('vibration') || issue.includes('tire') || issue.includes('suspension') || issue.includes('axle');

                                        // Default stable values
                                        let vibBase = 1.8;
                                        let tempBase = 185;

                                        // Override if critical
                                        if (isHeat) tempBase = 245; // Well above 220 threshold
                                        if (isVib) vibBase = 5.2;   // Well above 4.5 threshold

                                        return (
                                            <>
                                                <TelemetryChart
                                                    label="Engine Vibration"
                                                    unit="G"
                                                    baseValue={vibBase}
                                                    threshold={4.5}
                                                />
                                                <TelemetryChart
                                                    label="Coolant Temp"
                                                    unit="°F"
                                                    baseValue={tempBase}
                                                    threshold={220}
                                                    color="#3B82F6"
                                                />
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Maintenance Timeline */}
                            <div>
                                <h3 className="text-lg font-bold text-ups-brown mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5" /> Maintenance Timeline
                                </h3>
                                <div className="space-y-3 pl-2">
                                    {[
                                        { task: 'Brake System Inspection', status: 'Completed', date: '2 days ago', color: 'bg-green-100 text-green-700' },
                                        { task: 'Oil Filter Change', status: 'Completed', date: '2 weeks ago', color: 'bg-green-100 text-green-700' },
                                        { task: asset.predicted_failure.split(':')[0] || 'Scheduled Sensor Check', status: 'Predicted', date: 'Upcoming (48h)', color: 'bg-red-100 text-red-700' },
                                        { task: 'Tire Rotation', status: 'Upcoming', date: 'In 2 weeks', color: 'bg-blue-100 text-blue-700' },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${item.status === 'Completed' ? 'bg-green-500' : item.status === 'Predicted' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                                <span className="text-sm font-medium text-gray-700">{item.task}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${item.color}`}>
                                                    {item.status}
                                                </span>
                                                <span className="text-xs text-gray-400 mt-1">{item.date}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>



                        </div>

                        {/* 3. Fixed Footer - Schedule Action - Hidden if ReadOnly */}
                        {!readOnly && (
                            <div className="p-6 border-t border-gray-200 bg-white z-10">
                                {!isScheduling ? (
                                    <button
                                        onClick={() => setIsScheduling(true)}
                                        className="w-full py-3 bg-ups-brown text-white rounded-lg font-bold shadow-md hover:bg-[#50240E] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Wrench className="w-4 h-4" />
                                        Schedule Maintenance
                                    </button>
                                ) : (
                                    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Select Date</label>
                                            <input
                                                type="date"
                                                className="w-full p-2 border border-gray-300 rounded mt-1 text-sm outline-none focus:border-ups-brown text-black font-medium"
                                                onChange={(e) => setScheduleDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Assign Technician</label>
                                            <div className="relative mt-1">
                                                <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                                                <select
                                                    className="w-full p-2 pl-9 border border-gray-300 rounded text-sm outline-none focus:border-ups-brown bg-white appearance-none text-black font-medium"
                                                    onChange={(e) => setSelectedTech(e.target.value)}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Choose a technician...</option>
                                                    {TECHNICIANS.map(tech => (
                                                        <option key={tech} value={tech}>{tech}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => setIsScheduling(false)}
                                                className="flex-1 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleInvite}
                                                className="flex-1 py-2 bg-ups-orange text-white font-bold rounded shadow hover:bg-orange-600"
                                            >
                                                Confirm Schedule
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
