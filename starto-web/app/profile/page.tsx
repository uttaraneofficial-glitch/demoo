"use client"

import Sidebar from '@/components/feed/Sidebar'
import MobileBottomNav from '@/components/feed/MobileBottomNav'
import VerifiedAvatar from '@/components/feed/VerifiedAvatar'
import { MapPin, Globe, Twitter, Linkedin, Github, Signal, Zap, Users, BadgeCheck, Star, Edit3, Check, X, Link as LinkIcon, Clock, CreditCard, Receipt, AlertCircle, Loader2, Share2 } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useSignalStore, getSignalExpiration } from '@/store/useSignalStore'
import { useNetworkStore } from '@/store/useNetworkStore'
import { useRatingStore } from '@/store/useRatingStore'
import { useResponseStore } from '@/store/useResponseStore'
import { usePaymentStore } from '@/store/usePaymentStore'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useLocalUserStore } from '@/store/useLocalUserStore'
import { signalsApi, subscriptionsApi, offersApi, connectionsApi, usersApi } from '@/lib/apiClient'
import StatusModal from '@/components/feed/StatusModal'
import Toast from '@/components/feed/Toast'
import NetworkModal from '@/components/feed/NetworkModal'
import * as htmlToImage from 'html-to-image'
import { ShareBadge } from '@/components/feed/ShareBadge'


