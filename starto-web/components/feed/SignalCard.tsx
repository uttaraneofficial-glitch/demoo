"use client"

import { MessageSquare, Zap, UserPlus, MoreHorizontal, Edit3, Trash2, CheckCheck, BarChart2, Building, MapPin, Share2, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useSignalStore, Signal, getSignalExpiration } from '@/store/useSignalStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useNetworkStore } from '@/store/useNetworkStore'
import { useResponseStore } from '@/store/useResponseStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import RaiseSignalModal from './RaiseSignalModal'
import InsightsModal from './InsightsModal'
import HelpModal from './HelpModal'
import VerifiedAvatar from './VerifiedAvatar'
import { signalsApi, commentsApi } from '@/lib/apiClient'
import StatusModal from './StatusModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import { CommentThread, Comment } from './CommentSystem'

// ── @Mention hook — searches all known usernames in the store ────────────────
function useMentionSuggestions(text: string) {
    const { signals } = useSignalStore()
    const atIdx = text.lastIndexOf('@')
    if (atIdx === -1) return { suggestions: [], query: '', atIdx: -1 }
    const query = text.slice(atIdx + 1).toLowerCase()
    const allUsers = Array.from(new Set(signals.map(s => s.username)))
    const suggestions = query.length >= 1
        ? allUsers.filter(u => u.toLowerCase().includes(query)).slice(0, 5)
        : []
    return { suggestions, query, atIdx }
}

// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────


// Known role keywords — only these are treated as the role suffix
const ROLE_KEYWORDS = new Set(['founder', 'investor', 'mentor', 'talent', 'expert'])

// Formats username for display:
//   'sagar_g_founder'  → { handle: '@sagar_g',  role: 'Founder' }
//   'krishna_k88_founder' → { handle: '@krishna_k88', role: 'Founder' }
//   'talent' / '_talent' / any unrecognised → '@username' (plain, no badge)
// Simplified display: we now just show the full username with an @
function formatUsername(username: string): string {
    return username ? `@${username}` : '@'
}

interface SignalCardProps {
    id: string
    type?: string // SIGNAL or SPACE
    title: string
    username: string
    timeAgo: string
    category: string
    description: string
    strength: string
    stats: {
        responses: number
        offers: number
        views: number
    }
    hideViews?: boolean
    userPlan?: string
    userIsVerified?: boolean
    userId?: string
    createdAt?: number | string
    expiresAt?: string | number
    onRefresh?: () => void
    avatarUrl?: string | null
    
    // Space specific
    address?: string
    stage?: string
    city?: string
    state?: string
    website?: string
    contact?: string
    accessModel?: string
    amenities?: string
}

