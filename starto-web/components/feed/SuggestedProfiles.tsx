"use client"

import React, { useMemo, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useSignalStore } from '@/store/useSignalStore'
import { useNetworkStore } from '@/store/useNetworkStore'
import VerifiedAvatar from './VerifiedAvatar'
import { UserPlus, Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface SuggestedProfilesProps {
    variant?: 'sidebar' | 'feed'
    limit?: number
}

export default function SuggestedProfiles({ variant = 'feed', limit = 5 }: SuggestedProfilesProps) {
    const router = useRouter()
    const { user, isAuthenticated, isFirebaseReady } = useAuthStore()
    const { signals, cachedGlobalFeed } = useSignalStore()
    const { connections, pendingRequests, sentRequests, sendRequest, fetchRequests } = useNetworkStore()
    const [sending, setSending] = useState<Record<string, boolean>>({})
    const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(new Set())
    const [requestedUsers, setRequestedUsers] = useState<Set<string>>(new Set())

    React.useEffect(() => {
        if (isAuthenticated && isFirebaseReady) {
            fetchRequests();
        }
    }, [isAuthenticated, isFirebaseReady, fetchRequests]);

    const suggestedUsers = useMemo(() => {
        if (!isAuthenticated || !user) return []

        const uniqueUsers = new Map<string, any>()
        const allSignals = [...cachedGlobalFeed, ...signals]
        
        // Extract users from signals
        allSignals.forEach(signal => {
            if (signal.username && signal.username !== user.username && !hiddenUsers.has(signal.username)) {
                if (!uniqueUsers.has(signal.username)) {
                    uniqueUsers.set(signal.username, {
                        id: signal.userId || signal.username,
                        username: signal.username,
                        name: signal.username,
                        avatarUrl: signal.avatarUrl,
                        role: 'Ecosystem Member',
                        plan: signal.userPlan || 'Free',
                        isVerified: signal.userIsVerified || false,
                    })
                }
            }
        })

        // Filter out existing connections and past requests
        // Note: We DO NOT filter out 'requestedUsers' (the ones requested during this session) 
        // so that they stay on screen as "Requested"
        const allConnectedUsernames = new Set([
            ...connections.map(c => c.requesterUsername === user.username ? c.receiverUsername : c.requesterUsername),
            ...pendingRequests.map(r => r.requesterUsername),
            ...sentRequests.map(r => r.receiverUsername)
        ])

        const filtered = Array.from(uniqueUsers.values())
            .filter(u => 
                requestedUsers.has(u.username) || 
                (!allConnectedUsernames.has(u.username) && !hiddenUsers.has(u.username))
            )
            
        // If empty, add a dummy suggestion so the UI always renders for testing
        if (filtered.length === 0) {
            filtered.push({
                id: 'dummy_starto_admin',
                username: 'starto_network',
                name: 'Starto Platform',
                role: 'Platform Guide',
                avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=starto',
                plan: 'pro',
                isVerified: true
            })
        }
            
        // Limit
        return filtered.slice(0, limit)
    }, [signals, cachedGlobalFeed, user, isAuthenticated, connections, pendingRequests, sentRequests, limit, hiddenUsers, requestedUsers])

    if (suggestedUsers.length === 0) return null

    const handleConnect = async (targetUser: any) => {
        setSending(prev => ({ ...prev, [targetUser.username]: true }))
        try {
            await sendRequest(null, `Hi ${targetUser.name}, I found your profile and would love to connect!`, targetUser.id)
            toast.success('Connection request sent!')
            setRequestedUsers(prev => new Set(prev).add(targetUser.username))
        } catch (error) {
            toast.error('Failed to send request')
        } finally {
            setSending(prev => ({ ...prev, [targetUser.username]: false }))
        }
    }

    const handleHide = (username: string) => {
        setHiddenUsers(prev => new Set(prev).add(username))
    }

    if (variant === 'sidebar') {
        return (
            <div className="bg-surface border border-border p-5 rounded-xl shadow-sm mb-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="font-display text-base mb-4 text-text-primary relative z-10">Suggested for you</h3>
                <div className="space-y-4 relative z-10">
                    {suggestedUsers.map(su => (
                        <div key={su.username} className="flex items-center justify-between gap-3 group/item">
                            <div 
                                className="flex items-center gap-2 overflow-hidden cursor-pointer flex-1"
                                onClick={() => router.push(`/profile/${su.username}`)}
                            >
                                <VerifiedAvatar
                                    username={su.username}
                                    avatarUrl={su.avatarUrl}
                                    plan={su.plan}
                                    isVerified={su.isVerified}
                                    size="w-9 h-9"
                                    badgeSize="w-3 h-3"
                                />
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-text-primary truncate group-hover/item:text-primary transition-colors">{su.name}</p>
                                    <p className="text-[9px] text-text-muted uppercase tracking-wider truncate">{su.role}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleConnect(su)}
                                disabled={sending[su.username] || requestedUsers.has(su.username)}
                                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all border shadow-sm ${
                                    requestedUsers.has(su.username) 
                                        ? 'bg-surface-2 border-transparent text-text-muted cursor-not-allowed'
                                        : 'bg-surface hover:bg-primary hover:text-background text-primary border-border hover:border-primary disabled:opacity-50'
                                }`}
                                title={requestedUsers.has(su.username) ? "Requested" : "Connect"}
                            >
                                {sending[su.username] ? (
                                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : requestedUsers.has(su.username) ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <UserPlus className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Feed variant (horizontal carousel)
    return (
        <div className="my-6 border-y border-border bg-surface py-6 px-4 -mx-4 sm:mx-0 sm:rounded-2xl sm:border-x shadow-sm overflow-hidden">
            <h3 className="font-display text-lg mb-4 px-2 text-text-primary">Suggested Profiles</h3>
            <div className="flex overflow-x-auto gap-4 pb-4 px-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {suggestedUsers.map(su => (
                    <div key={su.username} className="snap-start shrink-0 w-[180px] bg-surface-2 border border-border rounded-xl p-4 flex flex-col items-center text-center relative group hover:border-primary/50 transition-colors shadow-sm">
                        <button 
                            onClick={() => handleHide(su.username)}
                            className="absolute top-2 right-2 p-1 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-500/10"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                        
                        <div 
                            className="cursor-pointer flex flex-col items-center mt-2 w-full"
                            onClick={() => router.push(`/profile/${su.username}`)}
                        >
                            <VerifiedAvatar
                                username={su.username}
                                avatarUrl={su.avatarUrl}
                                plan={su.plan}
                                isVerified={su.isVerified}
                                size="w-16 h-16"
                                badgeSize="w-4 h-4"
                                className="mb-3"
                            />
                            <p className="text-sm font-bold text-text-primary truncate w-full group-hover:text-primary transition-colors">{su.name}</p>
                            <p className="text-[10px] text-text-muted uppercase tracking-wider truncate w-full mt-1 mb-4 h-3">{su.role}</p>
                        </div>
                        
                        <button
                            onClick={() => handleConnect(su)}
                            disabled={sending[su.username] || requestedUsers.has(su.username)}
                            className={`w-full mt-auto text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                requestedUsers.has(su.username)
                                    ? 'bg-background border border-border text-text-muted cursor-not-allowed'
                                    : 'bg-primary/10 hover:bg-primary text-primary hover:text-background'
                            }`}
                        >
                            {sending[su.username] ? (
                                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : requestedUsers.has(su.username) ? (
                                <>
                                    <Check className="w-3.5 h-3.5" /> Requested
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-3.5 h-3.5" /> Connect
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
