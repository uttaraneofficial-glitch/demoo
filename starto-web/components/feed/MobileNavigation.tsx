"use client"

import { Home, Zap, BarChart3, Users, MapPin, Settings, Menu, Bell, Search, X, LogOut, ChevronRight, History, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useNetworkStore } from '@/store/useNetworkStore'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
    { icon: Home, label: 'Feed', href: '/feed' },
    { icon: Zap, label: 'Signals', href: '/feed/my' },
    { icon: BarChart3, label: 'Explore', href: '/explore' },
    { icon: Users, label: 'Network', href: '/network' },
    { icon: MapPin, label: 'Nearby', href: '/nearby' },
    { icon: Settings, label: 'Profile', href: '/profile' },
]

export default function MobileNavigation({ title = "Professional Network" }: { title?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const { isAuthenticated, user, logout } = useAuthStore()
    const { pendingRequests, offers } = useNetworkStore()
    const [isOpen, setIsOpen] = useState(false)

    // Prevent scrolling when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    return (
        <div className="md:hidden">
            {/* Top App Bar */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-40 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 rounded-full hover:bg-surface-2 text-text-primary">
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="font-display text-lg font-bold truncate">{title}</h1>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-2 rounded-full hover:bg-surface-2 text-text-primary">
                        <Search className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-surface-2 text-text-primary relative">
                        <Bell className="w-5 h-5" />
                        {((pendingRequests?.length || 0) > 0 || (offers?.length || 0) > 0) && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-background"></span>
                        )}
                    </button>
                </div>
            </div>

            {/* Empty space to prevent content from hiding under sticky top bar */}
            <div className="h-16 w-full"></div>

            {/* Drawer Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-primary/60 z-[60] backdrop-blur-sm"
                        />
                        
                        {/* Drawer Content */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] bg-background border-r border-border z-[70] flex flex-col overflow-y-auto shadow-2xl"
                        >
                            {/* Drawer Header - User Info */}
                            {isAuthenticated && user ? (
                                <div className="p-6 border-b border-border bg-surface-2">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-background font-display text-2xl shadow-lg relative overflow-hidden">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'
                                            )}
                                        </div>
                                        <button onClick={() => setIsOpen(false)} className="p-2 rounded-full bg-surface-2 text-text-muted hover:text-text-primary">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <h2 className="font-display font-bold text-lg text-text-primary leading-tight">{user.name || user.username}</h2>
                                    <p className="text-text-secondary text-sm mb-2">{user.role || 'Starto Member'}</p>
                                    <p className="text-xs text-text-muted flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {user.city || 'Location unknown'}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-6 border-b border-border bg-surface-2 flex items-center justify-between">
                                    <div>
                                        <h2 className="font-display font-bold text-lg mb-1">Welcome to Starto</h2>
                                        <p className="text-sm text-text-secondary">Join the startup network</p>
                                    </div>
                                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-full bg-surface-2 text-text-muted">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {/* Main Navigation Links */}
                            <div className="flex-1 py-4">
                                <p className="px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-2">Ecosystem</p>
                                <div className="px-3 space-y-1">
                                    {navItems.map((item) => {
                                        const isActive = pathname === item.href || (item.href !== '/feed' && pathname.startsWith(item.href))
                                        return (
                                            <Link
                                                key={item.label}
                                                href={item.href}
                                                onClick={() => setIsOpen(false)}
                                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium ${
                                                    isActive 
                                                    ? 'bg-primary/10 text-primary' 
                                                    : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                                                }`}
                                            >
                                                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
                                                <span className="flex-1">{item.label}</span>
                                            </Link>
                                        )
                                    })}
                                </div>

                                {isAuthenticated && (
                                    <>
                                        <div className="my-4 border-t border-border/50 mx-6"></div>
                                        <p className="px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-2">Status & History</p>
                                        <div className="px-3 space-y-1">
                                            <Link href="/feed/my" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-xl text-text-secondary hover:bg-surface-2 font-medium">
                                                <Zap className="w-5 h-5 text-text-muted" />
                                                <span>Active Signals</span>
                                            </Link>
                                            <Link href="/feed/my" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-xl text-text-secondary hover:bg-surface-2 font-medium">
                                                <History className="w-5 h-5 text-text-muted" />
                                                <span>Past History</span>
                                            </Link>
                                            <Link href="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-xl text-text-secondary hover:bg-surface-2 font-medium">
                                                <MessageSquare className="w-5 h-5 text-text-muted" />
                                                <span>My Reviews</span>
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-4 border-t border-border">
                                {isAuthenticated ? (
                                    <button 
                                        onClick={() => { logout(); setIsOpen(false); router.push('/auth') }}
                                        className="flex items-center justify-center gap-2 w-full py-3 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-medium text-sm"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Log out
                                    </button>
                                ) : (
                                    <Link 
                                        href="/auth"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-background rounded-xl font-medium text-sm"
                                    >
                                        Log In / Register
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

