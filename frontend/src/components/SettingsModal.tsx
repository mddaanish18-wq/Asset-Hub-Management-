'use client';
import { useState, useEffect } from 'react';
import { X, Moon, Sun, Monitor, Sliders, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'appearance' | 'general';
type Theme = 'light' | 'dark' | 'system';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('appearance');
    const [theme, setTheme] = useState<Theme>('light');
    const [refreshRate, setRefreshRate] = useState(30);

    // Apply Theme Effect
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme === 'light') {
            root.classList.remove('dark');
        } else {
            // System
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, [theme]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex h-[600px] text-gray-800"
                >
                    {/* Sidebar */}
                    <div className="w-1/3 bg-gray-50 border-r border-gray-100 p-6 flex flex-col">
                        <h2 className="text-xl font-bold text-ups-brown mb-6">Settings</h2>

                        <nav className="space-y-2 flex-1">
                            <button
                                onClick={() => setActiveTab('appearance')}
                                className={clsx(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                                    activeTab === 'appearance' ? "bg-white shadow text-ups-brown" : "text-gray-600 hover:bg-white/50"
                                )}
                            >
                                <Monitor className="w-4 h-4" /> Appearance
                            </button>
                            <button
                                onClick={() => setActiveTab('general')}
                                className={clsx(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left",
                                    activeTab === 'general' ? "bg-white shadow text-ups-brown" : "text-gray-600 hover:bg-white/50"
                                )}
                            >
                                <Sliders className="w-4 h-4" /> General
                            </button>
                        </nav>

                        <div className="text-xs text-center text-gray-400 mt-auto">
                            v1.0.0 • Asset Guardian
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="flex justify-end mb-4">
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* APPEARANCE TAB */}
                        {activeTab === 'appearance' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Theme</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <button
                                            onClick={() => setTheme('light')}
                                            className={clsx(
                                                "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                                theme === 'light' ? "border-ups-brown bg-orange-50/50" : "border-gray-200 hover:border-gray-300"
                                            )}
                                        >
                                            <Sun className="w-6 h-6 text-orange-500" />
                                            <span className="font-medium text-sm">Light</span>
                                        </button>
                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={clsx(
                                                "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                                theme === 'dark' ? "border-ups-brown bg-gray-900 text-white" : "border-gray-200 hover:border-gray-300"
                                            )}
                                        >
                                            <Moon className="w-6 h-6" />
                                            <span className="font-medium text-sm">Dark</span>
                                        </button>
                                        <button
                                            onClick={() => setTheme('system')}
                                            className={clsx(
                                                "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                                theme === 'system' ? "border-ups-brown bg-blue-50/50" : "border-gray-200 hover:border-gray-300"
                                            )}
                                        >
                                            <Monitor className="w-6 h-6 text-blue-500" />
                                            <span className="font-medium text-sm">System</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Density</h3>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="density" className="accent-ups-brown" defaultChecked />
                                            <span className="text-sm font-medium">Comfortable</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="density" className="accent-ups-brown" />
                                            <span className="text-sm font-medium">Compact</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* GENERAL TAB */}
                        {activeTab === 'general' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Dashboard Data</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <label className="text-sm font-medium text-gray-700">Auto-Refresh Interval</label>
                                                <span className="text-sm font-bold text-ups-brown">{refreshRate}s</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="300"
                                                step="10"
                                                value={refreshRate}
                                                onChange={(e) => setRefreshRate(Number(e.target.value))}
                                                className="w-full accent-ups-brown h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Fetching fresh asset telemetry every {refreshRate} seconds.</p>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Globe className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <p className="text-sm font-bold">Unit System</p>
                                                    <p className="text-xs text-gray-500">Metric (km, °C)</p>
                                                </div>
                                            </div>
                                            <button className="text-xs font-bold text-ups-brown hover:underline">Change</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
