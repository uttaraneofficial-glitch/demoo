"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
    ArrowLeft, 
    Zap, 
    MessageSquare, 
    Clock, 
    Eye, 
    UserPlus, 
    Share2, 
    MapPin, 
    CheckCheck,
    Loader2,
    Calendar,
    ChevronRight,
    Search,
    Building
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/feed/Sidebar'
import MobileNavigation from '@/components/feed/MobileNavigation'
import VerifiedAvatar from '@/components/feed/VerifiedAvatar'
import { signalsApi, ApiSignal, usersApi, ApiUser, commentsApi, ApiComment } from '@/lib/apiClient'
import { useAuthStore } from '@/store/useAuthStore'
import { useSignalStore, getSignalExpiration } from '@/store/useSignalStore'
import { useNetworkStore } from '@/store/useNetworkStore'
import { useResponseStore } from '@/store/useResponseStore'
import { CommentThread, Comment } from '@/components/feed/CommentSystem'
import Toast from '@/components/feed/Toast'
import StatusModal from '@/components/feed/StatusModal'

// Reuse the map function to convert ApiSignal to card-like shape if needed, 
// but here we want the raw data for maximum detail.

export default function SignalDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { user: currentUser } = useAuthStore()
    const { signals: localSignals, addComment, addReply } = useSignalStore()
    const { connections, sentRequests, pendingRequests, sendRequest, fetchRequests } = useNetworkStore()
    const { addResponse, hasResponded } = useResponseStore()

    const [signal, setSignal] = useState<ApiSignal | null>(null)
    const [owner, setOwner] = useState<ApiUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [commentText, setCommentText] = useState('')
    const [replyToId, setReplyToId] = useState<string | null>(null)
    const [replyText, setReplyText] = useState('')
    const [comments, setComments] = useState<Comment[]>([])
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [visibleCount, setVisibleCount] = useState(2)
    const [toast, setToast] = useState<{isVisible: boolean, message: string, type: 'success' | 'error' | 'info'}>({
        isVisible: false,
        message: '',
        type: 'success'
    })
    const [statusModal, setStatusModal] = useState<{isOpen: boolean, type: 'upgrade' | 'duplicate' | 'error', title: string, message: string}>({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    })

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ isVisible: true, message, type })
    }

    const fetchComments = () => {
        if (!id) return;
        setIsLoadingComments(true);
        commentsApi.getForSignal(id as string).then(({ data: commentData, error: commentError }) => {
            if (!commentError && commentData) {
                const mapRecursive = (c: any): Comment => ({
                    id: c.id,
                    username: c.username,
                    userId: c.userId,
                    text: c.content,
                    avatarUrl: c.avatarUrl,
                    timestamp: new Date(c.createdAt).getTime(),
                    replies: (c.replies || []).map(mapRecursive)
                });
                const mappedComments: Comment[] = commentData.map(mapRecursive);
                setComments(mappedComments);
                setSignal(prev => prev ? ({ ...prev, responseCount: mappedComments.length }) : null);
            }
            setIsLoadingComments(false);
        });
    }

    useEffect(() => {
        if (!id) return
        
        setLoading(true)
        
        // Simple UUID regex check to avoid 404 errors for local-only signals during prefetching
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id as string);
        
        if (!isUuid) {
            // Local-only signal (temporary ID) — fetch from store only
            const local = localSignals.find(s => s.id === id);
            if (local) {
                setSignal(local as any);
                setLoading(false);
            } else {
                setError('Local signal not found');
                setLoading(false);
            }
            return;
        }

        signalsApi.getById(id as string).then(({ data, error }) => {
            if (error || !data) {
                console.error('API Signal error:', error, 'ID:', id)
                // Fallback to local storage if backend fails
                const local = localSignals.find(s => s.id === id)
                if (local) {
                    setSignal(local as any)
                    setLoading(false)
                } else {
                    setError(error || 'Signal not found')
                    setLoading(false)
                }
            } else {
                setSignal(data)
                // Fetch owner details
                if (data.username) {
                    usersApi.getByUsername(data.username).then(({ data: userData }) => {
                        setOwner(userData)
                    })
                }
                
                fetchComments();
                fetchRequests(); // Sync network state
                setLoading(false)
            }
        })
    }, [id, localSignals, fetchRequests])

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm font-medium text-text-muted">Loading signal details...</p>
                </div>
            </div>
        )
    }

    if (error || !signal) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="text-center">
                    <h2 className="text-2xl font-display mb-2">Signal not found</h2>
                    <p className="text-text-muted mb-6">This signal may have expired or was removed from the ecosystem.</p>
                    <button 
                        onClick={() => router.push('/feed')}
                        className="bg-primary text-background px-6 py-2 rounded-md font-medium"
                    >
                        Back to Feed
                    </button>
                </div>
            </div>
        )
    }

    const isOwner = currentUser?.username === signal.username
    const alreadyConnected = (sentRequests || []).some(r => (r.receiverUsername === signal.username || r.requesterUsername === signal.username) && r.status === 'ACCEPTED') || 
                             (pendingRequests || []).some(r => (r.receiverUsername === signal.username || r.requesterUsername === signal.username) && r.status === 'ACCEPTED') ||
                             (connections || []).some(c => c.receiverUsername === signal.username || c.requesterUsername === signal.username)
                             
    const alreadyPending = (sentRequests || []).some(r => r.receiverUsername === signal.username && r.status === 'PENDING')
    const alreadyResponded = hasResponded(signal.id)

    // Calculate time details
    const createdAt = signal.createdAt ? new Date(signal.createdAt) : new Date(Date.now() - (1000 * 60 * 60 * 24))
    const { isExpired, daysLeft, hoursLeft, totalDuration, progressPercent } = getSignalExpiration(signal)

    return (
        <div className="min-h-screen bg-background flex justify-center">
            <div className="max-w-[1400px] w-full flex flex-col md:flex-row pb-16 md:pb-0">
                <MobileNavigation title="Signal Details" />
                <Sidebar />

                <main className="flex-1 w-full max-w-[900px] md:border-r border-border min-h-screen p-4 md:p-8">
                    {/* Top Navigation */}
                    <div className="flex items-center justify-between mb-8">
                        <button 
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium uppercase tracking-widest">Back</span>
                        </button>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => {
                                    const url = window.location.href;
                                    navigator.clipboard.writeText(url);
                                    showToast('Link copied to clipboard!');
                                }}
                                className="p-2 hover:bg-surface-2 rounded-full transition-colors"
                                title="Share Signal"
                            >
                                <Share2 className="w-4 h-4 text-text-muted" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content Area */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Header Section */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-primary text-background px-2 py-0.5 rounded-full">
                                        {signal.type === 'SPACE' ? (signal.spaceType || 'Ecosystem Node') : (signal.category || 'General')}
                                    </span>
                                    {signal.stage && (
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-surface-2 border border-border text-text-secondary px-2 py-0.5 rounded-full">
                                            {signal.stage}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted border border-border px-2 py-0.5 rounded-full">
                                        {signal.type === 'SPACE' ? '🏢 Collaboration Space' : (signal.type === 'need' ? '🚨 Looking for' : '💡 Offering')}
                                    </span>
                                </div>
                                <h1 className="text-4xl font-display leading-tight mb-4">{signal.title}</h1>
                                <div className="flex items-center gap-6 text-sm text-text-muted">
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <Calendar className="w-4 h-4" />
                                        <span>Opened {new Date(createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <Clock className="w-4 h-4" />
                                        <span className={daysLeft <= 1 ? 'text-accent-red font-bold' : ''}>
                                            {isExpired ? 'Expired' : (daysLeft > 0 ? `${daysLeft} days left` : `${hoursLeft} hours left`)}
                                        </span>
                                    </div>
                                    {signal.city && (
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            <span>{signal.city}{signal.state ? `, ${signal.state}` : ''}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Urgency Progress Bar - Only for Signals */}
                            {signal.type !== 'SPACE' && (
                                <div className="p-6 bg-surface-2 rounded-2xl border border-border/50">
                                <div className="flex justify-between items-end mb-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Ecosystem Urgency</p>
                                        <p className="text-lg font-medium">{signal.signalStrength} Priority</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-mono font-bold">{Math.round(progressPercent)}%</p>
                                        <p className="text-[10px] uppercase font-bold text-text-muted">Life remaining</p>
                                    </div>
                                </div>
                                <div className="w-full h-3 bg-surface/50 rounded-full overflow-hidden border border-border/30">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className={`h-full rounded-full ${
                                            daysLeft <= 1 ? "bg-accent-red" : "bg-primary"
                                        }`}
                                    />
                                </div>
                            </div>
                            )}

                            {/* Description Section */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                                    {signal.type === 'SPACE' ? 'Space Overview' : 'Signal Details'}
                                </h3>
                                <div className="prose prose-slate max-w-none">
                                    <p className="text-lg text-text-secondary leading-relaxed whitespace-pre-wrap">
                                        {signal.description}
                                    </p>
                                </div>
                                {signal.address && (
                                    <div className="flex items-start gap-3 p-4 bg-surface-2 rounded-xl border border-border/40 mt-4">
                                        <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Specific Location</p>
                                            <p className="text-sm font-medium text-text-primary">{signal.address}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Extra Space Information */}
                                {signal.type === 'SPACE' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        {signal.accessModel && (
                                            <div className="p-4 bg-surface-2 rounded-xl border border-border/40">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Access Model</p>
                                                <p className="text-sm font-bold text-text-primary">{signal.accessModel}</p>
                                            </div>
                                        )}
                                        {signal.website && (
                                            <div className="p-4 bg-surface-2 rounded-xl border border-border/40">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Website</p>
                                                <a href={signal.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline break-all">
                                                    {signal.website}
                                                </a>
                                            </div>
                                        )}
                                        {signal.contact && (
                                            <div className="p-4 bg-surface-2 rounded-xl border border-border/40">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Contact Details</p>
                                                <p className="text-sm font-bold text-text-primary">{signal.contact}</p>
                                            </div>
                                        )}
                                        {signal.amenities && (
                                            <div className="md:col-span-2 p-4 bg-surface-2 rounded-xl border border-border/40">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Amenities</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(() => {
                                                        try {
                                                            const parsed = typeof signal.amenities === 'string' ? JSON.parse(signal.amenities) : signal.amenities;
                                                            if (Array.isArray(parsed) && parsed.length > 0) {
                                                                return parsed.map((am: string, i: number) => (
                                                                    <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-surface px-3 py-1.5 rounded-md border border-border">
                                                                        {am}
                                                                    </span>
                                                                ));
                                                            }
                                                        } catch(e) {}
                                                        return <span className="text-sm text-text-muted">No amenities listed</span>;
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Stats & Metadata */}
                            {signal.type !== 'SPACE' ? (
                                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                                    <div className="text-center p-4 rounded-xl hover:bg-surface-2 transition-colors">
                                        <p className="text-2xl font-mono font-bold">{signal.viewCount || 0}</p>
                                        <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Views</p>
                                    </div>
                                    <div className="text-center p-4 rounded-xl hover:bg-surface-2 transition-colors">
                                        <p className="text-2xl font-mono font-bold">{signal.responseCount || 0}</p>
                                        <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Responses</p>
                                    </div>
                                    <div className="text-center p-4 rounded-xl hover:bg-surface-2 transition-colors">
                                        <p className="text-2xl font-mono font-bold">{signal.offerCount || 0}</p>
                                        <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Offers</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 pt-6 border-t border-border">
                                    <div className="text-center p-4 rounded-xl hover:bg-surface-2 transition-colors inline-block w-fit mx-auto">
                                        <p className="text-2xl font-mono font-bold">{signal.viewCount || 0}</p>
                                        <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">Space Views</p>
                                    </div>
                                </div>
                            )}

                            {/* Engagement Section */}
                            <div className="pt-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-display">Discussion</h2>
                                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                                        {comments.length} Respondents
                                    </span>
                                </div>

                                {/* Main Reply Box */}
                                <div className="flex gap-4 bg-surface-2 p-4 rounded-2xl border border-border/30 focus-within:border-primary/30 transition-all">
                                    <VerifiedAvatar
                                        username={currentUser?.username || 'anon'}
                                        avatarUrl={currentUser?.avatarUrl}
                                        plan={currentUser?.plan}
                                        size="w-10 h-10"
                                        badgeSize="w-3 h-3"
                                        className="shrink-0"
                                    />
                                    <div className="flex-1 space-y-3">
                                        <textarea 
                                            placeholder="Can you help with this? Add your response..."
                                            className="w-full bg-transparent border-none outline-none text-sm resize-none min-h-[60px]"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                        />
                                        {/* Instagram Style Emojis */}
                                        <div className="flex gap-4 mb-2 overflow-x-auto no-scrollbar">
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
                                        <div className="flex justify-end">
                                            <button 
                                                disabled={!commentText.trim()}
                                                onClick={async () => {
                                                    const text = commentText.trim();
                                                    setCommentText('')
                                                    
                                                    const { data, error } = await commentsApi.post(signal.id, text);
                                                    if (!error && data) {
                                                        const newComment: Comment = {
                                                            id: data.id,
                                                            username: data.username,
                                                            userId: data.userId,
                                                            text: data.content,
                                                            timestamp: new Date(data.createdAt).getTime(),
                                                            avatarUrl: data.avatarUrl || currentUser?.avatarUrl,
                                                            replies: []
                                                        };
                                                        setComments(prev => [newComment, ...prev]);
                                                        setSignal(prev => prev ? ({ ...prev, responseCount: (prev.responseCount || 0) + 1 }) : null);
                                                        
                                                        // Also update local store if it was a local signal
                                                        addComment(signal.id, text, currentUser?.username || 'anonymous')
                                                        
                                                        if (!alreadyResponded && !isOwner) {
                                                            addResponse({ signalId: signal.id, signalTitle: signal.title, signalUsername: signal.username, signalCategory: signal.category })
                                                        }
                                                    } else {
                                                        setStatusModal({
                                                            isOpen: true,
                                                            type: 'error',
                                                            title: 'Post Failed',
                                                            message: error || 'Failed to post response. Please try again.'
                                                        })
                                                        setCommentText(text); // Restore text on error
                                                    }
                                                }}
                                                className="bg-primary text-background px-6 py-2 rounded-full text-xs font-bold hover:bg-primary transition-all disabled:opacity-40"
                                            >
                                                Post Response
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments Display */}
                                <div className="space-y-6">
                                    {isLoadingComments ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <div className="text-center py-12 text-text-muted space-y-2">
                                            <MessageSquare className="w-8 h-8 mx-auto opacity-20" />
                                            <p className="text-sm">No discussion yet. Be the first to spark engagement!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {comments.slice(0, visibleCount).map((comment: any) => (
                                                <div key={comment.id} className="border-b border-border/40 pb-6 last:border-0">
                                                    <CommentThread
                                                        comment={comment}
                                                        signalId={id as string}
                                                        currentUser={currentUser?.username}
                                                        currentUserId={currentUser?.id}
                                                        isSignalOwner={isOwner}
                                                        onReplySuccess={fetchComments}
                                                        onDeleteSuccess={(deletedId) => {
                                                            const removeRecursive = (list: Comment[]): Comment[] => {
                                                                return list.filter(c => c.id !== deletedId).map(c => ({
                                                                    ...c,
                                                                    replies: removeRecursive(c.replies)
                                                                }));
                                                            };
                                                            setComments(prev => removeRecursive(prev));
                                                            setSignal(prev => prev ? ({ ...prev, responseCount: Math.max(0, (prev.responseCount || 0) - 1) }) : null);
                                                        }}
                                                    />
                                                </div>
                                            ))}

                                            {comments.length > visibleCount && (
                                                <button 
                                                    onClick={() => setVisibleCount(prev => prev + 10)}
                                                    className="w-full py-4 text-sm font-bold text-primary hover:bg-surface-2 border border-dashed border-border rounded-xl transition-all uppercase tracking-widest mt-4"
                                                >
                                                    Show more comments ({comments.length - visibleCount} hidden)
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Information */}
                        <div className="space-y-6">
                            {/* Owner Card */}
                            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm sticky top-8">
                                <div className="h-4 bg-primary relative" />
                                <div className="px-6 pb-6 pt-4 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <VerifiedAvatar
                                            username={signal.username}
                                            avatarUrl={owner?.avatarUrl}
                                            plan={owner?.plan}
                                            size="w-16 h-16"
                                            badgeSize="w-5 h-5"
                                            className="rounded-2xl"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-display leading-tight truncate">{owner?.name || signal.username}</h3>
                                            <p className="text-xs text-text-muted font-mono uppercase tracking-widest mt-0.5 truncate">@{signal.username}</p>
                                        </div>
                                    </div>

                                    {owner && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span>{signal.address || signal.city || owner.city || 'India'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                <Zap className="w-3.5 h-3.5" />
                                                <span className="capitalize">{owner.role} • {owner.plan} member</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2 flex flex-col gap-2">
                                        <Link 
                                            href={`/profile/${signal.username}`}
                                            className="w-full border border-border py-2.5 rounded-lg text-sm font-medium hover:bg-surface-2 transition-all flex items-center justify-center gap-2"
                                        >
                                            View Full Profile
                                        </Link>
                                        {!isOwner && (
                                            <button 
                                                onClick={async () => {
                                                    if (!alreadyConnected && !alreadyPending) {
                                                        try {
                                                            await sendRequest(signal.type === 'SPACE' ? null : signal.id, 'I want to connect!', '', signal.type === 'SPACE' ? signal.id : null);
                                                            showToast('Connection request sent!', 'success');
                                                        } catch (err: any) {
                                                            showToast(err.message || 'Failed to send request', 'error');
                                                        }
                                                    } else {
                                                        if (alreadyConnected) {
                                                            showToast('You are already connected with this user', 'info');
                                                        } else {
                                                            showToast('Connection request is already pending', 'info');
                                                        }
                                                    }
                                                }}
                                                className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                                    alreadyConnected 
                                                        ? 'bg-surface-2 text-text-primary border border-border' 
                                                        : alreadyPending
                                                        ? 'bg-surface-2 text-text-muted border border-border cursor-not-allowed'
                                                        : 'bg-primary text-background hover:opacity-90'
                                                }`}
                                            >
                                                {alreadyConnected ? (
                                                    <><CheckCheck className="w-4 h-4" /> Connected</>
                                                ) : alreadyPending ? (
                                                    <><Clock className="w-4 h-4" /> Pending Request</>
                                                ) : (
                                                    <><UserPlus className="w-4 h-4" /> Connect with {owner?.name?.split(' ')[0] || 'User'}</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Help Actions Sticky Bar (Mobile only) */}
                            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border flex gap-3 lg:hidden z-40">
                                <button className="flex-1 bg-primary text-background py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20">
                                    I Can Help
                                </button>
                                <button className="flex-1 bg-primary text-background py-4 rounded-xl font-bold text-sm">
                                    Respond
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                
            </div>
            
            <Toast 
                isVisible={toast.isVisible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

            <StatusModal 
                isOpen={statusModal.isOpen}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    )
}

