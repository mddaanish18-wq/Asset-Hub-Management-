'use client';
import { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form State
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('Technical Issue');
    const [priority, setPriority] = useState('Normal');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate network request
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);

            // Reset after showing success
            setTimeout(() => {
                setIsSuccess(false);
                setSubject('');
                setDescription('');
                onClose();
            }, 2000);
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
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
                    className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 bg-ups-brown text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <HelpCircle className="w-6 h-6 text-ups-gold" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Contact Support</h2>
                                <p className="text-ups-cream/80 text-sm">We're here to help.</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto">
                        {!isSuccess ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Type & Priority Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Category</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-ups-brown focus:ring-1 focus:ring-ups-brown outline-none transition-all"
                                        >
                                            <option>Technical Issue</option>
                                            <option>Account Support</option>
                                            <option>Feature Request</option>
                                            <option>Billing Question</option>
                                            <option>Other</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Priority</label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-ups-brown focus:ring-1 focus:ring-ups-brown outline-none transition-all"
                                        >
                                            <option>Low</option>
                                            <option>Normal</option>
                                            <option>High</option>
                                            <option>Critical</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Subject */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Subject</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Brief summary of the issue..."
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-ups-brown focus:ring-1 focus:ring-ups-brown outline-none transition-all placeholder:text-gray-400"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex justify-between">
                                        Problem Description
                                        <span className="text-xs font-normal text-gray-400">Please provide details</span>
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe what happened, steps to reproduce, etc..."
                                        className="w-full p-3 h-32 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-ups-brown focus:ring-1 focus:ring-ups-brown outline-none transition-all resize-none placeholder:text-gray-400"
                                        required
                                    />
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-2 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={clsx(
                                            "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold text-white transition-all shadow-md",
                                            isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-ups-brown hover:bg-[#50240E] active:scale-95"
                                        )}
                                    >
                                        {isSubmitting ? (
                                            <>Processing...</>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Send Report
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="h-80 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Report Sent!</h3>
                                    <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                                        Thank you for your feedback. Our support team will review your ticket and get back to you shortly.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
