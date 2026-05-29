"use client"

import Sidebar from '@/components/feed/Sidebar'
import { MapPin, Globe, Twitter, Linkedin, Github, Zap, Users, BadgeCheck, Star, CheckCheck, Building, Share2, Check } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useSignalStore } from '@/store/useSignalStore'
import { useNetworkStore } from '@/store/useNetworkStore'
import { useRatingStore } from '@/store/useRatingStore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usersApi, connectionsApi, signalsApi, ApiUser, ApiSignal } from '@/lib/apiClient'
import { motion } from 'framer-motion'
import StatusModal from '@/components/feed/StatusModal'
import VerifiedAvatar from '@/components/feed/VerifiedAvatar'
import NetworkModal from '@/components/feed/NetworkModal'
import { useRef } from 'react'
import html2canvas from 'html2canvas'
import { ShareBadge } from '@/components/feed/ShareBadge'
import { Loader2 } from 'lucide-react'

export default function PublicProfile({ params }: { params: { username: string } }) {
    const { username: paramUsername } = params
    const router = useRouter()

    const formatURL = (url: string | null | undefined) => {
        if (!url) return '#'
        return url.startsWith('http') ? url : `https://${url}`
    }

    const extractHandle = (url: string | null | undefined, prefix = '@') => {
        if (!url) return ''
        // Strip query parameters
        const cleanUrl = url.split('?')[0]
        // Get last segment of path
        const parts = cleanUrl.split('/').filter(Boolean)
        if (parts.length === 0) return ''
        
        const lastPart = parts[parts.length - 1]
        // If it's a domain name (e.g. user just pasted linkedin.com), return empty or the domain
        if (lastPart.includes('.')) return ''
        
        return lastPart.startsWith('@') ? lastPart : `${prefix}${lastPart}`
    }

    const { user: currentUser, isAuthenticated, isInitialized } = useAuthStore()
    const storeUsername = currentUser?.username || ''
    
    const [fetchedUser, setFetchedUser] = useState<any | null>(null)
    const [isLoadingUser, setIsLoadingUser] = useState(true)
    const [fetchedSignals, setFetchedSignals] = useState<ApiSignal[]>([])

    const { signals } = useSignalStore()
    const { connections, sentRequests, sendRequest, fetchRequests } = useNetworkStore()
    const { addRating, fetchRatingsFor, fetchSummary, ratings: allRatings, summary, isLoading: isRatingLoading } = useRatingStore()
    const alreadyRated = isAuthenticated && allRatings.some(r => r.reviewerUsername === storeUsername)

    const [isMounted, setIsMounted] = useState(false)
    const [showAllSignals, setShowAllSignals] = useState(false)
    const [requestJustSent, setRequestJustSent] = useState(false)
    const [statusModal, setStatusModal] = useState<{isOpen: boolean, type: 'upgrade' | 'duplicate' | 'error', title: string, message: string}>({
        isOpen: false,
        type: 'error',
        title: '',
        message: ''
    })
    const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)
    const [userConnections, setUserConnections] = useState<any[]>([])
    const closeStatusModal = () => setStatusModal(prev => ({ ...prev, isOpen: false }))
    const [isCopied, setIsCopied] = useState(false)
    const [isGeneratingShare, setIsGeneratingShare] = useState(false)
    const badgeRef = useRef<HTMLDivElement>(null)

    const handleShare = async () => {
        if (!badgeRef.current) return
        setIsGeneratingShare(true)
        try {
            const canvas = await html2canvas(badgeRef.current, {
                scale: 2,
                backgroundColor: null,
                useCORS: true
            })
            
            canvas.toBlob(async (blob) => {
                if (!blob) return
                const file = new File([blob], 'starto_profile.png', { type: 'image/png' })
                
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `${displayName}'s Starto Profile`,
                        text: 'Check out this profile on Starto Ecosystem!',
                    })
                } else {
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'starto_profile.png'
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    // We don't have showToast on public profile, just set copied state
                }
                setIsGeneratingShare(false)
                setIsCopied(true)
                setTimeout(() => setIsCopied(false), 2000)
            }, 'image/png')
        } catch (err) {
            console.error(err)
            setIsGeneratingShare(false)
            // Error handling fallback
            const url = window.location.href;
            navigator.clipboard.writeText(url);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    }
    
    useEffect(() => {
        setIsMounted(true)
        setIsLoadingUser(true)

        // Ensure network data is loaded for accurate connection status
        if (isInitialized && isAuthenticated) {
            fetchRequests();
        }

        usersApi.getByUsername(paramUsername).then(({ data, error }) => {
            if (data) {
                setFetchedUser(data)
                // Fetch ratings and summary from backend
                if (data.id) {
                    fetchRatingsFor(data.id);
                    fetchSummary(data.id);
                }
                
                // Use userId if available, otherwise username
                const fetchParams: { userId?: string, username?: string } = data.id ? { userId: data.id } : { username: data.username };
                signalsApi.getAll(fetchParams).then(sigRes => {
                    if (sigRes.data) {
                        setFetchedSignals(sigRes.data)
                    }
                })

                // Fetch connections for this user to allow viewing network
                if (data.id) {
                    connectionsApi.getAcceptedForUser(data.id).then(({ data: connData }) => {
                        if (connData) setUserConnections(connData);
                    });
                }
            }
            setIsLoadingUser(false)
        })
    }, [paramUsername, isAuthenticated, isInitialized, fetchRatingsFor, fetchSummary])

    const isOwnProfile = isAuthenticated && paramUsername && storeUsername && 
        (paramUsername.toLowerCase() === storeUsername.toLowerCase() || 
         (currentUser?.id && fetchedUser?.id && currentUser.id === fetchedUser.id))
    
    // Use fetched data if available, fallback to store if own profile, else defaults
    const activeUser = isOwnProfile ? currentUser : fetchedUser
    const effectiveUsername = activeUser?.username || paramUsername;
    
    const {
        isVerified = false, 
        subscription = 'Free', 
        name = '',
        role = '', 
        city = '', 
        bio = '', 
        websiteUrl = '', 
        linkedinUrl = '', 
        twitterUrl = '', 
        githubUrl = '', 
        avatarUrl = null
    } = (activeUser as any) || {}

    const userSignals = fetchedSignals;

    const displayName = name || (effectiveUsername.length > 20 ? 'Starto Member' : effectiveUsername.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    const displayRole = role || 'Member'
    const displayCity = city || 'India'
    const displayBio = bio || `Active member of the Starto ecosystem. Raising signals in the ${displayRole} space.`
    const displayAvatarUrl = avatarUrl
    const displayWebsite = websiteUrl
    const displayLinkedin = linkedinUrl
    const displayTwitter = twitterUrl
    const displayGithub = githubUrl
    const displaySubscription = (activeUser as any)?.plan || (activeUser as any)?.subscription || 'Member'
    const displayVerified = isVerified

    // Rating data
    const avgRating = summary?.averageRating || 0
    // const allRatings is now from store
    const [hoverStar, setHoverStar] = useState(0)
    const [selectedStar, setSelectedStar] = useState(0)
    const [ratingComment, setRatingComment] = useState('')
    const [ratingSubmitted, setRatingSubmitted] = useState(false)

    // Rating distribution (Play Store style)
    const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: allRatings.filter(r => r.rating === star).length,
        pct: allRatings.length > 0 ? Math.round((allRatings.filter(r => r.rating === star).length / allRatings.length) * 100) : 0
    }))

    const handleSubmitRating = async () => {
        if (!selectedStar || isOwnProfile || alreadyRated || !fetchedUser?.id) return
        try {
            await addRating(fetchedUser.id, selectedStar, ratingComment)
            setRatingSubmitted(true)
        } catch (err) {
            console.error('Failed to submit rating:', err)
        }
    }

    // Connections count for this user (only shown publicly if it's own profile)
    const signalsCount = isMounted ? userSignals.length : 0
    const connectionsCount = isMounted ? (isOwnProfile ? (connections?.length || 0) : (userConnections.length || activeUser?.networkSize || 0)) : 0

    return (
        <div className="min-h-screen bg-background flex justify-center">
            <div className="max-w-[1400px] w-full flex">
                <Sidebar />

                <main className="flex-1 max-w-[680px] border-r border-border min-h-screen p-0">
                    {/* Profile Header (No Banner) */}
                    <div className="pt-8 px-8 flex items-end gap-6 border-b border-border pb-8 bg-surface-1">
                        <div className="w-32 h-32 bg-white rounded-3xl p-1 border-4 border-background shadow-2xl relative shrink-0">
                            <VerifiedAvatar
                                username={effectiveUsername}
                                avatarUrl={displayAvatarUrl}
                                plan={displaySubscription}
                                size="w-full h-full"
                                badgeSize="w-8 h-8"
                                className="rounded-2xl overflow-hidden"
                            />
                        </div>
                        
                        <div className="flex-1 pb-2">
                            <div className="flex flex-col mb-1">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-display font-bold text-text-primary">{displayName}</h1>
                                    {(displayVerified || displaySubscription === 'Pro' || displaySubscription === 'Founder') && !displaySubscription.toLowerCase().includes('explorer') && (
                                        <span title={`${displaySubscription} Verified`} className="relative inline-flex items-center justify-center">
                                            <BadgeCheck className="w-6 h-6 fill-black text-white" />
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-medium text-gray-500">@{effectiveUsername}</p>
                            </div>
                            <p className="text-text-secondary font-medium flex items-center gap-2">
                                {displayRole} • {displayCity.split(',')[0]}
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                                <span className="text-[10px] px-2.5 py-1 bg-surface-2 rounded-full uppercase tracking-widest font-bold border border-border text-text-primary whitespace-nowrap">
                                    {displaySubscription} Account
                                </span>
                                {isOwnProfile && activeUser?.planExpiresAt && (
                                    <span className="text-[9px] text-text-muted font-medium ml-1">
                                        Expires: {(() => {
                                            const val = typeof activeUser.planExpiresAt === 'number' ? activeUser.planExpiresAt : new Date(activeUser.planExpiresAt).getTime();
                                            if (isNaN(val)) return '';
                                            const ms = val < 10000000000 ? val * 1000 : val;
                                            return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                        })()}
                                    </span>
                                )}
                            </p>
                            
                            {!isOwnProfile && (() => {
                                const isPending = isMounted && Array.isArray(sentRequests) && sentRequests.some(r => 
                                    (r.receiverId === fetchedUser?.id || r.receiverUsername?.toLowerCase() === paramUsername?.toLowerCase()) && 
                                    r.status === 'PENDING'
                                );
                                const alreadyConnected = isMounted && Array.isArray(connections) && connections.some(c => {
                                    const isCurrentUserInvolved = currentUser?.id && (c.requesterId === currentUser.id || c.receiverId === currentUser.id);
                                    const isFetchedUserInvolved = fetchedUser?.id && (c.requesterId === fetchedUser.id || c.receiverId === fetchedUser.id);
                                    const matchByUsername = c.requesterUsername?.toLowerCase() === paramUsername?.toLowerCase() || 
                                                            c.receiverUsername?.toLowerCase() === paramUsername?.toLowerCase();
                                    return (isCurrentUserInvolved && isFetchedUserInvolved) || matchByUsername;
                                });
                                
                                if (alreadyConnected) {
                                    return (
                                        <div className="mt-4 flex gap-2">
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        const conn = connections.find(c => 
                                                            c.requesterUsername?.toLowerCase() === paramUsername?.toLowerCase() || 
                                                            c.receiverUsername?.toLowerCase() === paramUsername?.toLowerCase() ||
                                                            c.requesterId === paramUsername ||
                                                            c.receiverId === paramUsername
                                                        );
                                                        if (!conn) return;
                                                        const { data, error } = await connectionsApi.getWhatsappLink(conn.id);
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
                                                }}
                                                className="px-6 py-2.5 bg-accent-green text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-accent-green/20"
                                            >
                                                <Zap className="w-4 h-4 fill-white" /> WhatsApp
                                            </button>
                                            <div className="px-6 py-2.5 bg-surface-2 text-accent-green border border-accent-green/20 text-xs font-bold uppercase tracking-widest rounded-xl flex items-center gap-2">
                                                <CheckCheck className="w-4 h-4" /> Connected
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="mt-4">
                                        <button 
                                            onClick={async () => {
                                                if (isPending || requestJustSent) {
                                                    setStatusModal({
                                                        isOpen: true,
                                                        type: 'duplicate',
                                                        title: 'Request Pending',
                                                        message: 'A connection request is already pending with this person.'
                                                    });
                                                    return;
                                                }
                                                try {
                                                    await sendRequest(null, 'I want to connect!', fetchedUser?.id);
                                                    setRequestJustSent(true);
                                                } catch (err: any) {
                                                    if (err.message?.includes('already connected') || err.message === 'Request already exists') {
                                                        setRequestJustSent(true);
                                                        setStatusModal({
                                                            isOpen: true,
                                                            type: 'duplicate',
                                                            title: 'Already Connected',
                                                            message: 'You are already connected or have a pending request with this person.'
                                                        });
                                                    } else {
                                                        setStatusModal({
                                                            isOpen: true,
                                                            type: 'error',
                                                            title: 'Request Failed',
                                                            message: err.message || 'Failed to send request'
                                                        });
                                                    }
                                                }
                                            }}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                                                requestJustSent || isPending ? 'bg-surface-2 text-text-muted border border-border' : 'bg-primary text-background hover:opacity-90'
                                            }`}
                                            disabled={isPending || requestJustSent || alreadyConnected}
                                        >
                                            {requestJustSent ? (
                                                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                                                    <BadgeCheck className="w-4 h-4" /> Sending...
                                                </motion.div>
                                            ) : isPending ? (
                                                <>
                                                    <BadgeCheck className="w-4 h-4" /> Request Sent
                                                </>
                                            ) : (
                                                <>
                                                    <Users className="w-4 h-4" /> Connect
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Profile Body */}
                    <div className="px-8 pt-8 pb-8 border-b border-border">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex-1 mr-4">
                                <div className="flex gap-4 mb-6">
                                    <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                                        <MapPin className="w-3.5 h-3.5" /> {displayCity.split(',')[0]}
                                    </span>
                                    {displayWebsite && (
                                        <Link href={formatURL(displayWebsite)} target="_blank" className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-primary transition-colors">
                                            <Globe className="w-3.5 h-3.5" /> {displayWebsite.replace(/^https?:\/\//, '')}
                                        </Link>
                                    )}
                                    {fetchedUser?.linkedinUrl && (
                                        <Link href={formatURL(fetchedUser.linkedinUrl)} target="_blank" className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-[#0077b5] transition-colors">
                                            <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                                        </Link>
                                    )}
                                    {fetchedUser?.twitterUrl && (
                                        <Link href={formatURL(fetchedUser.twitterUrl)} target="_blank" className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-[#1DA1F2] transition-colors">
                                            <Twitter className="w-3.5 h-3.5" /> Twitter
                                        </Link>
                                    )}
                                    {fetchedUser?.githubUrl && (
                                        <Link href={formatURL(fetchedUser.githubUrl)} target="_blank" className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-[#333] dark:hover:text-white transition-colors">
                                            <Github className="w-3.5 h-3.5" /> GitHub
                                        </Link>
                                    )}
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed max-w-lg mb-6">{displayBio}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${
                                    displaySubscription.toLowerCase() === 'pro' 
                                        ? 'bg-primary/5 text-primary border-primary/20 shadow-sm shadow-primary/10' 
                                        : 'bg-surface-2 text-text-muted border-border'
                                }`}>
                                    {displaySubscription} Account
                                </div>
                                <button onClick={handleShare} disabled={isGeneratingShare} className="mt-2 flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-border transition-all bg-surface hover:bg-surface-2 text-text-secondary shadow-sm disabled:opacity-50">
                                    {isGeneratingShare ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
                                    {isGeneratingShare ? 'Generating...' : isCopied ? 'Copied' : 'Share Profile'}
                                </button>
                            </div>
                        </div>

                        {/* Public Stats — Signals, Connections, Rating */}
                        <div className="flex gap-12 pt-6 mb-8">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-text-muted mb-1">Signals</p>
                                <p className="text-2xl font-mono font-bold text-text-primary">{signalsCount}</p>
                            </div>
                            <div 
                                onClick={() => setIsNetworkModalOpen(true)}
                                className="cursor-pointer group"
                            >
                                <p className="text-[10px] uppercase font-bold text-text-muted mb-1 group-hover:text-primary transition-colors">Connections</p>
                                <p className="text-2xl font-mono font-bold text-text-primary group-hover:text-primary transition-colors">{connectionsCount}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-text-muted mb-1">Rating</p>
                                <div className="flex items-center gap-1">
                                    <p className="text-2xl font-mono font-bold text-text-primary">{(isMounted && avgRating > 0) ? avgRating.toFixed(1) : '—'}</p>
                                    {isMounted && avgRating > 0 && <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />}
                                </div>
                                <p className="text-[10px] text-text-muted">{allRatings.length} {allRatings.length === 1 ? 'review' : 'reviews'}</p>
                            </div>
                        </div>

                        {/* Social Nodes (Moved to Main Body) */}
                        {(displayLinkedin || displayTwitter || displayGithub || displayWebsite) && (
                            <div className="flex gap-2 mb-4">
                                {displayLinkedin && (
                                    <a href={formatURL(displayLinkedin)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface rounded-xl hover:bg-surface-2 hover:text-primary transition-colors border border-border shadow-sm flex items-center justify-center w-9 h-9" title="LinkedIn">
                                        <Linkedin className="w-4 h-4" />
                                    </a>
                                )}
                                {displayTwitter && (
                                    <a href={formatURL(displayTwitter.startsWith('http') ? displayTwitter : `twitter.com/${displayTwitter.replace('@', '')}`)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface rounded-xl hover:bg-surface-2 hover:text-primary transition-colors border border-border shadow-sm flex items-center justify-center w-9 h-9" title="Twitter">
                                        <Twitter className="w-4 h-4" />
                                    </a>
                                )}
                                {displayGithub && (
                                    <a href={formatURL(displayGithub)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface rounded-xl hover:bg-surface-2 hover:text-primary transition-colors border border-border shadow-sm flex items-center justify-center w-9 h-9" title="GitHub">
                                        <Github className="w-4 h-4" />
                                    </a>
                                )}
                                {displayWebsite && (
                                    <a href={formatURL(displayWebsite)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface rounded-xl hover:bg-surface-2 hover:text-primary transition-colors border border-border shadow-sm flex items-center justify-center w-9 h-9" title="Website">
                                        <Globe className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Signals Feed */}
                    <div className="p-8 border-b border-border">
                        <div className="flex items-center gap-8 border-b border-border mb-8">
                            <button className="pb-4 border-b-2 border-primary font-bold text-xs uppercase tracking-widest">Active Signals</button>
                        </div>
                        <div className="space-y-6">
                            {userSignals.filter(s => s.type !== 'SPACE').length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-center text-text-muted">
                                    <Users className="w-10 h-10 mb-3 opacity-30" />
                                    <p className="text-sm">No active signals yet</p>
                                </div>
                            ) : (
                                <>
                                    {userSignals.filter(s => s.type !== 'SPACE').slice(0, showAllSignals ? undefined : 3).map(signal => (
                                            <div 
                                                key={signal.id} 
                                                onClick={() => router.push(`/signals/${signal.id}`)}
                                                className="cursor-pointer p-6 bg-surface-2 rounded-2xl border border-border group hover:border-primary transition-all"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-[10px] px-2 py-0.5 bg-black text-white rounded-full uppercase font-bold tracking-widest">{signal.category}</span>
                                                    <span className="text-[10px] font-bold text-text-muted">
                                                        {signal.createdAt ? new Date(signal.createdAt).toLocaleDateString() : 'Recent'}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-display mb-2 group-hover:text-primary transition-colors">{signal.title}</h3>
                                                <p className="text-sm text-text-secondary line-clamp-2">{signal.description}</p>
                                                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5">
                                                        <Zap className="w-3.5 h-3.5 text-primary" /> 
                                                        {(signal.responseCount ?? 0)} Responses
                                                    </span>
                                                </div>
                                            </div>
                                    ))}
                                    {userSignals.filter(s => s.type !== 'SPACE').length > 3 && (
                                        <button
                                            onClick={() => setShowAllSignals(!showAllSignals)}
                                            className="w-full py-3 rounded-xl border border-border text-sm font-bold hover:bg-surface-2 transition-all mt-2 text-black"
                                        >
                                            {showAllSignals ? 'View Less' : `View All ${userSignals.filter(s => s.type !== 'SPACE').length} Signals`}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Spaces Feed */}
                    <div className="p-8 border-b border-border bg-surface-1/30">
                        <div className="flex items-center gap-8 border-b border-border mb-8">
                            <button className="pb-4 border-b-2 border-black font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                <Building className="w-4 h-4" /> Ecosystem Spaces
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {userSignals.filter(s => s.type === 'SPACE').length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-center text-text-muted">
                                    <Building className="w-10 h-10 mb-3 opacity-30" />
                                    <p className="text-sm">No community spaces launched yet</p>
                                </div>
                            ) : (
                                <>
                                    {userSignals.filter(s => s.type === 'SPACE').map(space => (
                                        <div 
                                            key={space.id} 
                                            onClick={() => router.push(`/signals/${space.id}`)}
                                            className="cursor-pointer p-6 bg-surface rounded-3xl border border-border group hover:border-black transition-all shadow-sm"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-[10px] px-3 py-1 bg-surface-2 text-black border border-border rounded-full uppercase font-bold tracking-widest">
                                                    {(space as any).spaceType || 'Community Hub'}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-text-muted">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{(space as any).city || 'Ecosystem'}</span>
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-display mb-2 group-hover:text-black transition-colors">{space.title}</h3>
                                            <p className="text-sm text-text-secondary line-clamp-2 mb-4">{(space as any).description}</p>
                                            
                                            {(space as any).address && (
                                                <div className="flex items-center gap-2 text-xs text-text-muted mb-4 bg-surface-2 p-3 rounded-xl">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                    <span className="truncate">{(space as any).address}</span>
                                                </div>
                                            )}

                                            <div className="pt-4 border-t border-border flex justify-between items-center">
                                                <Link 
                                                    href={`/signals/${space.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary hover:underline"
                                                >
                                                    View Hub Details →
                                                </Link>
                                                {(space as any).website && (
                                                    <Link 
                                                        href={formatURL((space as any).website)}
                                                        target="_blank"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted hover:text-black"
                                                    >
                                                        Website
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    {/* ★ Feedback / Rating Section */}
                    {!isOwnProfile && (
                        <div className="p-8">
                            <h2 className="font-display text-xl mb-2">Ratings & Feedback</h2>
                            <p className="text-xs text-text-secondary mb-6">Share your experience with @{effectiveUsername}</p>

                            {/* Rating Distribution (Play Store style) */}
                            {allRatings.length > 0 && (
                                <div className="flex gap-8 mb-8 p-5 bg-surface-2 rounded-2xl border border-border">
                                    <div className="flex flex-col items-center justify-center">
                                        <p className="text-5xl font-mono font-bold">{avgRating.toFixed(1)}</p>
                                        <div className="flex gap-0.5 my-1">
                                            {[1,2,3,4,5].map(s => (
                                                <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-border fill-border'}`} />
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-text-muted">{allRatings.length} reviews</p>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        {ratingDistribution.map(({ star, count, pct }) => (
                                            <div key={star} className="flex items-center gap-2 text-xs">
                                                <span className="w-2 text-text-muted">{star}</span>
                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                                                    <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="w-6 text-text-muted">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Reviews List */}
                            {allRatings.length > 0 && (
                                <div className="mt-8 space-y-6">
                                    <h3 className="font-display text-lg mb-4">Member Feedback</h3>
                                    {allRatings.map((rating) => (
                                        <div key={rating.id} className="p-5 bg-surface border border-border rounded-2xl shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <VerifiedAvatar
                                                        username={rating.reviewerUsername}
                                                        avatarUrl={rating.reviewerAvatarUrl}
                                                        size="w-10 h-10"
                                                        badgeSize="w-3 h-3"
                                                        className="shrink-0"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-black">{rating.reviewerName}</p>
                                                        <p className="text-[10px] text-text-muted">@{rating.reviewerUsername}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star 
                                                                key={s} 
                                                                className={`w-3 h-3 ${s <= rating.rating ? 'fill-yellow-400 text-yellow-400' : 'text-border fill-border'}`} 
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="text-[9px] text-text-muted mt-1">
                                                        {new Date(rating.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            {rating.comment && (
                                                <p className="text-sm text-text-secondary leading-relaxed pl-1">
                                                    {rating.comment}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Leave a Rating */}
                            {ratingSubmitted || alreadyRated ? (
                                <div className="p-6 bg-surface-2 border border-border rounded-2xl text-center">
                                    <Star className="w-8 h-8 fill-yellow-400 text-yellow-400 mx-auto mb-2" />
                                    <p className="font-bold text-text-primary">Thanks for your feedback!</p>
                                    <p className="text-sm text-text-secondary">Your rating has been submitted.</p>
                                </div>
                            ) : (
                                <div className="p-6 bg-surface border border-border rounded-2xl">
                                    <p className="font-bold text-sm mb-4 uppercase tracking-widest text-[10px] text-text-muted">Rate this member</p>
                                    <div className="flex gap-2 mb-4">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                onMouseEnter={() => setHoverStar(star)}
                                                onMouseLeave={() => setHoverStar(0)}
                                                onClick={() => setSelectedStar(star)}
                                                className="transition-transform hover:scale-110"
                                            >
                                                <Star className={`w-9 h-9 transition-all ${
                                                    star <= (hoverStar || selectedStar)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'fill-border text-border'
                                                }`} />
                                            </button>
                                        ))}
                                        {selectedStar > 0 && (
                                            <span className="ml-2 text-sm font-medium self-center text-text-secondary">
                                                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][selectedStar]}
                                            </span>
                                        )}
                                    </div>
                                    <textarea
                                        placeholder="Write a short review (optional)..."
                                        value={ratingComment}
                                        onChange={e => setRatingComment(e.target.value)}
                                        rows={3}
                                        className="w-full border border-border rounded-xl p-3 text-sm resize-none outline-none focus:border-primary mb-4"
                                    />
                                    <button
                                        disabled={!selectedStar}
                                        onClick={handleSubmitRating}
                                        className="px-6 py-2.5 bg-primary text-background text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Submit Rating
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {/* Right Sidebar — Social Links */}
                <aside className="hidden xl:block w-[320px] p-8 space-y-8">
                    {(displayLinkedin || displayTwitter || displayGithub) && (
                        <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
                            <h3 className="font-display text-xl mb-6">Social Nodes</h3>
                            <div className="space-y-6">
                                {displayLinkedin && (
                                    <Link href={formatURL(displayLinkedin)} target="_blank" className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-background transition-all text-text-primary">
                                            <Linkedin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase text-text-muted">LinkedIn</p>
                                            <p className="text-sm font-medium truncate text-text-primary">{extractHandle(displayLinkedin, '')}</p>
                                        </div>
                                    </Link>
                                )}
                                {displayTwitter && (
                                    <Link href={formatURL(`twitter.com/${displayTwitter.replace('@', '')}`)} target="_blank" className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-background transition-all text-text-primary">
                                            <Twitter className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase text-text-muted">Twitter</p>
                                            <p className="text-sm font-medium text-text-primary">{displayTwitter.startsWith('http') ? extractHandle(displayTwitter) : (displayTwitter.startsWith('@') ? displayTwitter : `@${displayTwitter}`)}</p>
                                        </div>
                                    </Link>
                                )}
                                {displayGithub && (
                                    <Link href={formatURL(displayGithub)} target="_blank" className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-background transition-all text-text-primary">
                                            <Github className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase text-text-muted">GitHub</p>
                                            <p className="text-sm font-medium truncate text-text-primary">{extractHandle(displayGithub, '')}</p>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
            <StatusModal 
                isOpen={statusModal.isOpen} 
                onClose={closeStatusModal}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />

            <NetworkModal 
                isOpen={isNetworkModalOpen}
                onClose={() => setIsNetworkModalOpen(false)}
                connections={userConnections}
                title={`${displayName}'s Network`}
            />

            {/* Hidden container for rendering ShareBadge */}
            <div className="absolute left-[-9999px] top-[-9999px]">
                <ShareBadge 
                    ref={badgeRef}
                    type="profile"
                    username={effectiveUsername}
                    name={displayName}
                    avatarUrl={displayAvatarUrl}
                    plan={displaySubscription}
                    role={displayRole}
                    city={displayCity}
                    stats={{
                        signals: signalsCount,
                        connections: connectionsCount,
                        rating: avgRating
                    }}
                />
            </div>
        </div>
    )
}
