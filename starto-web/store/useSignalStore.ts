import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Comment {
    id: string;
    username: string;
    userId?: string;
    text: string;
    timestamp: number;
    avatarUrl?: string | null;
    replies?: Comment[];
}

export interface Signal {
    id: string;
    title: string;
    username: string;
    timeAgo: string;
    category: string;
    description: string;
    strength: string;
    status: 'Active' | 'Solved';
    type?: 'need' | 'help';
    userPlan?: string;
    avatarUrl?: string | null;
    stats: {
        responses: number;
        offers: number;
        views: number;
    };
    comments?: Comment[];
    createdAt?: number;
}

interface SignalState {
    signals: Signal[];
    addSignal: (signal: Omit<Signal, 'id' | 'status' | 'stats'>, id?: string) => void;
    deleteSignal: (id: string) => void;
    updateSignal: (id: string, signal: Partial<Omit<Signal, 'id' | 'status' | 'stats'>>) => void;
    incrementOffer: (id: string) => void;
    addComment: (signalId: string, text: string, username: string) => void;
    addReply: (signalId: string, commentId: string, text: string, username: string) => void;
    migrateUsername: (oldUsername: string, newUsername: string) => void;
    setComments: (signalId: string, comments: Comment[]) => void;
    cachedGlobalFeed: any[];
    setCachedGlobalFeed: (feed: any[]) => void;
}

export const useSignalStore = create<SignalState>()(
    persist(
        (set, get) => ({
            signals: [],
            cachedGlobalFeed: [],
            setCachedGlobalFeed: (feed) => set({ cachedGlobalFeed: feed }),
            addSignal: (newSignal, id) => set((state) => {
        const signal: Signal = {
            ...newSignal,
            id: id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7)),
            status: 'Active',
            stats: { responses: 0, offers: 0, views: 0 },
            createdAt: Date.now()
        };
        return { signals: [signal, ...state.signals] };
    }),
    deleteSignal: (id) => set((state) => ({
        signals: state.signals.filter(s => s.id !== id)
    })),
    updateSignal: (id, updatedSignal) => set((state) => ({
        signals: state.signals.map(s => 
            s.id === id ? { ...s, ...updatedSignal } : s
        )
    })),
    incrementOffer: (id) => set((state) => ({
        signals: state.signals.map(s => 
            s.id === id ? { ...s, stats: { ...s.stats, offers: (s.stats?.offers || 0) + 1 } } : s
        )
    })),
    addComment: (signalId, text, username) => set((state) => ({
        signals: state.signals.map(s => 
            s.id === signalId ? {
                ...s,
                stats: { ...s.stats, responses: s.stats.responses + 1 },
                comments: [...(s.comments || []), { id: Date.now().toString(), username, text, timestamp: Date.now(), replies: [] }]
            } : s
        )
    })),
    addReply: (signalId, commentId, text, username) => set((state) => ({
        signals: state.signals.map(s => 
            s.id === signalId ? {
                ...s,
                comments: (s.comments || []).map(c =>
                    (c.id === commentId || (c.replies || []).some(r => r.id === commentId)) ? {
                        ...c,
                        replies: [...(c.replies || []), { id: Date.now().toString(), username, text, timestamp: Date.now() }]
                    } : c
                )
            } : s
        )
    })),
    migrateUsername: (oldUsername, newUsername) => set((state) => ({
        signals: state.signals.map(s => ({
            ...s,
            username: s.username === oldUsername ? newUsername : s.username,
            comments: (s.comments || []).map(c => ({
                ...c,
                username: c.username === oldUsername ? newUsername : c.username,
                replies: (c.replies || []).map(r => ({
                    ...r,
                    username: r.username === oldUsername ? newUsername : r.username
                }))
            }))
        }))
    })),
    setComments: (signalId, comments) => set((state) => ({
        signals: state.signals.map(s => 
            s.id === signalId ? { ...s, comments } : s
        )
    })),
}), {
    name: 'starto-signal-storage',
    storage: createJSONStorage(() => localStorage)
}))

export function getSignalExpiration(signal: any) {
    const strengthStr = signal.strength || signal.signalStrength || '7';
    const totalDuration = parseInt(strengthStr) || 7;
    
    // Use server-side expiresAt if available
    if (signal.expiresAt) {
        const expiryTime = new Date(signal.expiresAt).getTime();
        const timeLeftMs = expiryTime - Date.now();
        const hoursLeft = Math.max(0, Math.floor(timeLeftMs / (1000 * 60 * 60)));
        const daysLeft = Math.floor(hoursLeft / 24);
        
        return {
            isExpired: hoursLeft <= 0,
            daysLeft,
            hoursLeft,
            totalDuration,
            progressPercent: signal.createdAt ? Math.min(100, Math.max(0, (timeLeftMs / (totalDuration * 24 * 60 * 60 * 1000)) * 100)) : 50
        };
    }

    // Fallback to local calculation
    let safeCreatedAt: number;
    if (signal.createdAt) {
        const val = typeof signal.createdAt === 'number' ? signal.createdAt : new Date(signal.createdAt).getTime();
        safeCreatedAt = val < 10000000000 ? val * 1000 : val;
    } else {
        safeCreatedAt = Date.now() - (1000 * 60 * 60 * 24);
    }
    
    const msElapsed = Date.now() - safeCreatedAt;
    const hoursElapsed = Math.floor(msElapsed / (1000 * 60 * 60));
    const totalDurationHours = totalDuration * 24;
    const hoursLeft = Math.max(0, totalDurationHours - hoursElapsed);
    const daysLeft = Math.floor(hoursLeft / 24);
    
    return {
        isExpired: hoursLeft <= 0,
        daysLeft,
        hoursLeft,
        totalDuration,
        progressPercent: Math.min(100, Math.max(0, 100 - (hoursElapsed / totalDurationHours) * 100))
    };
}
