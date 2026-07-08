"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/feed/Sidebar'
import MobileNavigation from '@/components/feed/MobileNavigation'
import { useAuthStore } from '@/store/useAuthStore'
import { 
    ShieldCheck, 
    Loader2, 
    AlertCircle,
    Mail,
    Send,
    Settings,
    BarChart3,
    Clock,
    Users,
    CheckCircle2
} from 'lucide-react'

const ADMIN_EMAIL = "krishnamurthikm07@gmail.com";

export default function CommsDashboard() {
    const router = useRouter()
    const { isAuthenticated, user, loading: authLoading } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [autoDigestEnabled, setAutoDigestEnabled] = useState(true)
    
    // Mock Data for the UI
    const stats = {
        sentToday: 124,
        openRate: "42%",
        clickRate: "12%",
        bounces: 3
    }
    
    const recentCampaigns = [
        { id: 1, name: "Daily Digest - Tech Founders", status: "Sent", time: "2 hours ago", opens: 89 },
        { id: 2, name: "New Signal Alert - Investors", status: "Sent", time: "5 hours ago", opens: 42 },
        { id: 3, name: "Platform Update v3.1", status: "Draft", time: "-", opens: 0 },
    ]

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push('/auth')
                return
            }
            if (user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
                router.push('/feed')
                return
            }
            // Simulate fetching data
            setTimeout(() => setLoading(false), 800)
        }
    }, [isAuthenticated, user, authLoading, router])

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-text-muted animate-pulse font-medium uppercase tracking-widest text-[10px]">Loading Comms Data...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex justify-center">
                <div className="max-w-[1400px] w-full flex">
                    <MobileNavigation title="Email & Comms" />
                    <Sidebar />
                    <main className="flex-1 p-8 flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-display mb-2">Restricted Area</h1>
                            <p className="text-text-muted text-sm">{error}</p>
                        </div>
                        <button 
                            onClick={() => router.push('/feed')}
                            className="bg-primary text-background px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                        >
                            Return to Feed
                        </button>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F5F4F0] text-text-primary flex justify-center">
            <div className="max-w-[1400px] w-full flex flex-col md:flex-row mb-16 md:mb-0">
                <Sidebar />

                <main className="flex-1 w-full px-4 py-8 md:overflow-y-auto border-r border-border">
                    <header className="mb-10 flex flex-col gap-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheck className="w-4 h-4 text-primary" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Admin Control Center</span>
                                </div>
                                <h1 className="text-4xl font-display tracking-tight">Email & Comms</h1>
                                <p className="text-text-muted mt-2 text-sm">Monitor and control automated platform communications.</p>
                            </div>
                            
                            <div className="hidden md:flex gap-4">
                                <div className="bg-surface border border-border px-6 py-3 rounded-2xl shadow-sm text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Sent Today</p>
                                    <p className="text-2xl font-mono font-bold text-text-primary">{stats.sentToday}</p>
                                </div>
                                <div className="bg-surface border border-border px-6 py-3 rounded-2xl shadow-sm text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Open Rate</p>
                                    <p className="text-2xl font-mono font-bold text-primary">{stats.openRate}</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2 -mx-4 px-4 md:px-0 md:mx-0 md:pb-0 hide-scrollbar">
                        <button
                            onClick={() => router.push('/admin')}
                            className="px-6 py-2 bg-surface border border-border text-text-primary text-xs font-bold uppercase tracking-widest rounded-full hover:bg-surface-2 transition-colors whitespace-nowrap shrink-0"
                        >
                            Ecosystem Users
                        </button>
                        <button
                            onClick={() => router.push('/admin/promo-codes')}
                            className="px-6 py-2 bg-surface border border-border text-text-primary text-xs font-bold uppercase tracking-widest rounded-full hover:bg-surface-2 transition-colors whitespace-nowrap shrink-0"
                        >
                            Promo Codes
                        </button>
                        <button
                            onClick={() => router.push('/admin/comms')}
                            className="px-6 py-2 bg-primary text-background text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-2 whitespace-nowrap shrink-0"
                        >
                            Email & Comms
                            <span className="text-[9px] bg-background/20 text-background px-1.5 py-0.5 rounded-full border border-background/30">BETA</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Controls */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Broadcast Tool */}
                            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Send className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-display">Broadcast Message</h2>
                                        <p className="text-text-muted text-xs">Send a manual email blast to users</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-2">Audience</label>
                                        <select className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-sm focus:outline-none">
                                            <option>All Active Users</option>
                                            <option>Founders Only</option>
                                            <option>Investors Only</option>
                                            <option>Pro Plan Subscribers</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-2">Subject</label>
                                        <input type="text" placeholder="Enter email subject..." className="w-full px-4 py-3 bg-surface-2 border border-border rounded-xl text-sm focus:outline-none" />
                                    </div>
                                    <button disabled className="w-full bg-primary/50 text-background px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest cursor-not-allowed">
                                        Configure Backend to Send
                                    </button>
                                </div>
                            </div>

                            {/* Recent Campaigns */}
                            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-border flex justify-between items-center">
                                    <h2 className="text-lg font-display">Recent Campaigns</h2>
                                    <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">View All</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-surface-2 border-b border-border">
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Campaign Name</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted text-right">Performance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentCampaigns.map((c) => (
                                                <tr key={c.id} className="border-b border-border hover:bg-surface-2/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-sm text-text-primary">{c.name}</p>
                                                        <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {c.time}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${
                                                            c.status === 'Sent' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-surface-2 text-text-secondary border-border'
                                                        }`}>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <p className="text-sm font-mono font-bold">{c.opens}</p>
                                                        <p className="text-[10px] text-text-muted">Opens</p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Widgets */}
                        <div className="space-y-6">
                            {/* System Settings */}
                            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                                <h3 className="font-display text-base mb-4 flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-primary" />
                                    System Controls
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-surface-2 rounded-xl border border-border">
                                        <div>
                                            <p className="text-sm font-bold">Automated Digests</p>
                                            <p className="text-[10px] text-text-muted">Send daily summaries to users</p>
                                        </div>
                                        <button 
                                            onClick={() => setAutoDigestEnabled(!autoDigestEnabled)}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${autoDigestEnabled ? 'bg-primary' : 'bg-border'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoDigestEnabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Setup Instructions */}
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 opacity-10">
                                    <Mail className="w-24 h-24 text-primary" />
                                </div>
                                <h3 className="font-display text-base mb-2 text-primary">Integration Required</h3>
                                <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                                    The frontend dashboard is ready. To enable actual email delivery, the backend requires integration with an ESP (Resend or SendGrid).
                                </p>
                                <ul className="text-xs space-y-2 text-text-secondary">
                                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-primary" /> UI Scaffolding Complete</li>
                                    <li className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-text-muted opacity-50" /> API Keys Configuration</li>
                                    <li className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-text-muted opacity-50" /> Background Worker Setup</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
