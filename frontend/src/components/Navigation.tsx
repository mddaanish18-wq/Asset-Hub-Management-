'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, AlertTriangle, FileText, Activity, Settings, HelpCircle, User } from 'lucide-react';
import clsx from 'clsx';
import { SettingsModal } from './SettingsModal';
import { SupportModal } from './SupportModal';

const navItems = [
    { name: 'Asset Health Hub', href: '/', icon: LayoutDashboard },
    { name: 'Risk Dashboard', href: '/risk', icon: AlertTriangle },
    { name: 'Action Board', href: '/actions', icon: FileText },
    { name: 'Ops Console', href: '/ops', icon: Activity },
];

const bottomItems = [
    { name: 'Support', href: '#', icon: HelpCircle, action: 'openSupport' },
    { name: 'Settings', href: '#', icon: Settings, action: 'openSettings' },
];

export function Navigation() {
    const pathname = usePathname();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    return (
        <>
            <nav className="h-screen w-64 bg-ups-brown text-white flex flex-col fixed left-0 top-0 shadow-xl z-50 transition-colors duration-300">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center gap-3">
                    {/* Logo */}
                    <div className="w-10 h-10 relative flex-shrink-0 bg-white rounded-lg p-1">
                        <img src="/logo.png" alt="Asset Guardian Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="font-bold text-lg tracking-tight leading-5 text-white">
                        Asset<br />Guardian
                    </h1>
                </div>

                {/* Main Navigation */}
                <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-ups-orange text-white shadow-md'
                                        : 'text-ups-cream hover:bg-white/10'
                                )}
                            >
                                <Icon className="w-5 h-5 mr-3" />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Section */}
                <div className="p-4 border-t border-white/10 bg-[#50240E]">
                    <div className="space-y-1 mb-4">
                        {bottomItems.map((item) => {
                            const Icon = item.icon;
                            if (item.action === 'openSettings') {
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="w-full flex items-center px-4 py-2 text-sm font-medium text-ups-cream hover:bg-white/10 rounded-lg transition-colors text-left"
                                    >
                                        <Icon className="w-4 h-4 mr-3" />
                                        {item.name}
                                    </button>
                                )
                            }
                            if (item.action === 'openSupport') {
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => setIsSupportOpen(true)}
                                        className="w-full flex items-center px-4 py-2 text-sm font-medium text-ups-cream hover:bg-white/10 rounded-lg transition-colors text-left"
                                    >
                                        <Icon className="w-4 h-4 mr-3" />
                                        {item.name}
                                    </button>
                                )
                            }
                            return (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-ups-cream hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <Icon className="w-4 h-4 mr-3" />
                                    {item.name}
                                </a>
                            );
                        })}
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-black/20 mt-2">
                        <div className="w-8 h-8 rounded-full bg-ups-cream flex items-center justify-center text-ups-brown font-bold">
                            JD
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold truncate text-white">John Doe</p>
                            <p className="text-xs text-ups-cream/70 truncate">Fleet Manager</p>
                        </div>
                    </div>
                </div>
            </nav>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
        </>
    );
}
