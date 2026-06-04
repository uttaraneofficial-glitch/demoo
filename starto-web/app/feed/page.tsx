"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/feed/Sidebar'
import MobileBottomNav from '@/components/feed/MobileBottomNav'
import SignalCard from '@/components/feed/SignalCard'
import { Plus, Search, Loader2, WifiOff, Bell, X, Building } from 'lucide-react'
import RaiseSignalModal from '@/components/feed/RaiseSignalModal'
import CreateSpaceModal from '@/components/feed/CreateSpaceModal'
import { useSignalStore, Signal, getSignalExpiration } from '@/store/useSignalStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useNetworkStore } from '@/store/useNetworkStore'
import { useSearchStore } from '@/store/useSearchStore'
import { signalsApi, ApiSignal, notificationsApi } from '@/lib/apiClient'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import SearchResultsPanel from '@/components/feed/SearchResultsPanel'

function formatInstagramTime(createdAt?: any) {
    let createdMs = 0;
    if (createdAt) {
        if (typeof createdAt === 'number') {
            // Convert seconds to ms if needed
            createdMs = createdAt < 10000000000 ? createdAt * 1000 : createdAt;
        } else {
            createdMs = new Date(createdAt).getTime();
        }
    }
    if (!createdMs) return 'now';
    const diffMs = Math.max(0, Date.now() - createdMs);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffWeeks > 0) return `${diffWeeks}w`;
    if (diffDays > 0) return `${diffDays}d`;
    if (diffHrs > 0) return `${diffHrs}h`;
    if (diffMin > 0) return `${diffMin}m`;
    return 'now';
}

// Map backend ApiUnifiedPost → the shape SignalCard expects
function mapApiSignalToCard(s: any) {
    const timeAgo = formatInstagramTime(s.createdAt);

    return {
        id: s.id,
        type: s.type, // SIGNAL or SPACE
        title: s.title || '(Untitled)',
        username: s.username || 'unknown',
        userId: s.userId,
        timeAgo,
        category: s.category || 'General',
        description: s.description || '',
        strength: s.type === 'SPACE' ? (s.spaceType || 'Space') : (s.signalStrength || '7 Days'),
        stats: {
            responses: s.responseCount ?? 0,
            offers: s.offerCount ?? 0,
            views: s.viewCount ?? 0,
        },
        userPlan: s.userPlan || 'free',
        userIsVerified: s.userIsVerified,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        signalStrength: s.signalStrength,
        
        // Space specific
        city: s.city,
        state: s.state,
        address: s.address,
        website: s.website,
        contact: s.contact,
        avatarUrl: s.avatarUrl
    }
}

