"use client"

import Sidebar from '@/components/feed/Sidebar'
import MobileBottomNav from '@/components/feed/MobileBottomNav'
import { Plus, Search, Edit3, Trash2, ArrowUpRight, Loader2, RefreshCw, Building, MapPin } from 'lucide-react'
import { useSignalStore, getSignalExpiration } from '@/store/useSignalStore'
import { useAuthStore } from '@/store/useAuthStore'
import { signalsApi, ApiSignal } from '@/lib/apiClient'
import StatusModal from '@/components/feed/StatusModal'
import RaiseSignalModal from '@/components/feed/RaiseSignalModal'
import InsightsModal from '@/components/feed/InsightsModal'
import DeleteConfirmModal from '@/components/feed/DeleteConfirmModal'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MySignals() {
    const router = useRouter()
    const { signals: localSignals, deleteSignal: deleteLocalSignal } = useSignalStore()
    const { user, isAuthenticated, token } = useAuthStore()
    const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false)
    const [editingSignal, setEditingSignal] = useState<any>(null)
    const [viewingInsightsSignal, setViewingInsightsSignal] = useState<any>(null)
    const [activeFilter, setActiveFilter] = useState<string | null>(null)
    const [apiSignals, setApiSignals] = useState<ApiSignal[]>([])
    const [apiSpaces, setApiSpaces] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; source: 'backend' | 'local'; type: 'SIGNAL' | 'SPACE' }>({
        isOpen: false,
        id: '',
        source: 'local',
        type: 'SIGNAL'
    })
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        if (!isAuthenticated) router.push('/auth')
    }, [isAuthenticated, router])

    const fetchMySignals = useCallback(async () => {
        if (!user?.username) return
        setLoading(true)
        const { data } = await signalsApi.getMine()
        if (data) {
            setApiSignals(data.signals || [])
            setApiSpaces((data as any).spaces || [])
        } else {
            setApiSignals([])
            setApiSpaces([])
        }
        setLoading(false)
    }, [user?.username, refreshKey])

    useEffect(() => { fetchMySignals() }, [fetchMySignals])

    const categories = ['Talent', 'Founder', 'Mentor', 'Instant Help']

    // Backend signals for this user
    const safeApiSignals = Array.isArray(apiSignals) ? apiSignals : []
    const safeApiSpaces = Array.isArray(apiSpaces) ? apiSpaces : []
    
    const backendIds = new Set(safeApiSignals.map(s => s.id))

    // Merge and map to unified display shape
    const mySignals = safeApiSignals.map(s => ({
        id: s.id,
        title: s.title,
        category: s.category,
        description: s.description,
        status: s.status === 'open' ? 'Active' : 'Closed',
        stats: { responses: s.responseCount ?? 0, offers: s.offerCount ?? 0, views: s.viewCount ?? 0 },
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        strength: s.signalStrength || '7 Days',
        source: 'backend' as const,
        type: 'SIGNAL'
    })).filter(s => {
        const { isExpired } = getSignalExpiration(s as any)
        return !isExpired && s.status === 'Active' && (activeFilter ? s.category === activeFilter : true)
    })

    const mySpaces = safeApiSpaces.map(s => ({
        id: s.id,
        title: s.title,
        category: s.spaceType || 'Space',
        description: s.description,
        status: 'Active',
        stats: { responses: 0, offers: 0, views: 0 },
        createdAt: s.createdAt,
        address: s.address,
        city: s.city,
        website: s.website,
        source: 'backend' as const,
        type: 'SPACE'
    }))

    const handleDelete = async (id: string, source: 'backend' | 'local') => {
        setDeletingId(id)
        if (source === 'backend') {
            const { error } = await signalsApi.delete(id)
            if (!error) {
                setApiSignals(prev => prev.filter(s => s.id !== id))
                setApiSpaces(prev => prev.filter(s => s.id !== id))
            } else {
                console.error('Delete error:', error)
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Delete Failed',
                    message: 'Could not delete from server: ' + error
                })
            }
        } else {
            deleteLocalSignal(id)
        }
        setDeletingId(null)
        setDeleteConfirm(prev => ({ ...prev, isOpen: false }))
    }

    if (!isAuthenticated || !user) return <div className="min-h-screen bg-background flex justify-center items-center text-text-muted">Loading...</div>

    return (
        <div className="min-h-screen bg-background flex justify-center">
            <div className="max-w-[1400px] w-full flex flex-col md:flex-row pb-16 md:pb-0">
                <Sidebar />

                <main className="flex-1 max-w-[680px] border-r border-border min-h-screen p-6">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-display">My Signals</h1>
                            <p className="text-xs text-text-secondary mt-1">Manage and track your active requests.</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setRefreshKey(k => k + 1)}
                                className="p-2 border border-border rounded-full hover:bg-surface-2 transition-all bg-surface"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button onClick={() => setIsRaiseModalOpen(true)} className="bg-primary text-background px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-90">
                                <Plus className="w-5 h-5" /> New Signal
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-8 items-center flex-wrap">
                        <button
                            onClick={() => setActiveFilter(null)}
                            className={`px-4 py-2 border rounded-md text-sm font-medium transition-all ${!activeFilter ? 'bg-primary text-background border-primary' : 'bg-surface border-border text-text-secondary hover:bg-surface-2'}`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveFilter(cat)}
                                className={`px-4 py-2 border rounded-md text-sm font-medium transition-all ${activeFilter === cat ? 'bg-primary text-background border-primary' : 'bg-surface border-border text-text-secondary hover:bg-surface-2'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-24 text-text-muted gap-3">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-sm">Loading your ecosystem contributions…</span>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Signals Section */}
                            <div>
                                <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4 px-1">
                                    Active Signals ({mySignals.length})
                                </h2>
                                {mySignals.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted bg-surface-2 rounded-2xl border border-dashed border-border">
                                        <p className="text-xs">No active signals yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {mySignals.map(signal => (
                                            <div key={signal.id} className="bg-surface border border-border p-5 rounded-xl transition-all hover:shadow-sm">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${signal.status === 'Active' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-blue/10 text-accent-blue'}`}>
                                                            {signal.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingSignal(signal as any); }}
                                                            className="p-1.5 text-text-muted hover:text-primary transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, id: signal.id, source: signal.source, type: 'SIGNAL' }); }}
                                                            disabled={deletingId === signal.id}
                                                            className="p-1.5 text-text-muted hover:text-red-500 transition-all disabled:opacity-40"
                                                            title="Delete"
                                                        >
                                                            {deletingId === signal.id
                                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                : <Trash2 className="w-4 h-4" />
                                                            }
                                                        </button>
                                                    </div>
                                                </div>
                                                <h3 className="font-medium text-lg mb-1">{signal.title}</h3>
                                                {signal.description && <p className="text-sm text-text-secondary mb-4 line-clamp-2">{signal.description}</p>}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-6">
                                                        <div>
                                                            <p className="text-[10px] text-text-muted uppercase">Responses</p>
                                                            <p className="font-mono text-sm">{signal.stats.responses}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-text-muted uppercase">Offers</p>
                                                            <p className="font-mono text-sm">{signal.stats.offers}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-text-muted uppercase">Views</p>
                                                            <p className="font-mono text-sm">{signal.stats.views}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setViewingInsightsSignal(signal)} className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                                                        View Detail <ArrowUpRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Spaces Section */}
                            <div>
                                <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4 px-1">
                                    My Ecosystem Spaces ({mySpaces.length})
                                </h2>
                                {mySpaces.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-muted bg-surface-2 rounded-2xl border border-dashed border-border">
                                        <p className="text-xs">No community spaces launched yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {mySpaces.map(space => (
                                            <div key={space.id} className="bg-surface border border-border p-5 rounded-2xl transition-all hover:shadow-sm">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-surface-2 rounded-full border border-border">
                                                        {space.category}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, id: space.id, source: space.source, type: 'SPACE' }); }}
                                                            disabled={deletingId === space.id}
                                                            className="p-1.5 text-text-muted hover:text-red-500 transition-all disabled:opacity-40"
                                                            title="Delete"
                                                        >
                                                            {deletingId === space.id
                                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                : <Trash2 className="w-4 h-4" />
                                                            }
                                                        </button>
                                                    </div>
                                                </div>
                                                <h3 className="font-medium text-xl mb-1">{space.title}</h3>
                                                {space.description && <p className="text-sm text-text-secondary mb-4 line-clamp-2">{space.description}</p>}
                                                
                                                {space.amenities && (
                                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                                        {(() => {
                                                            try {
                                                                const parsed = typeof space.amenities === 'string' ? JSON.parse(space.amenities) : space.amenities;
                                                                if (Array.isArray(parsed) && parsed.length > 0) {
                                                                    return parsed.slice(0, 3).map((am: string, i: number) => (
                                                                        <span key={i} className="text-[9px] font-bold uppercase tracking-widest text-text-secondary bg-surface px-2 py-1 rounded-md border border-border">
                                                                            {am}
                                                                        </span>
                                                                    ));
                                                                }
                                                            } catch(e) {}
                                                            return null;
                                                        })()}
                                                    </div>
                                                )}
                                                
                                                {space.address && (
                                                    <div className="flex items-center gap-2 text-xs text-text-muted mb-4 bg-surface-2 p-3 rounded-xl">
                                                        <Building className="w-4 h-4 text-primary" />
                                                        <span className="truncate">{space.address}, {space.city}</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mt-2 pt-4 border-t border-border">
                                                    <Link href={`/signals/${space.id}`} className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">
                                                        Manage Space →
                                                    </Link>
                                                    {space.website && (
                                                        <Link href={space.website} target="_blank" className="text-text-muted text-xs hover:text-text-primary">
                                                            Website
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>

                <aside className="hidden lg:block w-[320px] p-8 space-y-6">
                    <div className="bg-primary text-background p-6 rounded-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-display text-lg mb-2">Signal Insights</h3>
                            {(() => {
                                const totalSignals = mySignals.length + mySpaces.length;
                                const totalResponses = mySignals.reduce((acc, s) => acc + (s.stats.responses || 0), 0);
                                const totalOffers = mySignals.reduce((acc, s) => acc + (s.stats.offers || 0), 0);
                                
                                // Dynamic efficiency formula: (Responses + 2*Offers) normalized by signal count
                                // Base efficiency is 40% if you have signals, + engagement bonus
                                let efficiency = 0;
                                if (totalSignals > 0) {
                                    efficiency = Math.min(99, 45 + Math.round(((totalResponses + (totalOffers * 2.5)) / (totalSignals * 1.5)) * 10));
                                }
                                
                                return (
                                    <>
                                        <p className="text-background/60 text-xs mb-6">
                                            {efficiency > 80 
                                                ? `Your signals are outperforming ${efficiency - 5}% of users in Bangalore.` 
                                                : efficiency > 0 
                                                ? "Boost your ecosystem visibility to reach more mentors."
                                                : "Launch your first signal to see ecosystem performance."
                                            }
                                        </p>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs uppercase tracking-widest text-background/40">Efficiency</span>
                                                <span className="text-2xl font-mono">{efficiency}%</span>
                                            </div>
                                            <div className="w-full h-1 bg-surface/10 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-accent-green h-full transition-all duration-1000 ease-out" 
                                                    style={{ width: `${efficiency}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-surface/5 rounded-full blur-2xl" />
                    </div>

                    <div className="bg-surface border border-border border-dashed p-6 rounded-xl shadow-sm relative overflow-hidden group">
                        <div className="absolute top-3 right-3">
                            <span className="text-[8px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                                Coming Soon
                            </span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-3 opacity-50">Ad Network</p>
                        <h3 className="font-display text-lg mb-2 leading-snug">Targeted ecosystem ads</h3>
                        <p className="text-sm text-text-secondary leading-relaxed mb-5">Reach 1000s of founders, investors &amp; mentors directly in their feed.</p>
                        <button
                            disabled
                            className="w-full bg-surface-2 text-text-muted py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] cursor-not-allowed border border-border transition-all"
                        >
                            Coming Soon
                        </button>
                    </div>
                </aside>
<MobileBottomNav />
</div>
<RaiseSignalModal
                isOpen={isRaiseModalOpen || !!editingSignal}
                onClose={() => {
                    setIsRaiseModalOpen(false)
                    setEditingSignal(null)
                    setRefreshKey(k => k + 1)
                }}
                editSignal={editingSignal}
            />
            {viewingInsightsSignal && (
                <InsightsModal
                    isOpen={!!viewingInsightsSignal}
                    onClose={() => setViewingInsightsSignal(null)}
                    stats={viewingInsightsSignal.stats}
                    signalTitle={viewingInsightsSignal.title}
                />
            )}
            <DeleteConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => handleDelete(deleteConfirm.id, deleteConfirm.source)}
                isDeleting={!!deletingId}
                title={deleteConfirm.type === 'SPACE' ? "Delete Space?" : "Delete Signal?"}
                message={deleteConfirm.type === 'SPACE' 
                    ? "Are you sure you want to delete this community space? This action cannot be undone." 
                    : "Are you sure you want to delete this signal? It will be removed from everyone's discovery feed."
                }
            />
        </div>
    )
}