export default function SignalCard({ 
    id, type = 'SIGNAL', title, username, timeAgo, category, description, strength, stats, 
    hideViews = false, userPlan = 'free', userIsVerified, userId, createdAt, expiresAt, onRefresh, avatarUrl,
    address, stage, city, state, website, contact, accessModel, amenities
}: SignalCardProps) {
    const { user, token } = useAuthStore()
    const currentUser = user?.username
    const isOwner = user?.id === userId || currentUser === username
    const { deleteSignal, signals, setComments } = useSignalStore()
    const { connections, sentRequests, pendingRequests, sendRequest } = useNetworkStore()
    const { addResponse, hasResponded } = useResponseStore()
    const isOnline = useOnlineStatus()
    
    const [showDropdown, setShowDropdown] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false)
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [showInsights, setShowInsights] = useState(false)
    const [statusModal, setStatusModal] = useState<{isOpen: boolean, type: 'upgrade' | 'duplicate' | 'error', title: string, message: string}>({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    })
    
    const [localStats, setLocalStats] = useState(stats || { responses: 0, offers: 0, views: 0 })

    useEffect(() => {
        setLocalStats(stats)
    }, [stats])

    const closeStatusModal = () => setStatusModal(prev => ({ ...prev, isOpen: false }))
    const [showComments, setShowComments] = useState(false)
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [commentText, setCommentText] = useState('')
    const [addedToNetwork, setAddedToNetwork] = useState(false)
    const [justResponded, setJustResponded] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [visibleCount, setVisibleCount] = useState(1)
    const [localComments, setLocalComments] = useState<Comment[]>([])
    const dropdownRef = useRef<HTMLDivElement>(null)

    const safeConnections = Array.isArray(connections) ? connections : []
    const safeSent = Array.isArray(sentRequests) ? sentRequests : []
    const safePending = Array.isArray(pendingRequests) ? pendingRequests : []

    const alreadyConnected = safeConnections.some(c => c.requesterUsername === username || c.receiverUsername === username)
    const alreadyPending = safeSent.some(r => (r.requesterUsername === username || r.receiverUsername === username) && (r.status === 'PENDING' || r.status === 'pending'))
    const alreadyResponded = hasResponded(id)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [])

    const fetchCurrentComments = async () => {
        if (showComments) {
            setIsLoadingComments(true);
            const { data, error } = await commentsApi.getForSignal(id);
            if (!error && data) {
                const mapRecursive = (c: any): Comment => ({
                    id: c.id,
                    username: c.username,
                    userId: c.userId,
                    text: c.content,
                    timestamp: new Date(c.createdAt).getTime(),
                    avatarUrl: c.avatarUrl,
                    replies: (c.replies || []).map(mapRecursive)
                });
                const mappedComments: Comment[] = data.map(mapRecursive);
                setLocalComments(mappedComments);
                setComments(id, mappedComments);
                setLocalStats(prev => ({ ...prev, responses: data.length }));
            }
            setIsLoadingComments(false);
        }
    };

    useEffect(() => {
        fetchCurrentComments();
    }, [showComments, id]);

    const storeSignal = signals.find(s => s.id === id)
    
    // Fallback object so modals can open even for backend-only signals not in local store
    const currentSignal: Signal = {
        ...(storeSignal || {
            id,
            title,
            username,
            timeAgo,
            category,
            description,
            strength,
            status: 'Active',
            stats: stats || { responses: 0, offers: 0, views: 0 },
            userPlan,
            userId: userId || storeSignal?.userId,
            createdAt: typeof createdAt === 'string' ? new Date(createdAt).getTime() : createdAt,
            expiresAt: expiresAt
        } as Signal),
        comments: (storeSignal?.comments && storeSignal.comments.length > 0) ? storeSignal.comments : localComments
    }

    // Days left calculation using helper
    const { isExpired, daysLeft, hoursLeft, totalDuration, progressPercent } = getSignalExpiration(currentSignal || { strength, createdAt } as any);
    
    const strengthColor: Record<string, string> = {
        Normal: 'bg-accent-blue',
        High: 'bg-accent-yellow',
        Critical: 'bg-accent-red',
        Low: 'bg-text-muted'
    }
    const colorClass = strengthColor[strength] || 'bg-text-muted'
    
    // Social Proof: Show if a connection has responded, or the user themselves
    const connectionRespondent = currentSignal?.comments?.find(c => 
        safeConnections.some(conn => conn.username === c.username)
    )?.username;

    const respondentToShow = connectionRespondent || (currentSignal?.comments?.some(c => c.username === currentUser) ? currentUser : null);

    let cleanDescription = description || '';
    let mediaUrl = '';
    const mediaMatch = cleanDescription.match(/\[\[MEDIA:(.*?)\]\]/);
    if (mediaMatch) {
        mediaUrl = mediaMatch[1];
        cleanDescription = cleanDescription.replace(mediaMatch[0], '').trim();
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border p-5 rounded-xl mb-4 hover:border-text-muted transition-all group"
        >
            <div className="flex justify-between items-start mb-4 gap-2">
                <Link href={`/profile/${userId || username}`} className="flex flex-1 items-center gap-3 group/profile hover:opacity-80 transition-opacity min-w-0">
                    <VerifiedAvatar
                        username={username}
                        avatarUrl={avatarUrl}
                        plan={userPlan}
                        isVerified={userIsVerified}
                        size="w-10 h-10"
                        badgeSize="w-4 h-4"
                        className="shrink-0"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                            <span className="text-sm font-bold truncate hover:underline cursor-pointer min-w-0 block">{username}</span>
                            {type === 'SPACE' && <Building className="w-3.5 h-3.5 text-primary" />}
                            <span className="text-text-muted text-xs shrink-0">•</span>
                            <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest shrink-0">{timeAgo}</span>
                        </div>
                        {address && (
                            <div className="flex items-center gap-1 mt-0.5 opacity-60">
                                <MapPin className="w-2.5 h-2.5" />
                                <span className="text-[10px] font-medium truncate max-w-[150px]">{address}{city ? `, ${city}` : ''}</span>
                            </div>
                        )}
                    </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-primary text-background`}>
                        {type === 'SPACE' ? (strength || 'Space') : category}
                    </span>
                    {stage && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-surface-2 border border-border text-text-secondary">
                            {stage}
                        </span>
                    )}
                    {isOwner ? (
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }} 
                                className={`text-text-muted hover:text-primary p-1 rounded-md transition-all ${showDropdown ? 'bg-surface-2 text-primary' : 'hover:bg-surface-2'}`}
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                            <AnimatePresence>
                                {showDropdown && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-lg z-20 py-1 flex flex-col overflow-hidden"
                                    >
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIsInsightsModalOpen(true); setShowDropdown(false); }}
                                            className="px-4 py-2.5 text-sm text-left hover:bg-surface-2 transition-colors w-full flex items-center gap-2 text-text-secondary hover:text-text-primary font-medium"
                                        >
                                            <BarChart2 className="w-4 h-4" /> Insights
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); setShowDropdown(false); }}
                                            className="px-4 py-2.5 text-sm text-left hover:bg-surface-2 transition-colors w-full flex items-center gap-2 text-text-secondary hover:text-text-primary font-medium"
                                        >
                                            <Edit3 className="w-4 h-4" /> Modify Signal
                                        </button>
                                        <button 
                                            disabled={isDeleting}
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                setIsDeleteConfirmOpen(true);
                                                setShowDropdown(false);
                                            }}
                                            className="px-4 py-2.5 text-sm text-left hover:bg-surface-2 transition-colors w-full flex items-center gap-2 text-text-secondary hover:text-text-primary font-medium disabled:opacity-50"
                                        >
                                            <Trash2 className="w-4 h-4" /> {isDeleting ? 'Deleting...' : 'Delete Signal'}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <button className="text-text-muted hover:text-primary p-1 rounded-md hover:bg-surface-2 transition-all">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <Link href={`/signals/${id}`} className="block group/link cursor-pointer">
                <h3 className="text-lg font-medium mb-2 break-words group-hover/link:text-primary group-hover/link:underline transition-colors">{title}</h3>
                <p className="text-text-secondary text-sm mb-4 line-clamp-2 break-words whitespace-pre-wrap">{cleanDescription}</p>
            </Link>

            {mediaUrl && (
                <div className="mb-4 rounded-lg overflow-hidden border border-border bg-surface-2 relative">
                    {mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be') ? (
                        <iframe 
                            src={mediaUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/').split('&')[0]} 
                            className="w-full aspect-video" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        />
                    ) : mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) || mediaUrl.includes('imgur.com') ? (
                        <img src={mediaUrl.includes('imgur.com') && !mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? mediaUrl + '.png' : mediaUrl} alt="Attached Media" className="w-full h-auto object-cover max-h-96" loading="lazy" />
                    ) : (
                        <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-primary/5 transition-colors text-primary text-sm font-medium flex items-center justify-center gap-2">
                            <ExternalLink className="w-4 h-4" /> View Attached Media
                        </a>
                    )}
                </div>
            )}

            {website && (
                <div className="mb-4">
                    <a 
                        href={website.startsWith('http') ? website : `https://${website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Project Website
                    </a>
                </div>
            )}

            {type !== 'SPACE' ? (
                <>
                    <div className="flex items-center gap-6 mb-5">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted uppercase">Responses</span>
                            <span className="font-mono text-sm">{localStats.responses}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted uppercase">Offers</span>
                            <span className="font-mono text-sm">{stats.offers}</span>
                        </div>
                        {!hideViews && (
                            <div className="flex flex-col">
                                <span className="text-[10px] text-text-muted uppercase">Views</span>
                                <span className="font-mono text-sm">{stats.views}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Urgency Progress Bar */}
                    <div className="mb-5 relative">
                        <div className="w-full h-1.5 bg-surface-2 overflow-hidden mb-1 flex">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                                className={`h-full rounded-r-md transition-colors ${
                                    daysLeft <= 1 ? "bg-red-500" :
                                    daysLeft >= totalDuration - 2 ? "bg-primary" :
                                    "bg-gradient-to-r from-yellow-400 to-orange-500"
                                }`}
                            />
                        </div>
                        <div className={`text-[10px] uppercase tracking-widest font-bold float-right ${
                            daysLeft <= 1 ? "text-red-500" :
                            daysLeft >= totalDuration - 2 ? "text-primary" :
                            "text-orange-500"
                        }`}>
                            {daysLeft > 0 ? `${daysLeft} Days Left` : `${hoursLeft} Hours Left`}
                        </div>
                        <div className="clear-both" />
                    </div>
                </>
            ) : (
                <div className="mb-5 mt-2 space-y-3">
                    {/* Space Specific Details */}
                    {accessModel && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Access:</span>
                            <span className="text-[10px] font-bold text-text-primary px-2 py-1 bg-surface-2 rounded-full border border-border">
                                {accessModel}
                            </span>
                        </div>
                    )}
                    {amenities && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {(() => {
                                try {
                                    const parsed = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
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
                </div>
            )}

            {/* Social Proof Line */}
            {respondentToShow && (
                <div className="mb-4 flex items-center gap-2">
                    <div className="flex -space-x-2">
                        <VerifiedAvatar
                            username={respondentToShow}
                            avatarUrl={currentSignal.comments?.find(c => c.username === respondentToShow)?.avatarUrl}
                            size="w-5 h-5"
                            badgeSize="w-2 h-2"
                        />
                    </div>
                    <p className="text-[11px] text-text-secondary">
                        Responded by <span className="font-bold text-text-primary border-b border-border">{respondentToShow === currentUser ? 'you' : `@${respondentToShow}`}</span>
                        {localStats.responses > 1 && ` and ${localStats.responses - 1} others`}
                    </p>
                </div>
            )}

            {/* Actions */}

            <div className="flex gap-2">
                {(!isOwner && type !== 'SPACE') && (
                    <button onClick={() => setIsHelpModalOpen(true)} className="flex-1 bg-primary text-background py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                        <Zap className="w-4 h-4 fill-current" /> Help
                    </button>
                )}
                {type === 'SPACE' ? (
                    <Link
                        href={`/signals/${id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-primary text-background py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90"
                    >
                        View Space Details
                    </Link>
                ) : (
                    <button
                        disabled={!isOnline}
                        onClick={() => setShowComments(!showComments)}
                        className={`flex-1 border py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                            showComments
                                ? 'border-primary bg-primary text-background'
                                : 'border-border hover:bg-surface-2'
                        } disabled:opacity-50`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Respond
                    </button>
                )}
                <button
                    onClick={() => {
                        const url = `${window.location.origin}/signals/${id}`;
                        navigator.clipboard.writeText(url);
                        setStatusModal({
                            isOpen: true,
                            type: 'upgrade', // Use upgrade as a 'success' style here
                            title: 'Link Copied',
                            message: 'Signal link copied to clipboard! Share it with your network.'
                        });
                    }}
                    className="flex-none aspect-square border border-border hover:bg-surface-2 p-2.5 rounded-md transition-all flex items-center justify-center"
                    title="Share Signal"
                >
                    <Share2 className="w-4 h-4" />
                </button>
                {!isOwner && (
                    <button
                        onClick={async () => {
                            if (!isOwner && !alreadyConnected && !alreadyPending && !addedToNetwork) {
                                try {
                                    await sendRequest(type === 'SPACE' ? null : id, 'I want to connect!', userId || currentSignal?.userId || '', type === 'SPACE' ? id : null);
                                    setAddedToNetwork(true);
                                } catch (err: any) {
                                    if (err.message === 'Request already exists' || err.message?.includes('already connected')) {
                                        setAddedToNetwork(true);
                                        setStatusModal({
                                            isOpen: true,
                                            type: 'duplicate',
                                            title: 'Already Connected',
                                            message: 'You are already connected or have a pending request with this person.'
                                        })
                                    } else {
                                        setStatusModal({
                                            isOpen: true,
                                            type: 'error',
                                            title: 'Request Failed',
                                            message: err.message || 'Something went wrong while sending your request.'
                                        })
                                    }
                                }
                            } else if (alreadyPending || addedToNetwork) {
                                setStatusModal({
                                    isOpen: true,
                                    type: 'duplicate',
                                    title: 'Request Pending',
                                    message: 'A connection request is already pending with this person.'
                                })
                            } else if (alreadyConnected) {
                                setStatusModal({
                                    isOpen: true,
                                    type: 'duplicate',
                                    title: 'Already Connected',
                                    message: 'You are already connected with this person.'
                                })
                            }
                        }}
                        disabled={alreadyConnected || alreadyPending || addedToNetwork || !isOnline}
                        className={`px-3 border rounded-md transition-all duration-300 ${
                            alreadyConnected
                                ? 'bg-primary text-background'
                                : alreadyPending || addedToNetwork
                                    ? 'bg-primary text-background shadow-md'
                                    : 'border-border hover:bg-surface-2'
                        } disabled:opacity-50`}
                        title={!isOnline ? "Network unavailable" : alreadyConnected ? 'Connected' : alreadyPending ? 'Request sent — pending' : 'Send connection request'}
                    >
                        {alreadyConnected ? (
                            <CheckCheck className="w-4 h-4" />
                        ) : alreadyPending || addedToNetwork ? (
                            <motion.div 
                                initial={{ scale: 0.5, opacity: 0 }} 
                                animate={{ scale: [0.8, 1.2, 1], rotate: [0, -10, 10, -10, 0], opacity: 1 }} 
                                transition={{ type: "tween", duration: 0.4 }}
                            >
                                <CheckCheck className="w-4 h-4" />
                            </motion.div>
                        ) : (
                            <UserPlus className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>
            
            {/* Instagram Style Threaded Comments Section */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-border overflow-hidden"
                    >
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                            {(currentSignal?.comments || []).length === 0 ? (
                                <p className="text-center text-xs text-text-muted py-4">No responses yet. Be the first to respond!</p>
                            ) : (
                                <>
                                    {(currentSignal?.comments || []).slice(0, visibleCount).map(comment => (
                                        <CommentThread
                                            key={comment.id}
                                            comment={comment}
                                            signalId={id}
                                            currentUser={currentUser}
                                            currentUserId={user?.id}
                                            isSignalOwner={isOwner}
                                            onReplySuccess={fetchCurrentComments}
                                            onDeleteSuccess={(deletedId) => {
                                                const removeRecursive = (list: Comment[]): Comment[] => {
                                                    return list.filter(c => c.id !== deletedId).map(c => ({
                                                        ...c,
                                                        replies: removeRecursive(c.replies)
                                                    }));
                                                };
                                                setLocalComments(prev => removeRecursive(prev));
                                                setLocalStats(prev => ({ ...prev, responses: Math.max(0, prev.responses - 1) }));
                                            }}
                                        />
                                    ))}
                                    
                                    {currentSignal?.comments && currentSignal.comments.length > visibleCount && (
                                        <button 
                                            onClick={() => setVisibleCount(prev => prev + 5)}
                                            className="text-[10px] font-bold text-primary hover:underline py-2 w-full text-center uppercase tracking-widest"
                                        >
                                            View more responses ({currentSignal.comments.length - visibleCount} left)
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Instagram Style Emojis */}
                        <div className="mt-3 flex gap-4 px-1 py-1 overflow-x-auto no-scrollbar">
                            {['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'].map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => setCommentText(prev => prev + emoji)}
                                    className="text-xl hover:scale-125 transition-transform"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>

                        {/* Main Comment Input */}
                        <div className="mt-4 flex gap-2 items-center border-t border-border pt-3">
                            <VerifiedAvatar
                                username={user?.name || user?.username || 'U'}
                                avatarUrl={user?.avatarUrl}
                                size="w-8 h-8"
                                badgeSize="w-3 h-3"
                            />
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-text-muted ml-2"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && commentText.trim()) {
                                        const text = commentText.trim();
                                        setCommentText('');
                                        const { data, error } = await commentsApi.post(id, text);
                                        if (!error && data) {
                                            const newComment: Comment = {
                                                id: data.id,
                                                username: data.username,
                                                userId: data.userId,
                                                text: data.content,
                                                timestamp: new Date(data.createdAt).getTime(),
                                                avatarUrl: data.avatarUrl || user?.avatarUrl,
                                                replies: []
                                            };
                                            setLocalComments(prev => [newComment, ...prev]);
                                            setLocalStats(prev => ({ ...prev, responses: prev.responses + 1 }));
                                        } else {
                                            setStatusModal({
                                                isOpen: true,
                                                type: 'error',
                                                title: 'Comment Failed',
                                                message: error || 'Failed to post comment'
                                            });
                                        }
                                        
                                        if (!alreadyResponded && !isOwner) {
                                            addResponse({ signalId: id, signalTitle: title, signalUsername: username, signalCategory: category })
                                        }
                                    }
                                }}
                            />
                            <button 
                                disabled={!commentText.trim() || !isOnline}
                                title={!isOnline ? "Network unavailable" : "Post response"}
                                onClick={async () => {
                                    if (commentText.trim()) {
                                        const text = commentText.trim();
                                        setCommentText('');
                                        const { data, error } = await commentsApi.post(id, text);
                                        if (!error && data) {
                                            const newComment: Comment = {
                                                id: data.id,
                                                username: data.username,
                                                userId: data.userId,
                                                text: data.content,
                                                timestamp: new Date(data.createdAt).getTime(),
                                                avatarUrl: data.avatarUrl || user?.avatarUrl,
                                                replies: []
                                            };
                                            setLocalComments(prev => [newComment, ...prev]);
                                            setLocalStats(prev => ({ ...prev, responses: prev.responses + 1 }));
                                        } else {
                                            setStatusModal({
                                                isOpen: true,
                                                type: 'error',
                                                title: 'Comment Failed',
                                                message: error || 'Failed to post comment'
                                            });
                                        }
                                        
                                        if (!alreadyResponded && !isOwner) {
                                            addResponse({ signalId: id, signalTitle: title, signalUsername: username, signalCategory: category })
                                        }
                                    }
                                }}
                                className="text-primary font-bold text-sm disabled:opacity-50 transition-opacity"
                            >
                                Post
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {currentSignal && (
                <RaiseSignalModal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    editSignal={currentSignal} 
                />
            )}
            {currentSignal && (
                <InsightsModal 
                    isOpen={isInsightsModalOpen} 
                    onClose={() => setIsInsightsModalOpen(false)} 
                    stats={stats}
                    signalTitle={title}
                    hideOffers={type === 'SPACE'}
                />
            )}
            <HelpModal 
                isOpen={isHelpModalOpen} 
                onClose={() => setIsHelpModalOpen(false)} 
                signalId={id} 
                signalTitle={title} 
            />
            <StatusModal 
                isOpen={statusModal.isOpen} 
                onClose={closeStatusModal}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                isDeleting={isDeleting}
                title={type === 'SPACE' ? "Delete Space?" : "Delete Signal?"}
                message={type === 'SPACE' 
                    ? "This will permanently remove this collaboration space and all its data from the ecosystem."
                    : "This action is permanent and will remove all responses and data associated with this signal."
                }
                onConfirm={async () => {
                    setIsDeleting(true);
                    const { error } = await signalsApi.delete(id);
                    if (!error) {
                        deleteSignal(id);
                        if (onRefresh) onRefresh();
                        setIsDeleteConfirmOpen(false);
                    } else {
                        setStatusModal({
                            isOpen: true,
                            type: 'error',
                            title: 'Delete Failed',
                            message: error || 'Failed to delete signal'
                        })
                        setIsDeleteConfirmOpen(false);
                    }
                    setIsDeleting(false);
                }}
            />
        </motion.div>
    )
}



