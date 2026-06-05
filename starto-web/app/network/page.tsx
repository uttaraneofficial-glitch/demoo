"use client"

import Sidebar from '@/components/feed/Sidebar'
import MobileNavigation from '@/components/feed/MobileNavigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNetworkStore } from '@/store/useNetworkStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useRatingStore } from '@/store/useRatingStore'
import { Check, X, Users, UserCheck, MessageSquare, Zap, Link as LinkIcon, UserPlus, CheckCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import VerifiedAvatar from '@/components/feed/VerifiedAvatar'
import StatusModal from '@/components/feed/StatusModal'
import { connectionsApi } from '@/lib/apiClient'

export default function NetworkPage() {
    const router = useRouter()
    const { user, token, isAuthenticated } = useAuthStore()
    const { connections, pendingRequests, sentRequests, offers, sendRequest, acceptRequest, rejectRequest, fetchRequests, fetchOffers, acceptOffer, rejectOffer, deleteOffer } = useNetworkStore()
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean, 
        type: 'upgrade' | 'duplicate' | 'error' | 'confirm', 
        title: string, 
        message: string,
        onConfirm?: () => void
    }>({
        isOpen: false,
        type: 'error',
        title: '',
        message: '',
        onConfirm: undefined
    })
    const closeStatusModal = () => setStatusModal(prev => ({ ...prev, isOpen: false }))
    
    const handleWhatsappClick = async (connectionId: string) => {
        try {
            const { data, error } = await connectionsApi.getWhatsappLink(connectionId);
            if (data?.whatsappUrl) {
                window.open(data.whatsappUrl, '_blank');
            } else if (error) {
                setStatusModal({
                    isOpen: true,
                    type: 'upgrade',
                    title: 'Upgrade Required',
                    message: error || 'Upgrade your plan to unlock WhatsApp contact'
                });
            }
        } catch (err: any) {
            setStatusModal({
                isOpen: true,
                type: 'upgrade',
                title: 'Upgrade Required',
                message: err.message || 'Upgrade your plan to unlock WhatsApp contact'
            });
        }
    };

    // const { getAverageRating } = useRatingStore() // Removed to fix crash after API migration
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const [tab, setTab] = useState<'connections' | 'requests' | 'offers'>('connections')
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (isAuthenticated) {
            fetchRequests();
            fetchOffers();
        }
    }, [isAuthenticated, fetchRequests, fetchOffers]);

    useEffect(() => {
        const t = searchParams?.get('tab');
        if (t === 'offers' || t === 'requests' || t === 'connections') {
            setTab(t);
        }
    }, [searchParams]);

    const connectionsArray = Array.isArray(connections) ? connections : []
    const pendingArray = Array.isArray(pendingRequests) ? pendingRequests : []
    const sentArray = Array.isArray(sentRequests) ? sentRequests : []
    const offersArray = (Array.isArray(offers) ? offers : []).filter(o => o.status !== 'REJECTED')

    const filteredConnections = connectionsArray.filter(c => {
        const isRequester = c.requesterUsername === user?.username;
        const otherUsername = isRequester ? c.receiverUsername : c.requesterUsername;
        const otherName = isRequester ? c.receiverName : c.requesterName;
        
        if (!otherUsername && !otherName) return true; // Show if data is incomplete instead of hiding
        
        return (otherUsername?.toLowerCase().includes(search.toLowerCase()) || 
                otherName?.toLowerCase().includes(search.toLowerCase()));
    })

    return (
        <div className="min-h-screen bg-background flex justify-center">
            <div className="max-w-[1400px] w-full flex flex-col md:flex-row pb-16 md:pb-0">
                <MobileNavigation title="My Network" />
                <Sidebar />

                <main className="flex-1 w-full max-w-[680px] md:border-r border-border min-h-screen">
                    {/* Header */}
                    <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-10 px-6 py-4">
                        <h1 className="font-display text-2xl mb-3">My Network</h1>
                        <div className="flex gap-4 sm:gap-6 border-b border-border -mx-6 px-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
                            <button
                                onClick={() => setTab('connections')}
                                className={`pb-3 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${tab === 'connections' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-primary'}`}
                            >
                                Connections ({connectionsArray.length})
                            </button>
                            <button
                                onClick={() => setTab('requests')}
                                className={`pb-3 font-bold text-xs uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${tab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-primary'}`}
                            >
                                Requests ({pendingArray.length})
                            </button>
                            <button
                                onClick={() => setTab('offers')}
                                className={`pb-3 font-bold text-xs uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${tab === 'offers' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-primary'}`}
                            >
                                Offers ({offersArray.length})
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* ── CONNECTIONS TAB ── */}
                        {tab === 'connections' && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Search connections..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary mb-6 text-text-primary"
                                />

                                {filteredConnections.length === 0 ? (
                                    <div className="flex flex-col items-center py-20 text-text-muted">
                                        <Users className="w-10 h-10 mb-3 opacity-30" />
                                        <p className="text-sm font-medium">No connections yet</p>
                                        <p className="text-xs mt-1">Accept requests from the Requests tab to grow your network</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <AnimatePresence>
                                            {filteredConnections.map(c => {
                                                const isRequester = c.requesterUsername === user?.username;
                                                const otherUser = isRequester ? 
                                                    { username: c.receiverUsername, name: c.receiverName, role: c.receiverRole, avatar: c.receiverAvatarUrl } : 
                                                    { username: c.requesterUsername, name: c.requesterName, role: c.requesterRole, avatar: c.requesterAvatarUrl };
                                                // const rating = getAverageRating(otherUser.username)
                                                 const rating = 0 // Rating display disabled in list for performance
                                                
                                                return (
                                                    <motion.div
                                                        key={c.id}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        className="flex items-center gap-4 p-4 bg-surface border border-border rounded-2xl hover:border-primary transition-all shadow-sm"
                                                    >
                                                        <Link href={`/profile/${otherUser.username}`}>
                                                            <VerifiedAvatar
                                                                username={otherUser.username}
                                                                avatarUrl={otherUser.avatar}
                                                                size="w-12 h-12"
                                                                badgeSize="w-4 h-4"
                                                            />
                                                        </Link>
                                                        <div className="flex-1 min-w-0">
                                                            <Link href={`/profile/${otherUser.username}`} className="font-medium text-sm hover:text-primary transition-colors">
                                                                {otherUser.name} <span className="text-text-muted text-xs font-normal">(@{otherUser.username})</span>
                                                            </Link>
                                                            <p className="text-[10px] text-text-muted uppercase font-bold">{otherUser.role}</p>
                                                            {rating > 0 && (
                                                                <p className="text-[10px] text-yellow-500 font-bold">★ {rating.toFixed(1)}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleWhatsappClick(c.id)}
                                                                title="Connect on WhatsApp"
                                                                className="p-2 rounded-lg border border-border hover:bg-surface-2 hover:border-primary hover:text-primary transition-all text-text-muted"
                                                            >
                                                                <Zap className="w-4 h-4 fill-current" />
                                                            </button>
                                                             <button
                                                                onClick={() => {
                                                                    setStatusModal({
                                                                        isOpen: true,
                                                                        type: 'confirm',
                                                                        title: 'Remove Connection?',
                                                                        message: `Are you sure you want to remove your connection with ${otherUser.name}? You will need to send a new request to reconnect.`,
                                                                        onConfirm: () => rejectRequest(c.id)
                                                                    })
                                                                }}
                                                                title="Remove connection"
                                                                className="p-2 rounded-lg border border-border hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-all text-text-muted"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── REQUESTS TAB ── */}
                        {tab === 'requests' && (
                            pendingArray.length === 0 ? (
                                <div className="flex flex-col items-center py-20 text-text-muted">
                                    <UserCheck className="w-10 h-10 mb-3 opacity-30" />
                                    <p className="text-sm font-medium">No pending requests</p>
                                    <p className="text-xs mt-1">Click the + icon on someone's signal card to send a request</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-text-muted mb-4">Accept a request to connect and enable chat.</p>
                                    <AnimatePresence>
                                        {pendingRequests.map(r => (
                                            <motion.div
                                                key={r.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="flex items-center gap-4 p-4 bg-surface border border-border rounded-2xl"
                                            >
                                                <Link href={`/profile/${r.requesterUsername}`}>
                                                    <VerifiedAvatar
                                                        username={r.requesterUsername}
                                                        avatarUrl={r.requesterAvatarUrl}
                                                        size="w-12 h-12"
                                                        badgeSize="w-4 h-4"
                                                    />
                                                </Link>
                                                <div className="flex-1 min-w-0">
                                                    <Link href={`/profile/${r.requesterUsername}`} className="font-medium text-sm hover:text-primary">
                                                        {r.requesterName} <span className="text-text-muted text-xs font-normal">(@{r.requesterUsername})</span>
                                                    </Link>
                                                    <p className="text-[10px] text-text-muted uppercase font-bold">{r.requesterRole}</p>
                                                    <p className="text-[10px] text-yellow-600 font-bold mt-0.5">⏳ Pending</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {/* Accept */}
                                                    <button
                                                        onClick={() => acceptRequest(r.id)}
                                                        title="Accept connection"
                                                        className="p-2.5 rounded-xl bg-primary text-background hover:opacity-90 transition-all active:scale-95 shadow-sm"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    {/* Reject */}
                                                    <button
                                                        onClick={() => rejectRequest(r.id)}
                                                        title="Reject request"
                                                        className="p-2.5 rounded-xl border border-border bg-surface-2 text-text-muted hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all active:scale-95"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )
                        )}

                        {/* ── OFFERS TAB ── */}
                        {tab === 'offers' && (
                            offersArray.length === 0 ? (
                                <div className="flex flex-col items-center py-20 text-text-muted">
                                    <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mb-3">
                                        <Zap className="w-6 h-6 text-yellow-500" />
                                    </div>
                                    <p className="text-sm font-medium">No offers yet</p>
                                    <p className="text-xs mt-1">Offers received on your signals will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-text-muted mb-4">People who have generously offered to help with your signals.</p>
                                    <AnimatePresence>
                                        {offersArray.map(o => (
                                            <motion.div
                                                key={o.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="flex flex-col gap-3 p-5 bg-surface border border-border rounded-2xl hover:border-text-muted transition-all shadow-sm group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <Link href={`/profile/${o.requesterUsername}`}>
                                                            <VerifiedAvatar
                                                                username={o.requesterUsername}
                                                                avatarUrl={o.requesterAvatarUrl}
                                                                size="w-10 h-10"
                                                                badgeSize="w-3.5 h-3.5"
                                                            />
                                                        </Link>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <Link href={`/profile/${o.requesterUsername || '#'}`} className="font-medium text-sm hover:text-primary transition-colors hover:underline">
                                                                    {o.requesterName} <span className="text-text-muted text-xs font-normal">(@{o.requesterUsername || 'unknown'})</span>
                                                                </Link>
                                                            </div>
                                                            {o.signalTitle && (
                                                                <Link href={`/signals/${o.signalId}`} className="text-[10px] text-primary hover:underline font-bold uppercase tracking-tight block mt-0.5">
                                                                    Re: {o.signalTitle}
                                                                </Link>
                                                            )}
                                                            <p className="text-[10px] text-text-muted mt-0.5">{new Date(o.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {/* Connect icon or Status */}
                                                                {o.status === 'ACCEPTED' ? (
                                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-text-primary bg-surface-2 px-2 py-0.5 rounded-full uppercase tracking-widest border border-border">
                                                                        <CheckCheck className="w-3 h-3" /> Connected
                                                                    </span>
                                                                ) : connectionsArray.some(c => c.requesterUsername === o.requesterUsername || c.receiverUsername === o.requesterUsername) ? (
                                                                    <span title="Already connected" className="text-green-500"><CheckCheck className="w-4 h-4" /></span>
                                                                ) : sentArray.some(r => r.receiverUsername === o.requesterUsername && r.status === 'pending') ? (
                                                                    <span title="Request sent" className="text-yellow-500"><CheckCheck className="w-4 h-4" /></span>
                                                                ) : (
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={async () => {
                                                                                try {
                                                                                    await acceptOffer(o.id);
                                                                                } catch (err: any) {
                                                                                    setStatusModal({
                                                                                        isOpen: true,
                                                                                        type: 'error',
                                                                                        title: 'Action Failed',
                                                                                        message: err.message || 'Failed to accept offer'
                                                                                    });
                                                                                }
                                                                            }}
                                                                            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-primary text-background rounded-lg hover:opacity-90 transition-all"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                        <button
                                                                            onClick={() => rejectOffer(o.id)}
                                                                            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-surface-2 text-text-muted border border-border rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                        </div>
                                                    </div>
                                                    
                                                    {/* Action Icons */}
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                         {o.status === 'ACCEPTED' && (
                                                             <button 
                                                                 onClick={() => handleWhatsappClick(o.id)}
                                                                 className="p-1.5 bg-primary text-background rounded-lg hover:opacity-90 transition-all border border-border"
                                                                 title="Chat on WhatsApp"
                                                               >
                                                                 <Zap className="w-4 h-4" />
                                                             </button>
                                                         )}
                                                        <button onClick={() => deleteOffer(o.id)} className="text-text-muted hover:text-red-500 p-1.5 rounded-lg transition-colors bg-surface-2 border border-border/50">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="pt-3 border-t border-border mt-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Portfolio/Project Link</p>
                                                    {o.portfolioLink ? (
                                                        <a 
                                                            href={o.portfolioLink.startsWith('http') ? o.portfolioLink : `https://${o.portfolioLink}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-sm text-primary hover:underline flex items-center gap-1.5 font-medium bg-surface-2 hover:bg-surface-2 transition-colors py-2 px-3 rounded-lg border border-border/50 inline-flex max-w-full"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <LinkIcon className="w-3.5 h-3.5" />
                                                            <span className="truncate">{o.portfolioLink}</span>
                                                        </a>
                                                    ) : (
                                                        <p className="text-xs text-text-muted italic">No link provided</p>
                                                    )}
                                                    <p className="text-xs text-text-secondary mt-3 leading-relaxed italic">"{o.message}"</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )
                        )}
                    </div>
                </main>

                {/* Right sidebar */}
                <aside className="hidden xl:block w-[320px] p-8">
                    <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm mb-6">
                        <h3 className="font-display text-lg mb-4">Network Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-text-secondary">Connections</span>
                                <span className="font-mono font-bold">{(connections || []).length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-text-secondary">Pending Requests</span>
                                <span className="font-mono font-bold">{(pendingRequests || []).length}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-border">
                                <span className="text-sm text-text-secondary">Help Offers Received</span>
                                <span className="font-mono font-bold">{offersArray.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Sponsored Card */}
                    <div className="bg-surface border border-border border-dashed p-6 rounded-2xl shadow-sm relative overflow-hidden group">
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
                
            </div>
            <StatusModal 
                isOpen={statusModal.isOpen} 
                onClose={closeStatusModal}
                onConfirm={statusModal.onConfirm}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
                confirmText="Yes, Remove"
                cancelText="Keep Connection"
            />
        </div>
    )
}

