"use client"

import Sidebar from '@/components/feed/Sidebar'
import VerifiedAvatar from '@/components/feed/VerifiedAvatar'
import { Bell, Zap, UserPlus, MessageSquare, ArrowRight, ShieldAlert, CheckCircle2, Gift } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { notificationsApi } from '@/lib/apiClient'
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem('starto_notifs_cache');
                if (cached) return JSON.parse(cached);
            } catch (e) {}
        }
        return [];
    })
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    const normalizeNotif = (n: any) => ({ 
        ...n, 
        isRead: n.isRead ?? n.read ?? n.is_read ?? false 
    })

    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await notificationsApi.getAll();
            if (data) {
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                const filtered = data
                    .map(normalizeNotif)
                    .filter((n: any) => new Date(n.createdAt).getTime() >= sevenDaysAgo)
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setNotifications(filtered);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('starto_notifs_cache', JSON.stringify(filtered));
                }
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Real-time polling every 10 seconds for "no delay" feel
    useEffect(() => {
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 10000);
        return () => clearInterval(intervalId);
    }, [fetchNotifications]);

    const handleMarkAllAsRead = async () => {
        if (notifications.every(n => n.isRead)) return;
        const { error } = await notificationsApi.markAllAsRead()
        if (error) {
            toast.error("Failed to mark all as read")
        } else {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            toast.success("All caught up!")
            window.dispatchEvent(new CustomEvent('notificationsRead'));
        }
    }

    const handleNotificationClick = async (notif: any) => {
        if (!notif.isRead) {
            await notificationsApi.markAsRead(notif.id)
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
            window.dispatchEvent(new CustomEvent('notificationsRead'));
        }

        let meta = notif.data;
        if (typeof meta === 'string' && meta.trim().startsWith('{')) {
            try { meta = JSON.parse(meta); } catch (e) {}
        }

        const targetId = notif.signalId || notif.postId || notif.targetId || notif.entityId || notif.spaceId ||
                         meta?.signalId || meta?.postId || meta?.targetId || meta?.spaceId ||
                         meta?.signal_id || meta?.post_id || meta?.entityId || meta?.id || meta?.space_id ||
                         (typeof notif.data === 'string' && notif.data.length > 20 ? notif.data : null);

        if (notif.type === 'offer' || meta?.offerId || notif.type?.includes('offer') || notif.type === 'NEW_OFFER' || notif.type === 'OFFER_ACCEPTED') {
            router.push('/network?tab=offers')
        } else if (notif.type?.includes('connection') || meta?.connectionId || notif.type === 'connection' || notif.type === 'CONNECTION_REQUEST' || notif.type === 'CONNECTION_ACCEPTED') {
            router.push('/network?tab=requests')
        } else if (notif.type === 'PLAN_EXPIRY' || notif.type === 'PLAN_EXPIRED' || notif.type?.includes('plan')) {
            router.push('/subscription')
        } else if (targetId) {
            router.push(`/signals/${targetId}`)
        } else {
            router.push('/feed')
        }
    }

    
    const extractSender = (notif: any) => {
        let meta = notif.data;
        if (typeof meta === 'string' && meta.trim().startsWith('{')) {
            try { meta = JSON.parse(meta); } catch (e) {}
        }
        
        if (notif.senderName) return { name: notif.senderName, avatar: notif.senderAvatar || notif.avatarUrl };
        if (meta?.senderName) return { name: meta.senderName, avatar: meta.senderAvatar || meta.avatarUrl };
        
        // Parse from body
        const body = notif.body || '';
        const match = body.match(/^([A-Za-z\s]+) (sent|commented|accepted|requested|liked|replied)/i);
        if (match) return { name: match[1].trim(), avatar: null };
        
        return null;
    }
    
    const getIcon = (type: string = '') => {
        const t = type.toLowerCase();
        if (t.includes('urgent')) return <ShieldAlert className="w-5 h-5" />
        if (t.includes('offer')) return <Gift className="w-5 h-5" />
        if (t.includes('plan')) return <CheckCircle2 className="w-5 h-5" />
        if (t.includes('signal')) return <Zap className="w-5 h-5" />
        if (t.includes('connection')) return <UserPlus className="w-5 h-5" />
        return <MessageSquare className="w-5 h-5" />
    }

    const getColor = (type: string = '') => {
        const t = type.toLowerCase();
        if (t.includes('urgent')) return 'text-accent-red bg-accent-red/10 border-accent-red/20'
        if (t.includes('offer')) return 'text-primary bg-primary/10 border-primary/20'
        if (t.includes('plan')) return 'text-[#4CAF50] bg-[#4CAF50]/10 border-[#4CAF50]/20'
        if (t.includes('signal')) return 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20'
        if (t.includes('connection')) return 'text-accent-blue bg-accent-blue/10 border-accent-blue/20'
        return 'text-primary bg-primary/10 border-primary/20'
    }

    // Group notifications by date
    const groupedNotifications = useMemo(() => {
        const groups: Record<string, any[]> = {};
        notifications.forEach(n => {
            const date = new Date(n.createdAt || Date.now());
            let groupKey = 'Older';
            if (isToday(date)) groupKey = 'Today';
            else if (isYesterday(date)) groupKey = 'Yesterday';
            
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(n);
        });
        return groups;
    }, [notifications]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-background flex justify-center">
            <div className="max-w-[1400px] w-full flex">
                <Sidebar />

                <main className="flex-1 max-w-[720px] border-r border-border min-h-screen p-8">
                    <header className="mb-12 flex justify-between items-end border-b border-border pb-6 sticky top-0 bg-background/80 backdrop-blur-md z-10">
                        <div>
                            <h1 className="text-3xl font-display font-black tracking-tight text-text-primary flex items-center gap-3">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="bg-primary text-background text-sm font-bold px-3 py-1 rounded-full font-mono">
                                        {unreadCount} new
                                    </span>
                                )}
                            </h1>
                            <p className="text-sm text-text-secondary mt-2">Stay updated with your ecosystem activity in real-time.</p>
                        </div>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllAsRead}
                                className="text-sm font-bold uppercase tracking-widest text-primary hover:text-text-primary transition-colors flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border rounded-xl hover:bg-border"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Mark all read
                            </button>
                        )}
                    </header>

                    <div className="space-y-8">
                        {isLoading && notifications.length === 0 ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-surface-2 rounded-2xl w-full"></div>
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="mt-20 p-12 bg-surface-2 border border-border rounded-3xl text-center">
                                <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
                                    <Bell className="w-8 h-8 text-text-muted" />
                                </div>
                                <h3 className="text-xl font-display font-bold text-text-primary mb-2">You're all caught up!</h3>
                                <p className="text-text-secondary">No new notifications right now. We'll ping you when something happens.</p>
                            </div>
                        ) : (
                            ['Today', 'Yesterday', 'Older'].map(group => {
                                const notifs = groupedNotifications[group];
                                if (!notifs || notifs.length === 0) return null;
                                
                                return (
                                    <div key={group} className="space-y-4">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted pl-2">{group}</h3>
                                        <div className="space-y-3">
                                            {notifs.map((notif) => (
                                                <div 
                                                    key={notif.id} 
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`relative bg-surface border p-5 rounded-2xl flex items-start gap-5 group transition-all cursor-pointer hover:shadow-md ${
                                                        notif.isRead 
                                                            ? 'border-border opacity-75 hover:opacity-100 hover:border-text-muted' 
                                                            : 'border-primary shadow-sm bg-surface hover:-translate-y-0.5'
                                                    }`}
                                                >
                                                    {!notif.isRead && (
                                                        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary rounded-full shadow-sm border-2 border-surface animate-pulse" />
                                                    )}
                                                    
                                                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border ${getColor(notif.type)}`}>
                                                        {getIcon(notif.type)}
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0 pt-1">
                                                        <p className={`text-base leading-snug mb-2 ${notif.isRead ? 'text-text-secondary' : 'text-text-primary font-semibold'}`}>
                                                            {notif.title ? <strong className="font-bold">{notif.title}: </strong> : ''}
                                                            {notif.body}
                                                        </p>
                                                        <p className="text-xs text-text-muted font-mono tracking-wider font-medium">
                                                            {notif.createdAt ? format(new Date(notif.createdAt), 'h:mm a') : 'Just now'}
                                                            {group === 'Older' && notif.createdAt ? ` • ${format(new Date(notif.createdAt), 'MMM d')}` : ''}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className={`pt-4 opacity-0 group-hover:opacity-100 transition-all ${notif.isRead ? 'text-text-muted' : 'text-primary'}`}>
                                                        <ArrowRight className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