export default function HomeFeed() {
    const router = useRouter()
    const { isAuthenticated, user } = useAuthStore()
    const { signals: localSignals } = useSignalStore()
    const { connections, sentRequests, pendingRequests, sendRequest } = useNetworkStore()
    const { query, setQuery, performSearch, clearSearch } = useSearchStore()

    // ── Backend signal state ──────────────────────────────────────────────────
    const [apiSignals, setApiSignals] = useState<ApiSignal[]>([])
    const [loading, setLoading] = useState(true)
    const [backendError, setBackendError] = useState<string | null>(null)
    const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false)
    const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [notifications, setNotifications] = useState<any[]>([])
    const [showNotifDropdown, setShowNotifDropdown] = useState(false)
    const notifRef = useRef<HTMLDivElement>(null)

    // Normalize: Java Boolean isRead serializes as "read" in Jackson
    // Normalize: Handle various serialization styles from the backend (Jackson/Lombok quirks)
    const normalizeNotif = (n: any) => ({ 
        ...n, 
        isRead: n.isRead ?? n.read ?? n.is_read ?? n.isRead === true ?? false 
    })
    const unreadCount = notifications.filter(n => !n.isRead).length

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifDropdown(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 2) {
                performSearch(query)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [query, performSearch])

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setBackendError(null)

        signalsApi.getAll().then(({ data, error }) => {
            if (cancelled) return
            if (error || data === null) {
                setBackendError(error || 'Could not reach backend')
            } else {
                console.log('[DEBUG] API Signals:', data);
                setApiSignals(Array.isArray(data) ? data : [])
            }
            setLoading(false)
        })

        return () => { cancelled = true }
    }, [refreshKey])

    // Fetch notifications (last 7 days only)
    useEffect(() => {
        if (isAuthenticated) {
            notificationsApi.getAll().then(({ data }) => {
                if (data) {
                    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                    const filtered = data
                        .map(normalizeNotif)
                        .filter(n => {
                            const created = new Date(n.createdAt).getTime();
                            return created >= sevenDaysAgo;
                        });
                    setNotifications(filtered);
                }
            })
        }
    }, [isAuthenticated, refreshKey])

    const requireAuth = (action: () => void) => {
        if (!isAuthenticated) {
            router.push('/auth')
        } else {
            action()
        }
    }

    // Merge backend signals + any local-only signals (created while offline)
    const safeApiSignals = Array.isArray(apiSignals) ? apiSignals : []
    const backendIds = new Set(safeApiSignals.map(s => s.id))
    const localOnly = localSignals.filter(s => !backendIds.has(s.id))
    
    const displaySignals = [
        ...safeApiSignals.map(mapApiSignalToCard),
    ].filter(s => {
        const { isExpired } = getSignalExpiration(s);
        return !isExpired;
    })

    return (
        <div className="min-h-screen bg-background flex justify-center">
            <div className="max-w-[1400px] w-full flex flex-col md:flex-row mb-16 md:mb-0">
                <Sidebar />

                {/* Signals Feed */}
                <main className="flex-1 max-w-2xl w-full px-4 py-8 md:overflow-y-auto border-r border-border">
                    <header className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-background/90 backdrop-blur-md sticky top-0 z-20 py-4 -mx-4 px-4 border-b border-border">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-display tracking-tight text-text-primary">Signals Feed</h1>

                            {/* Backend status and local mode notice moved into header for compactness */}
                            {!loading && backendError && (
                                <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-tighter text-orange-600 border border-orange-200 bg-orange-50/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    <WifiOff className="w-2.5 h-2.5" /> Local
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2 items-center w-full sm:flex-1 justify-end sm:max-w-md sm:ml-4">
                            <div className="relative group flex-1">
                                <div className="relative">
                                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${query ? 'text-primary' : 'text-text-muted'}`} />
                                    <input
                                        type="text"
                                        placeholder="Search signals..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-surface/50 border border-border rounded-full text-sm focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 w-full transition-all"
                                    />
                                    {query && (
                                        <button
                                            onClick={clearSearch}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-border/50 rounded-full"
                                        >
                                            <X className="w-3 h-3 text-text-muted" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => requireAuth(() => setIsSpaceModalOpen(true))}
                                className="bg-surface text-text-primary border border-border px-4 py-2 rounded-full flex items-center gap-2 hover:bg-surface-2 transition-all shrink-0 shadow-sm"
                            >
                                <Building className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Space</span>
                            </button>
                            <button
                                onClick={() => requireAuth(() => setIsRaiseModalOpen(true))}
                                className="bg-primary text-background px-4 py-2 rounded-full flex items-center gap-2 hover:bg-black/90 transition-all shrink-0 shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Raise</span>
                            </button>
                        </div>
                    </header>

                    <div className="relative">
                        <SearchResultsPanel />
                    </div>

                    {/* Backend error notice */}
                    {backendError && (
                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700 flex items-start gap-2">
                            <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                                {backendError.toLowerCase().includes('expired') || backendError.toLowerCase().includes('token') ? (
                                    <>
                                        <strong>Session expired.</strong> Please <a href="/auth" className="underline font-semibold text-black hover:text-primary">login again</a> to view your personalized feed.
                                    </>
                                ) : (
                                    <>
                                        <strong>Backend unreachable:</strong> {backendError}. Showing local signals only.
                                        Make sure the Spring Boot server is running at <code className="font-mono bg-orange-100 px-1 rounded">localhost:8080</code>.
                                    </>
                                )}
                            </span>
                        </div>
                    )}

                    {/* Signal list */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-muted">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-sm">Loading market signals...</p>
                        </div>
                    ) : displaySignals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-muted">
                            <Search className="w-10 h-10 opacity-30" />
                            <p className="text-sm">No signals yet. Be the first to raise one!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displaySignals.map(signal => (
                                <SignalCard
                                    key={signal.id}
                                    {...signal}
                                    hideViews={true}
                                    onRefresh={() => setRefreshKey(k => k + 1)}
                                />
                            ))}
                        </div>
                    )}
                </main>

                <aside className="hidden lg:block w-[320px] p-8 space-y-4">
                    <div className="bg-white/[0.02] border border-border p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="font-display text-lg mb-2 relative z-10">Need Market Analysis?</h3>
                        <p className="text-text-secondary text-sm mb-6 relative z-10">Real World Data. No Hallucinations. Powered by Starto AI.</p>
                        <button onClick={() => requireAuth(() => router.push('/explore'))} className="w-full bg-primary text-background py-3 rounded-md font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 relative z-10">
                            Launch Explore →
                        </button>
                    </div>

                    <div className="bg-surface border border-border border-dashed p-6 rounded-xl shadow-sm relative overflow-hidden group">
                        <div className="absolute top-3 right-3">
                            <span className="text-[8px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                                Coming Soon
                            </span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-3 opacity-50">Ad Network</p>
                        <h3 className="font-display text-base mb-1">Targeted ecosystem ads</h3>
                        <p className="text-text-secondary text-xs mb-4 leading-relaxed">Reach 1000s of founders, investors &amp; mentors directly in their feed.</p>
                        <button
                            disabled
                            className="w-full bg-surface-2 text-text-muted py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-not-allowed border border-border transition-all"
                        >
                            Coming Soon
                        </button>
                    </div>
                </aside>

                <RaiseSignalModal
                    isOpen={isRaiseModalOpen}
                    onClose={() => {
                        setIsRaiseModalOpen(false)
                        // Refresh feed after signal creation attempt
                        setRefreshKey(k => k + 1)
                    }}
                />
                <CreateSpaceModal 
                    isOpen={isSpaceModalOpen}
                    onClose={() => {
                        setIsSpaceModalOpen(false)
                        setRefreshKey(k => k + 1)
                    }}
                />
                <MobileBottomNav />
            </div>
        </div>
    )
}