export default function UserProfile() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading, updateUser } = useAuthStore()
    const { updateUserRecord } = useLocalUserStore()

    const formatURL = (url: string | null | undefined) => {
        if (!url) return '#'
        return url.startsWith('http') ? url : `https://${url}`
    }

    const formatDate = (dateInput: any) => {
        if (!dateInput) return '';
        const val = typeof dateInput === 'number' ? dateInput : new Date(dateInput).getTime();
        if (isNaN(val)) return '';
        // If it's a small number (e.g. 1776483984), it's likely seconds since epoch
        const ms = val < 10000000000 ? val * 1000 : val;
        return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

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

    const {
        isVerified = false,
        subscription,
        plan = 'Free',
        name = '',
        username = '',
        role = '',
        city = '',
        bio = '',
        websiteUrl = '',
        linkedinUrl = '',
        twitterUrl = '',
        githubUrl = '',
        avatarUrl = null
    } = user || {}

    const displayPlan = plan || subscription || 'Free'

    const { signals } = useSignalStore()
    const { connections } = useNetworkStore()
    const { summary, ratings: myRatings, fetchSummary, fetchRatingsFor } = useRatingStore()
    const { responses } = useResponseStore()

    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
    const mySignals = signals.filter(s => s.username === username)
    const activeSignals = mySignals.filter(s => s.status === 'Active' && !getSignalExpiration(s).isExpired)
    const pastSignals = mySignals.filter(s => s.status === 'Solved' || getSignalExpiration(s).isExpired)
    const avgRating = summary?.averageRating || 0
    // const myRatings = ... (from store)
    const [activeTab, setActiveTab] = useState<'active' | 'past' | 'responses' | 'payments'>('active')
    const [showAllActiveSignals, setShowAllActiveSignals] = useState(false)
    const { records: paymentHistory } = usePaymentStore()

    const [isEditing, setIsEditing] = useState(false)
    const [isEditingSocial, setIsEditingSocial] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    const [isGeneratingShare, setIsGeneratingShare] = useState(false)
    const badgeRef = useRef<HTMLDivElement>(null)

    const handleShare = async () => {
        if (!badgeRef.current) return
        setIsGeneratingShare(true)
        try {
                // Use html-to-image to handle modern CSS like oklch natively
                const dataUrl = await htmlToImage.toPng(badgeRef.current, {
                    pixelRatio: 2,
                    cacheBust: true,
                    style: { transform: 'scale(1)', transformOrigin: 'top left' }
                })
                
                const res = await fetch(dataUrl)
                const blob = await res.blob()
                const file = new File([blob], 'starto_profile.png', { type: 'image/png' })
                
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `${name || username}'s Starto Profile`,
                        text: 'Check out my profile on Starto Ecosystem!',
                    })
                } else {
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'starto_profile.png'
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    showToast('Badge downloaded! You can now post it.')
                }
                setIsGeneratingShare(false)
                setIsCopied(true)
                setTimeout(() => setIsCopied(false), 2000)

        } catch (err) {
            console.error(err)
            setIsGeneratingShare(false)
            showToast('Failed to generate share image', 'error')
        }
    }
    
    const [socialForm, setSocialForm] = useState({ linkedinUrl, twitterUrl, githubUrl })
    const [editForm, setEditForm] = useState({
        name,
        role,
        city,
        address: user?.address || '',
        bio,
        websiteUrl,
        linkedinUrl,
        twitterUrl,
        githubUrl,
        avatarUrl,
        lat: user?.lat || null,
        lng: user?.lng || null,
        handleBase: username
            ? username.split('_').slice(0, -1).join('_')
            : (name ? name.split(' ')[0].toLowerCase() : '')
    })

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
    const [toast, setToast] = useState<{isVisible: boolean, message: string, type: 'success' | 'error' | 'info'}>({
        isVisible: false,
        message: '',
        type: 'success'
    })
    const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false)

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ isVisible: true, message, type })
    }

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth')
        }
    }, [isAuthenticated, isLoading, router])

    useEffect(() => {
        if (user) {
            setSocialForm({ linkedinUrl: user.linkedinUrl || '', twitterUrl: user.twitterUrl || '', githubUrl: user.githubUrl || '' })
            setEditForm({
                name: user.name || '',
                role: user.role || '',
                city: user.city || '',
                address: user.address || '',
                bio: user.bio || '',
                websiteUrl: user.websiteUrl || '',
                linkedinUrl: user.linkedinUrl || '',
                twitterUrl: user.twitterUrl || '',
                githubUrl: user.githubUrl || '',
                avatarUrl: user.avatarUrl || null,
                lat: user.lat || null,
                lng: user.lng || null,
                handleBase: user.username ? user.username.split('_').slice(0, -1).join('_') : user.name.split(' ')[0]?.toLowerCase() || ''
            })
            // Fetch ratings for self
            if (user.id) {
                fetchSummary(user.id);
                fetchRatingsFor(user.id);
            }
            fetchUserContent();
        }
    }, [user, fetchSummary, fetchRatingsFor])

    const [isFetchingSignals, setIsFetchingSignals] = useState(false)
    const [isFetchingPayments, setIsFetchingPayments] = useState(false)
    const [isFetchingResponses, setIsFetchingResponses] = useState(false)
    const [isFetchingConnections, setIsFetchingConnections] = useState(false)
    
    const [dbSignals, setDbSignals] = useState<any[]>([])
    const [dbPayments, setDbPayments] = useState<any[]>([])
    const [dbResponses, setDbResponses] = useState<any[]>([])
    const [dbConnections, setDbConnections] = useState<any[]>([])
    const [usage, setUsage] = useState<{signalsLeft: number, offersLeft: number, aiLeft: number} | null>(null)

    const fetchUserContent = async () => {
        setIsFetchingSignals(true);
        setIsFetchingPayments(true);
        setIsFetchingResponses(true);
        setIsFetchingConnections(true);

        try {
            // 1. Fetch Signals
            const { data: signalData } = await signalsApi.getMine();
            if (signalData && signalData.signals) {
                const mapped = signalData.signals.map((s: any) => ({
                    ...s,
                    title: s.title,
                    description: s.description,
                    category: s.category,
                    strength: s.signalStrength || s.strength || '7',
                    status: (s.status === 'open' || s.status === 'Active') ? 'Active' : s.status,
                    stats: {
                        responses: s.responseCount || 0,
                        offers: s.offerCount || 0,
                        views: s.viewCount || 0
                    }
                }));
                setDbSignals(mapped);
            }

            // 2. Fetch Payments
            const { data: paymentData } = await subscriptionsApi.getHistory();
            if (paymentData) {
                setDbPayments(paymentData.map((p: any) => ({
                    id: p.id || p.razorpayOrderId,
                    planName: p.plan || p.planName,
                    amount: p.amountPaid ? p.amountPaid / 100 : (p.amount || 0),
                    currency: p.currency || 'INR',
                    dateTime: p.createdAt || p.dateTime || p.startsAt,
                    status: (p.status === 'ACTIVE' || p.status === 'SUCCESS' || p.status === 'Successful') ? 'Successful' : p.status
                })));
            }

            // 3. Fetch Responses (Offers sent + Connections sent)
            const [{ data: offers }, { data: conns }, { data: acceptedConns }] = await Promise.all([
                offersApi.getSent(),
                connectionsApi.getSent(),
                connectionsApi.getAccepted()
            ]);

            const consolidated: any[] = [];
            if (offers) {
                offers.forEach((o: any) => consolidated.push({
                    id: o.id,
                    signalId: o.signalId,
                    signalTitle: o.signalTitle || 'Signal Interest',
                    signalUsername: o.signalUsername || 'Founder',
                    signalCategory: o.signalCategory || 'Opportunity',
                    respondedAt: new Date(o.createdAt).getTime()
                }));
            }
            if (conns) {
                conns.forEach((c: any) => consolidated.push({
                    id: c.id,
                    signalId: c.signalId,
                    signalTitle: c.signalTitle || 'Network Request',
                    signalUsername: c.receiverUsername || 'User',
                    signalCategory: 'Networking',
                    respondedAt: new Date(c.createdAt).getTime()
                }));
            }
            setDbResponses(consolidated.sort((a, b) => b.respondedAt - a.respondedAt));

            // 4. Set Connections
            if (acceptedConns) {
                setDbConnections(acceptedConns);
            }

            // 5. Fetch Usage
            const { data: usageData } = await subscriptionsApi.getStatus();
            if (usageData) {
                setUsage({
                    signalsLeft: usageData.signalsLeft,
                    offersLeft: usageData.offersLeft,
                    aiLeft: usageData.aiLeft
                });
            }

        } catch (err) {
            console.error('Failed to fetch profile content', err);
        } finally {
            setIsFetchingSignals(false);
            setIsFetchingPayments(false);
            setIsFetchingResponses(false);
            setIsFetchingConnections(false);
        }
    }

    const myActiveSignals = dbSignals.filter(s => (s.status === 'Active' || s.status === 'open') && !getSignalExpiration(s).isExpired)
    const myPastSignals = dbSignals.filter(s => s.status === 'Solved' || s.status === 'EXPIRED' || getSignalExpiration(s).isExpired)


    const handleSave = async () => {
        if (editForm.websiteUrl && !editForm.websiteUrl.includes('.')) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Invalid URL',
                message: 'Please enter a valid website URL.'
            })
            return
        }
        const formattedRole = editForm.role.toLowerCase().trim().replace(/[\s/]+/g, '').replace(/[^a-z0-9]+/g, '')
        const formattedBase = editForm.handleBase.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]+/g, '')
        const newUsername = `${formattedBase}_${formattedRole}`

        const updatedProfile = { 
            ...editForm, 
            username: newUsername,
            avatarUrl: editForm.avatarUrl // Explicitly include avatarUrl
        }

        // 1. Update backend
        try {
            const { data, error } = await usersApi.updateProfile(updatedProfile)
            
            if (!error) {
                // 2. Update frontend store with backend response
                updateUser(data || updatedProfile)
                
                // 3. Keep local user store in sync for legacy components
                if (user?.email) updateUserRecord(user.email, { 
                    username: newUsername,
                    avatarUrl: editForm.avatarUrl 
                })
                
                setIsEditing(false)
                showToast('Profile updated successfully!')
            } else {
                throw new Error(error)
            }
        } catch (error) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Update Failed',
                message: 'Failed to save profile: ' + error
            })
        } finally {}
    }

    const handleCancel = () => {
        if (user) {
            setEditForm({ 
                name: user.name || '', 
                role: user.role || '', 
                city: user.city || '', 
                address: user.address || '',
                bio: user.bio || '', 
                websiteUrl: user.websiteUrl || '', 
                linkedinUrl: user.linkedinUrl || '', 
                twitterUrl: user.twitterUrl || '', 
                githubUrl: user.githubUrl || '', 
                avatarUrl: user.avatarUrl || null, 
                coverUrl: user.coverUrl || null, 
                lat: user.lat || null,
                lng: user.lng || null,
                handleBase: user.username ? user.username.split('_').slice(0, -1).join('_') : user.name.split(' ')[0]?.toLowerCase() || '' 
            })
        }
        setIsEditing(false)
    }

    const [socialError, setSocialError] = useState('')

    const isValidUrl = (url: string) => {
        if (!url) return true // Allow empty
        try {
            new URL(url.startsWith('http') ? url : `https://${url}`)
            return true
        } catch (_) {
            return false
        }
    }

    const handleSaveSocial = async () => {
        if (!isValidUrl(socialForm.linkedinUrl)) {
            setSocialError('Invalid LinkedIn URL')
            return
        }
        if (!isValidUrl(socialForm.githubUrl)) {
            setSocialError('Invalid GitHub URL')
            return
        }
        // Twitter can be a handle or URL, but user said "only accept links"
        if (socialForm.twitterUrl && !isValidUrl(socialForm.twitterUrl)) {
            setSocialError('Invalid Twitter URL')
            return
        }

        setSocialError('')
        
        try {
            const { data, error } = await usersApi.updateProfile({
                linkedinUrl: socialForm.linkedinUrl,
                twitterUrl: socialForm.twitterUrl,
                githubUrl: socialForm.githubUrl
            })
            
            if (!error) {
                updateUser(data || { linkedinUrl: socialForm.linkedinUrl, twitterUrl: socialForm.twitterUrl, githubUrl: socialForm.githubUrl })
                setIsEditingSocial(false)
                showToast('Social links updated successfully!')
            } else {
                throw new Error(error)
            }
        } catch (error: any) {
            setSocialError('Failed to save: ' + (error.message || error))
        }
    }

    const handleCancelSocial = () => {
        setSocialError('')
        if (user) {
            setSocialForm({ linkedinUrl: user.linkedinUrl || '', twitterUrl: user.twitterUrl || '', githubUrl: user.githubUrl || '' })
        }
        setIsEditingSocial(false)
    }

    const [suggestions, setSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isDetecting, setIsDetecting] = useState(false)

    const fetchSuggestions = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }
        try {
            const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
            const data = await res.json();
            if (data.features) {
                setSuggestions(data.features);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
        }
    };

    const handleSelectSuggestion = (feature: any) => {
        const { name, city: cityName, state } = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        const fullAddress = [name, cityName, state].filter(Boolean).join(', ');
        setEditForm({ 
            ...editForm, 
            address: fullAddress, 
            city: cityName || name,
            lat,
            lng
        });
        setShowSuggestions(false);
    };

    const handleUseCurrentLocation = () => {
        if ("geolocation" in navigator) {
            setIsDetecting(true)
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    // Set coordinates immediately so they are never null
                    setEditForm(prev => ({ ...prev, lat: latitude, lng: longitude }));
                    
                    try {
                        const response = await fetch(`https://photon.komoot.io/api/reverse?lon=${longitude}&lat=${latitude}`);
                        const data = await response.json();
                        if (data.features && data.features[0]) {
                            const feat = data.features[0].properties;
                            const fullAddr = [feat.name, feat.city, feat.state].filter(Boolean).join(', ');
                            const cityFound = feat.city || feat.state || 'Selected Location';
                            setEditForm(prev => ({ ...prev, address: fullAddr, city: cityFound }));
                        } else {
                            setEditForm(prev => ({ ...prev, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, city: 'Selected Location' }));
                        }
                    } catch (error) {
                        console.error("Geocoding failed", error);
                        setEditForm(prev => ({ ...prev, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, city: 'Selected Location' }));
                    }
                    setIsDetecting(false);
                },
                () => setIsDetecting(false)
            );
        }
    }

    if (!isAuthenticated || !user) return <div className="min-h-screen bg-background flex justify-center items-center text-text-muted">Loading...</div>;

    return (
        <div className="min-h-screen bg-background flex justify-center">
            <div className="max-w-[1400px] w-full flex flex-col md:flex-row pb-16 md:pb-0">
                <Sidebar />



                <main className="flex-1 w-full max-w-[680px] md:border-r border-border min-h-screen p-0">

                    {/* ── Clean Profile Header (no cover) ── */}
                    <div className="px-8 pt-8 pb-6 border-b border-border">
                        <div className="flex items-start gap-6">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-24 h-24 bg-surface rounded-2xl border-2 border-border shadow-lg relative overflow-hidden flex items-center justify-center">
                                    <VerifiedAvatar 
                                        username={isEditing ? editForm.name : (user.name || user.username)}
                                        avatarUrl={isEditing ? editForm.avatarUrl : user.avatarUrl}
                                        plan={user.plan}
                                        size="w-full h-full"
                                        className="!rounded-none"
                                    />
                                </div>
                            </div>

                            {/* Name + details */}
                            <div className="flex-1 min-w-0">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 block">Full Name</label>
                                                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-surface border border-border p-2 rounded-md font-display text-xl focus:ring-1 focus:ring-primary outline-none text-text-primary" />
                                            </div>
                                            <div className="flex-1 opacity-60">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 block">Role (Permanent)</label>
                                                <input value={editForm.role} disabled className="w-full bg-surface-2 border border-border p-2 rounded-md text-sm cursor-not-allowed outline-none text-text-primary" />
                                                <p className="text-[9px] text-text-muted mt-1 italic">Role cannot be changed after creation.</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="flex-[2] relative">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 block flex justify-between items-center">
                                                    Address (Autocomplete)
                                                    <button 
                                                        type="button"
                                                        onClick={handleUseCurrentLocation}
                                                        className="text-primary hover:underline font-bold uppercase text-[9px] flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-full"
                                                    >
                                                        {isDetecting ? 'Detecting...' : 'Detect My Location'}
                                                    </button>
                                                </label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                                    <input 
                                                        value={editForm.address} 
                                                        onChange={(e) => {
                                                            setEditForm({ ...editForm, address: e.target.value });
                                                            fetchSuggestions(e.target.value);
                                                        }} 
                                                        placeholder="Street address or landmark"
                                                        className="w-full bg-surface border border-border p-2 pl-8 rounded-md text-sm focus:ring-1 focus:ring-primary outline-none text-text-primary" 
                                                    />
                                                </div>
                                                
                                                <AnimatePresence>
                                                    {showSuggestions && suggestions.length > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="absolute z-[60] left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
                                                        >
                                                            {suggestions.map((feat, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => handleSelectSuggestion(feat)}
                                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-surface-2 transition-colors border-b border-border/50 last:border-0"
                                                                >
                                                                    <p className="font-bold text-text-primary">{feat.properties.name}</p>
                                                                    <p className="text-[9px] text-text-muted">
                                                                        {[feat.properties.city, feat.properties.state].filter(Boolean).join(', ')}
                                                                    </p>
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 block">City</label>
                                                <input 
                                                    value={editForm.city} 
                                                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} 
                                                    className="w-full bg-surface border border-border p-2 rounded-md text-sm focus:ring-1 focus:ring-primary outline-none text-text-primary" 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1 block">User Handle (editable)</label>
                                            <input value={editForm.handleBase} onChange={(e) => setEditForm({ ...editForm, handleBase: e.target.value })} className="w-full bg-surface border border-primary/30 p-2 rounded-md font-mono text-sm focus:ring-1 focus:ring-primary outline-none text-text-primary" placeholder="e.g. krishna_k88" />
                                            <p className="text-[10px] text-text-muted mt-1 font-mono">
                                                Preview: <span className="text-primary font-bold">
                                                    @{editForm.handleBase.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]+/g, '') || '…'}_{editForm.role.toLowerCase().trim().replace(/[\s/]+/g, '').replace(/[^a-z0-9]+/g, '') || 'role'}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Select Avatar</label>
                                            <div className="grid grid-cols-4 gap-2 mb-4">
                                                {[1, 2, 3, 4].map(num => {
                                                    const url = `/avatars/avatar${num}.svg`;
                                                    const isSelected = editForm.avatarUrl === url;
                                                    return (
                                                        <button 
                                                            key={num}
                                                            type="button"
                                                            onClick={() => setEditForm({ ...editForm, avatarUrl: url })}
                                                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                                                                isSelected ? 'border-primary shadow-sm' : 'border-border grayscale hover:grayscale-0'
                                                            }`}
                                                        >
                                                            <VerifiedAvatar 
                                                                username={editForm.name || 'User'}
                                                                avatarUrl={url}
                                                                size="w-full h-full"
                                                                className="!rounded-none"
                                                            />
                                                            {isSelected && <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10"><Check className="w-4 h-4 text-primary" /></div>}
                                                        </button>
                                                    );
                                                })}
                                                <button 
                                                    type="button"
                                                    onClick={() => setEditForm({ ...editForm, avatarUrl: null })}
                                                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center text-[10px] font-bold uppercase ${
                                                        !editForm.avatarUrl ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-muted hover:border-text-muted'
                                                    }`}
                                                >
                                                    Initials
                                                    {!editForm.avatarUrl && <Check className="w-3 h-3 mt-1" />}
                                                </button>
                                            </div>
                                            
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 block">Bio</label>
                                            <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={2} className="w-full bg-surface border border-border p-2 rounded-md text-sm focus:ring-1 focus:ring-primary outline-none resize-none text-text-primary" />
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={handleSave} className="px-5 py-2 bg-primary text-background rounded-md text-sm font-bold flex items-center gap-2 hover:opacity-90"><Check className="w-4 h-4" /> Save</button>
                                            <button onClick={handleCancel} className="px-5 py-2 border border-border rounded-md text-sm font-bold flex items-center gap-2 hover:bg-surface-2"><X className="w-4 h-4" /> Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h1 className="text-2xl font-display">{name}</h1>
                                            {(isVerified || displayPlan === 'Pro' || displayPlan === 'Founder' || displayPlan === 'TRIAL') && !displayPlan.toLowerCase().includes('explorer') && (
                                                <span title={`${displayPlan} Verified`} className="relative inline-flex items-center justify-center">
                                                    <BadgeCheck className="w-6 h-6 fill-black text-white" />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-text-secondary text-sm font-medium mb-1 flex items-center gap-2">
                                            {role} • {city}
                                            {displayPlan.toLowerCase() !== 'explorer' && (
                                                <>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    <span className="text-[10px] px-2 py-0.5 bg-surface-2 rounded-full uppercase tracking-tighter font-bold border border-border">{displayPlan} Account</span>
                                                </>
                                            )}
                                            {user?.planExpiresAt && (
                                                <span className="text-[10px] text-text-muted font-medium">
                                                    Expires: {formatDate(user.planExpiresAt)}
                                                </span>
                                            )}
                                        </p>
                                        {bio ? (
                                            <p className="text-sm text-text-secondary leading-relaxed mb-3 max-w-md">{bio}</p>
                                        ) : (
                                            <p className="text-sm text-text-muted italic mb-3">No bio yet — click Edit Profile to add one.</p>
                                        )}

                                        {/* Social Nodes */}
                                        {(linkedinUrl || twitterUrl || githubUrl || websiteUrl) && (
                                            <div className="flex gap-2 mb-4">
                                                {linkedinUrl && (
                                                    <a href={formatURL(linkedinUrl)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface rounded-xl hover:bg-surface-2 hover:text-primary transition-colors border border-border shadow-sm flex items-center justify-center w-9 h-9" title="LinkedIn">
                                                        <Linkedin className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {twitterUrl && (
                                                    <a href={formatURL(twitterUrl)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface rounded-xl hover:bg-surface-2 hover:text-primary transition-colors border border-border shadow-sm flex items-center justify-center w-9 h-9" title="Twitter">
                                                        <Twitter className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {githubUrl && (
                                                    <a href={formatURL(githubUrl)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface rounded-xl hover:bg-surface-2 hover:text-primary transition-colors border border-border shadow-sm flex items-center justify-center w-9 h-9" title="GitHub">
                                                        <Github className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {websiteUrl && (
                                                    <a href={formatURL(websiteUrl)} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface rounded-xl hover:bg-surface-2 hover:text-primary transition-colors border border-border shadow-sm flex items-center justify-center w-9 h-9" title="Website">
                                                        <Globe className="w-4 h-4" />
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-4 sm:gap-8 mb-6 mt-4 p-4 bg-surface-2 rounded-2xl border border-border">
                                            <div>
                                                <p className="text-[9px] uppercase font-bold text-text-muted mb-1">Signals Left</p>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-lg font-mono font-bold text-primary">{usage?.signalsLeft ?? '—'}</p>
                                                </div>
                                            </div>
                                            <div className="w-px h-8 bg-border hidden sm:block self-center" />
                                            <div>
                                                <p className="text-[9px] uppercase font-bold text-text-muted mb-1">Offers Left</p>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-lg font-mono font-bold text-primary">{usage?.offersLeft ?? '—'}</p>
                                                </div>
                                            </div>
                                            <div className="w-px h-8 bg-border hidden sm:block self-center" />
                                            <div>
                                                <p className="text-[9px] uppercase font-bold text-text-muted mb-1">AI Calls Left</p>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-lg font-mono font-bold text-primary">{usage?.aiLeft ?? '—'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 sm:gap-8 mb-3">
                                            <div><p className="text-[10px] uppercase font-bold text-text-muted">Signals</p><p className="text-xl font-mono font-bold">{dbSignals.length}</p></div>
                                            <div 
                                                onClick={() => setIsNetworkModalOpen(true)}
                                                className="cursor-pointer group"
                                            >
                                                <p className="text-[10px] uppercase font-bold text-text-muted group-hover:text-primary transition-colors">Connections</p>
                                                <p className="text-xl font-mono font-bold group-hover:text-primary transition-colors">{dbConnections.length}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-text-muted">Rating</p>
                                                <div className="flex items-center gap-1"><p className="text-xl font-mono font-bold">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</p>{avgRating > 0 && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}</div>
                                                <p className="text-[10px] text-text-muted">{myRatings.length} reviews</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-black text-white rounded-md text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90">
                                                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                                            </button>
                                            <Link href="/subscription" className="px-4 py-2 border border-border rounded-md text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-surface-2">
                                                <Star className="w-3.5 h-3.5" /> {displayPlan === 'Free' ? 'Upgrade' : 'My Plan'}
                                            </Link>
                                            <button onClick={handleShare} disabled={isGeneratingShare} className="px-4 py-2 border border-border rounded-md text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-surface-2 text-text-primary transition-all">
                                                {isGeneratingShare ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
                                                {isGeneratingShare ? 'Generating...' : isCopied ? 'Shared!' : 'Share Badge'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Signals Feed Section */}
                    <div className="p-8">
                        <div className="flex items-center gap-6 sm:gap-8 border-b border-border mb-8 overflow-x-auto whitespace-nowrap">
                             <button
                                onClick={() => setActiveTab('active')}
                                className={`pb-4 border-b-2 font-bold text-xs uppercase tracking-widest transition-all ${
                                    activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-primary'
                                }`}
                            >
                                Active Signals ({myActiveSignals.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('past')}
                                className={`pb-4 border-b-2 font-bold text-xs uppercase tracking-widest transition-all ${
                                    activeTab === 'past' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-primary'
                                }`}
                            >
                                Past History ({myPastSignals.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('responses')}
                                className={`pb-4 border-b-2 font-bold text-xs uppercase tracking-widest transition-all ${
                                    activeTab === 'responses' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-primary'
                                }`}
                            >
                                My Responses ({dbResponses.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('payments')}
                                className={`pb-4 border-b-2 font-bold text-xs uppercase tracking-widest transition-all ${
                                    activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-primary'
                                }`}
                            >
                                Payment History ({dbPayments.length})
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* ACTIVE SIGNALS TAB */}
                            {activeTab === 'active' && (
                                isFetchingSignals ? (
                                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                                ) : myActiveSignals.length === 0 ? (
                                    <div className="flex flex-col items-center py-16 text-center text-text-muted">
                                        <Zap className="w-10 h-10 mb-3 opacity-30" />
                                        <p className="text-sm">No active signals. Raise one from the Home Feed!</p>
                                    </div>
                                ) : (
                                    <>
                                        {(showAllActiveSignals ? myActiveSignals : myActiveSignals.slice(0, 3)).map(signal => (
                                            <div 
                                                key={signal.id} 
                                                onClick={() => router.push(`/signals/${signal.id}`)}
                                                className="p-6 bg-surface-2 rounded-2xl border border-border group hover:border-primary transition-all mb-4 cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-[10px] px-2 py-0.5 bg-black text-white rounded-full uppercase font-bold tracking-widest">{signal.category}</span>
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">● Active</span>
                                                </div>
                                                <h3 className="text-xl font-display mb-2 group-hover:text-primary transition-colors">{signal.title}</h3>
                                                <p className="text-sm text-text-secondary line-clamp-2">{signal.description}</p>
                                                <div className="mt-4 pt-4 border-t border-border flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-primary" /> {signal.stats.responses} Responses</span>
                                                    <span className={`${getSignalExpiration(signal).daysLeft <= 1 ? 'text-red-500' : 'text-text-muted'}`}>
                                                        Expires in {getSignalExpiration(signal).daysLeft > 0 ? `${getSignalExpiration(signal).daysLeft} days` : `${getSignalExpiration(signal).hoursLeft} hours`}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {myActiveSignals.length > 3 && (
                                            <button
                                                onClick={() => setShowAllActiveSignals(!showAllActiveSignals)}
                                                className="w-full py-3 rounded-xl border border-border text-sm font-bold hover:bg-surface-2 transition-all mt-2 text-black"
                                            >
                                                {showAllActiveSignals ? 'View Less' : `View All ${myActiveSignals.length} Signals`}
                                            </button>
                                        )}
                                    </>
                                )
                            )}

                            {/* PAST HISTORY TAB */}
                            {activeTab === 'past' && (
                                isFetchingSignals ? (
                                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                                ) : myPastSignals.length === 0 ? (
                                    <div className="flex flex-col items-center py-16 text-center text-text-muted">
                                        <Clock className="w-10 h-10 mb-3 opacity-30" />
                                        <p className="text-sm">No past signals yet.</p>
                                    </div>
                                ) : (
                                    myPastSignals.map(signal => (
                                        <div 
                                            key={signal.id} 
                                            onClick={() => router.push(`/signals/${signal.id}`)}
                                            className="p-6 bg-surface-2 rounded-2xl border border-border group hover:border-primary transition-all mb-4 cursor-pointer opacity-80"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-[10px] px-2 py-0.5 bg-text-muted text-white rounded-full uppercase font-bold tracking-widest">{signal.category}</span>
                                                {signal.status === 'Solved' ? (
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">✓ Completed</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Expired</span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-display mb-2">{signal.title}</h3>
                                            <p className="text-sm text-text-secondary line-clamp-2">{signal.description}</p>
                                        </div>
                                    ))
                                )
                            )}

                            {/* MY RESPONSES TAB */}
                            {activeTab === 'responses' && (
                                isFetchingResponses ? (
                                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                                ) : dbResponses.length === 0 ? (
                                    <div className="flex flex-col items-center py-16 text-center text-text-muted">
                                        <Users className="w-10 h-10 mb-3 opacity-30" />
                                        <p className="text-sm">You haven't responded to any signals yet.</p>
                                    </div>
                                ) : (
                                    dbResponses.map(r => (
                                        <div 
                                            key={r.id} 
                                            onClick={() => r.signalId && router.push(`/signals/${r.signalId}`)}
                                            className="p-6 bg-surface-2 rounded-2xl border border-border group hover:border-primary transition-all mb-4 cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-[10px] px-2 py-0.5 bg-primary text-background rounded-full uppercase font-bold tracking-widest">{r.signalCategory}</span>
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Responded</span>
                                            </div>
                                            <h3 className="text-xl font-display mb-2 group-hover:text-primary transition-colors">{r.signalTitle}</h3>
                                            <p className="text-xs text-text-muted">Signal by @{r.signalUsername}</p>
                                            <p className="text-[9px] text-text-muted mt-2 uppercase font-bold tracking-tighter opacity-60">Interaction on {new Date(r.respondedAt).toLocaleDateString()}</p>
                                        </div>
                                    ))
                                )
                            )}

                            {/* PAYMENT HISTORY TAB */}
                            {activeTab === 'payments' && (
                                isFetchingPayments ? (
                                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                                ) : dbPayments.length === 0 ? (
                                    <div className="flex flex-col items-center py-20 text-center text-text-muted">
                                        <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center mb-4">
                                            <Receipt className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-sm font-medium">No payment records found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {dbPayments.map((record: any) => (
                                            <div key={record.id} className="p-6 bg-surface-2 border border-border rounded-3xl group hover:border-primary transition-all flex items-center justify-between shadow-sm hover:shadow-md">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                                                        record.status === 'Successful' ? 'bg-primary text-background' : 'bg-surface-2 text-text-muted'
                                                    }`}>
                                                        {record.status === 'Successful' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h4 className="font-display text-xl tracking-tight text-text-primary">{record.planName}</h4>
                                                            <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-[0.2em] border ${
                                                                record.status === 'Successful' ? 'border-primary bg-primary text-background' : 'border-border bg-surface-2 text-text-muted'
                                                            }`}>
                                                                {record.status}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-text-muted">
                                                            <Clock className="w-3 h-3" />
                                                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest">{formatDate(record.dateTime)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-baseline justify-end gap-0.5">
                                                        <span className="text-xs font-bold text-text-primary">{record.currency}</span>
                                                        <span className="text-2xl font-mono font-bold text-text-primary tracking-tighter">{record.amount}</span>
                                                    </div>
                                                    <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.2em] mt-1">Transaction Settled</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                    {/* ── Logout & Delete Account ── */}
                    <div className="px-8 py-6 border-t border-border flex flex-col gap-3">
                        <button
                            onClick={() => { useAuthStore.getState().clearAuth(); router.push('/auth') }}
                            className="w-full flex items-center justify-center gap-2 py-3 border border-border text-text-muted rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-surface-2 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            Log Out
                        </button>
                        
                        <button
                            onClick={() => {
                                setStatusModal({
                                    isOpen: true,
                                    type: 'confirm',
                                    title: 'Delete Account?',
                                    message: 'Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.',
                                    onConfirm: async () => {
                                        const store = useLocalUserStore.getState()
                                        
                                        // Call backend API
                                        const { error } = await usersApi.deleteAccount();
                                        if (error) {
                                            setToast({ isVisible: true, message: error, type: 'error' });
                                            return;
                                        }

                                        if (user) {
                                            store.deleteUser(user.email)
                                        } else {
                                            const authUser = useAuthStore.getState().user
                                            if (authUser?.email) store.deleteUser(authUser.email)
                                        }
                                        useNetworkStore.getState().clearAll()
                                        useResponseStore.getState().clearAll()
                                        useAuthStore.getState().clearAuth()
                                        router.push('/auth')
                                    }
                                })
                            }}
                            className="w-full flex items-center justify-center gap-2 py-3 border border-border text-text-muted rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-surface-2 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            Delete Account
                        </button>
                    </div>
                </main>

                {/* Right Sidebar - Social Links */}
                <aside className="hidden xl:block w-[320px] p-8 space-y-8">
                    <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-display text-xl">Social Nodes</h3>
                            {!isEditingSocial ? (
                                <button
                                    onClick={() => { setSocialForm({ linkedinUrl, twitterUrl, githubUrl }); setIsEditingSocial(true); }}
                                    className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-primary transition-all"
                                    title="Edit social links"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={handleSaveSocial} className="p-1.5 rounded-lg bg-primary text-background hover:opacity-90 transition-all" title="Save">
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={handleCancelSocial} className="p-1.5 rounded-lg border border-border hover:bg-surface-2 transition-all" title="Cancel">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {isEditingSocial ? (
                            <div className="space-y-4">
                                {socialError && (
                                    <div className="p-2 bg-red-50 border border-red-100 rounded text-[10px] text-red-500 font-bold uppercase tracking-tight">
                                        {socialError}
                                    </div>
                                )}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 block">LinkedIn URL</label>
                                    <div className="relative">
                                        <Linkedin className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            value={socialForm.linkedinUrl}
                                            onChange={(e) => { setSocialForm({ ...socialForm, linkedinUrl: e.target.value }); if (socialError) setSocialError(''); }}
                                            placeholder="https://linkedin.com/in/yourprofile"
                                            className="w-full bg-surface-1 border border-border p-2 pl-8 rounded-lg text-xs focus:ring-1 focus:ring-primary outline-none text-text-primary"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 block">Twitter (X) URL</label>
                                    <div className="relative">
                                        <Twitter className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            value={socialForm.twitterUrl}
                                            onChange={(e) => { setSocialForm({ ...socialForm, twitterUrl: e.target.value }); if (socialError) setSocialError(''); }}
                                            placeholder="https://twitter.com/yourhandle"
                                            className="w-full bg-surface-1 border border-border p-2 pl-8 rounded-lg text-xs focus:ring-1 focus:ring-primary outline-none text-text-primary"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1 block">GitHub URL</label>
                                    <div className="relative">
                                        <Github className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            value={socialForm.githubUrl}
                                            onChange={(e) => { setSocialForm({ ...socialForm, githubUrl: e.target.value }); if (socialError) setSocialError(''); }}
                                            placeholder="https://github.com/yourusername"
                                            className="w-full bg-surface-1 border border-border p-2 pl-8 rounded-lg text-xs focus:ring-1 focus:ring-primary outline-none text-text-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {linkedinUrl ? (
                                    <Link href={formatURL(linkedinUrl)} target="_blank" className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center border border-border group-hover:bg-primary group-hover:text-white transition-all text-black">
                                            <Linkedin className="w-5 h-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-bold uppercase text-text-muted">LinkedIn</p>
                                            <p className="text-sm font-bold truncate text-black">{extractHandle(linkedinUrl, '')}</p>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="flex items-center gap-4 text-text-muted">
                                        <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center border border-border"><Linkedin className="w-5 h-5" /></div>
                                        <p className="text-xs italic">No LinkedIn added</p>
                                    </div>
                                )}
                                {twitterUrl ? (
                                    <Link href={formatURL(twitterUrl.startsWith('http') ? twitterUrl : `twitter.com/${twitterUrl.replace('@', '')}`)} target="_blank" className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center border border-border group-hover:bg-black group-hover:text-white transition-all text-black">
                                            <Twitter className="w-5 h-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-bold uppercase text-text-muted">Twitter</p>
                                            <p className="text-sm font-bold truncate text-black">{twitterUrl.startsWith('http') ? extractHandle(twitterUrl) : (twitterUrl.startsWith('@') ? twitterUrl : `@${twitterUrl}`)}</p>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="flex items-center gap-4 text-text-muted">
                                        <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center border border-border"><Twitter className="w-5 h-5" /></div>
                                        <p className="text-xs italic">No Twitter added</p>
                                    </div>
                                )}
                                {githubUrl ? (
                                    <Link href={formatURL(githubUrl)} target="_blank" className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center border border-border group-hover:bg-black group-hover:text-white transition-all text-black">
                                            <Github className="w-5 h-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-bold uppercase text-text-muted">GitHub</p>
                                            <p className="text-sm font-bold truncate text-black">{extractHandle(githubUrl, '')}</p>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="flex items-center gap-4 text-text-muted">
                                        <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center border border-border"><Github className="w-5 h-5" /></div>
                                        <p className="text-xs italic">No GitHub added</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Upgrade CTA */}
                    <div className="bg-primary p-6 rounded-2xl text-background shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="font-display text-xl mb-2">
                                {displayPlan === 'Free' ? 'Upgrade Your Plan' : 'Manage Your Plan'}
                            </h3>
                            <p className="text-background/70 text-sm mb-6 leading-relaxed">
                                {displayPlan === 'Free'
                                    ? 'Unlock verified badges, unlimited signals, and AI market intelligence.'
                                    : `View your current benefits, usage, and manage your subscription.${user?.planExpiresAt ? ` Plan expires on ${formatDate(user.planExpiresAt)}.` : ''}`}
                            </p>
                            <button
                                onClick={() => router.push('/subscription')}
                                className="w-full bg-background text-primary py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-colors"
                            >
                                {displayPlan === 'Free' ? 'Upgrade Now →' : 'View Plan →'}
                            </button>
                        </div>
                        <Signal className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                    </div>

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
                <MobileBottomNav />
            </div>

            <NetworkModal 
                isOpen={isNetworkModalOpen}
                onClose={() => setIsNetworkModalOpen(false)}
                connections={dbConnections}
                currentUserId={user?.id}
            />

            <StatusModal 
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={statusModal.onConfirm}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
                confirmText="Yes, Delete Everything"
                cancelText="No, Keep My Account"
            />

            <Toast 
                isVisible={toast.isVisible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

            {/* Hidden container for rendering ShareBadge */}
            <div className="absolute left-[-9999px] top-[-9999px]">
                <ShareBadge 
                    ref={badgeRef}
                    type="profile"
                    username={username}
                    name={name}
                    avatarUrl={user.avatarUrl}
                    plan={plan}
                    role={role}
                    city={city}
                    stats={{
                        signals: dbSignals.length,
                        connections: dbConnections.length,
                        rating: avgRating
                    }}
                />
            </div>
        </div>
    )
}
