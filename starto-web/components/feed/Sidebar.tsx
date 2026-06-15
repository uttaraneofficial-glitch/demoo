"use client"

import { Home, Zap, BarChart3, Users, MapPin, Settings, LogIn, Bell, Info, ShieldCheck, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useSignalStore } from '@/store/useSignalStore'
import { useNetworkStore } from '@/store/useNetworkStore'
import { signalsApi, notificationsApi } from '@/lib/apiClient'
import VerifiedAvatar from './VerifiedAvatar'
import { useTheme } from '@/components/ThemeProvider'

const ADMIN_EMAIL = "krishnamurthikm07@gmail.com";

const navItems = [
    { icon: Home, label: 'Home Feed', href: '/feed' },
    { icon: Zap, label: 'My Signals', href: '/feed/my' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
    { icon: BarChart3, label: 'Starto AI', href: '/explore' },
    { icon: Users, label: 'My Network', href: '/network' },
    { icon: MapPin, label: 'Nearby', href: '/nearby' },
    { icon: Info, label: 'About Us', href: '/about' },
]

export default function Sidebar() {
    const pathname = usePathname()
    const { user, isAuthenticated, isFirebaseReady } = useAuthStore()
    const { theme, toggleTheme } = useTheme()

    const isAdmin = !!isAuthenticated && !!user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const displayNavItems = isAdmin
        ? [...navItems.slice(0, -1), { icon: ShieldCheck, label: 'Admin', href: '/admin' }, navItems[navItems.length - 1]]
        : navItems;
    const { signals } = useSignalStore()
    const { connections, pendingRequests, offers } = useNetworkStore()
    const [totalSignalCount, setTotalSignalCount] = useState(0)
    const [myNetworkCount, setMyNetworkCount] = useState(0)
    const [unreadNotifCount, setUnreadNotifCount] = useState(0)
    const [backendStatus, setBackendStatus] = useState<'checking' | 'live' | 'offline'>('checking')

    // Fetch true counts from backend
    useEffect(() => {
        if (isAuthenticated && user && isFirebaseReady) {
            signalsApi.getMine().then(({ data }) => {
                if (data) {
                    const sigCount = data.signals?.length || 0;
                    const spaceCount = (data as any).spaces?.length || 0;
                    setTotalSignalCount(sigCount + spaceCount);
                }
            });
            // Also networking count could be fetched here if needed
            setMyNetworkCount(user.networkSize ?? connections.length);

            // Fetch unread notifications (strictly last 7 days)
            notificationsApi.getAll().then(({ data }) => {
                if (data) {
                    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                    const count = data.filter((n: any) => {
                        const created = new Date(n.createdAt).getTime();
                        const isRead = n.isRead ?? n.read ?? n.is_read ?? false;
                        return created >= sevenDaysAgo && !isRead;
                    }).length;
                    setUnreadNotifCount(count);
                }
            })
        }
    }, [isAuthenticated, user, isFirebaseReady, signals, connections])

    // Listen for notification read events to update count
    useEffect(() => {
        const handleRead = () => {
            setUnreadNotifCount(0);
        }
        window.addEventListener('notificationsRead', handleRead);
        return () => window.removeEventListener('notificationsRead', handleRead);
    }, [])

    // Ping backend to check connectivity
    useEffect(() => {
        signalsApi.getAll().then(({ error }) => {
            setBackendStatus(error ? 'offline' : 'live')
        })
    }, [])

    const hasNetworkNotifications = user && ((pendingRequests?.length || 0) > 0 || (offers?.length || 0) > 0);

    return (
        <aside className="hidden md:flex w-[240px] sticky top-0 h-screen flex-col border-r border-border bg-background p-4 pt-8 shrink-0">
            {isAuthenticated && user ? (
                <Link href="/profile" className="flex items-center gap-3 mb-10 px-2 group hover:bg-surface-2 p-2 rounded-xl transition-all">
                    <VerifiedAvatar
                        username={user.name || user.username || ''}
                        avatarUrl={user.avatarUrl}
                        plan={user.subscription || user.plan}
                        isVerified={user.isVerified}
                        size="w-10 h-10"
                        badgeSize="w-3.5 h-3.5"
                        fallback={<Users className="w-6 h-6 text-text-muted" />}
                    />
                    <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{user.name}</h3>
                        </div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">{user.role} • {user.city?.split(',')[0]}</p>
                    </div>
                </Link>
            ) : (
                <Link href="/auth" className="flex items-center gap-3 mb-10 px-2 group hover:bg-surface-2 p-2 rounded-xl transition-all border border-transparent hover:border-border">
                    <div className="w-10 h-10 bg-primary/10 rounded-full overflow-hidden border border-primary/20 relative flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <LogIn className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                        <h3 className="font-medium text-sm text-primary">Login / Register</h3>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium mt-0.5">Enter Ecosystem</p>
                    </div>
                </Link>
            )}

            <nav className="flex-1 space-y-1">
                {displayNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = item.href === '/profile'
                        ? pathname === '/profile'
                        : pathname === item.href || (item.href !== '/feed' && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex justify-between items-center px-3 py-2.5 rounded-md transition-all ${isActive
                                ? 'bg-primary text-background shadow-sm shadow-black/5'
                                : 'text-text-secondary hover:bg-surface-2 hover:text-primary'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{item.label}</span>
                            </div>
                            {item.label === 'My Network' && hasNetworkNotifications && (
                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-surface' : 'bg-primary'}`} title="New requests or offers" />
                            )}
                            {item.label === 'Notifications' && unreadNotifCount > 0 && (
                                <div className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-surface text-text-primary' : 'bg-primary text-background'}`}>
                                    {unreadNotifCount}
                                </div>
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="pt-6 border-t border-border mt-auto">
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-text-muted mb-1">Signals</p>
                        <p className="text-lg font-mono font-bold">{totalSignalCount}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-text-muted mb-1">Network</p>
                        <p className="text-lg font-mono font-bold">{myNetworkCount}</p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-text-muted mb-1">Plan</p>
                        <p className="text-xs font-bold truncate text-primary">{user?.subscription || user?.plan || 'Free'}</p>
                    </div>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-surface-2 transition-all text-text-secondary hover:text-primary mb-2"
                >
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <span className="text-[10px] font-bold uppercase tracking-widest">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                </button>

                <div className="flex items-center gap-2 transition-all cursor-pointer">
                    <Image src="/logo.png" alt="Starto Logo" width={50} height={16} className="object-contain dark:invert" />
                </div>
            </div>
        </aside>
    )
}
