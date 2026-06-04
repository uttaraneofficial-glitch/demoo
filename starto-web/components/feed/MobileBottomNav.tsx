"use client"

import { Home, Zap, BarChart3, Users, MapPin, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useNetworkStore } from '@/store/useNetworkStore'

const navItems = [
    { icon: Home, label: 'Feed', href: '/feed' },
    { icon: Zap, label: 'Signals', href: '/feed/my' },
    { icon: BarChart3, label: 'Explore', href: '/explore' },
    { icon: Users, label: 'Network', href: '/network' },
    { icon: MapPin, label: 'Nearby', href: '/nearby' },
]

export default function MobileBottomNav() {
    const pathname = usePathname()
    const { isAuthenticated, user } = useAuthStore()
    const { pendingRequests, offers } = useNetworkStore()

    const hasViews = user && ((pendingRequests?.length || 0) > 0 || (offers?.length || 0) > 0);

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border z-50 flex items-center justify-around px-2 shadow-[0_-4px_15px_-10px_rgba(0,0,0,0.05)]">
            {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/feed' && pathname.startsWith(item.href))

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${isActive
                            ? 'text-primary scale-110'
                            : 'text-text-secondary hover:text-primary'
                            }`}
                    >
                        <div className="relative">
                            <Icon className="w-5 h-5 mb-1" />
                            {item.label === 'Network' && hasViews && (
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                            )}
                        </div>
                        <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
                    </Link>
                )
            })}
            <Link
                href={isAuthenticated ? "/profile" : "/auth"}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${pathname === '/profile' || pathname === '/auth'
                    ? 'text-primary scale-110'
                    : 'text-text-secondary hover:text-primary'
                    }`}
            >
                {isAuthenticated && user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Profile" className="w-5 h-5 rounded-full mb-1 object-cover border border-border" />
                ) : (
                    <Settings className="w-5 h-5 mb-1" />
                )}
                <span className="text-[9px] font-bold tracking-tight">{isAuthenticated ? 'Profile' : 'Login'}</span>
            </Link>
        </div>
    )
}
