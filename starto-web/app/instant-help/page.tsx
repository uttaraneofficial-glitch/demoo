"use client"

import Sidebar from '@/components/feed/Sidebar'
import { Zap, Clock, ShieldAlert, Send, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signalsApi } from '@/lib/apiClient'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'react-hot-toast'

export default function InstantHelp() {
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const { user } = useAuthStore()

    const handleEmit = async () => {
        if (!description.trim()) {
            toast.error("Please describe your emergency")
            return
        }
        setIsSubmitting(true)
        const { data, error } = await signalsApi.create({
            type: 'instant_help',
            title: 'Urgent Help Request',
            description,
            category: 'instant_help',
            seeking: 'help',
            stage: 'active',
            city: user?.city || 'Unknown',
            state: user?.state || 'Unknown',
            signalStrength: 'urgent',
            timelineDays: 1,
        } as any)
        setIsSubmitting(false)

        if (error) {
            toast.error("Failed to emit signal: " + error)
        } else if (data) {
            toast.success("Urgent signal emitted to all nodes!")
            router.push(`/signals/${data.id}`)
        }
    }

    return (
        <div className="min-h-screen bg-background flex justify-center">
            <div className="max-w-[1400px] w-full flex">
                <Sidebar />

                <main className="flex-1 max-w-[680px] border-r border-border min-h-screen p-6">
                    <header className="mb-10 text-center">
                        <div className="w-16 h-16 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-red/20">
                            <Zap className="w-8 h-8 text-accent-red animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-display mb-2">Instant Help</h1>
                        <p className="text-text-secondary text-sm">Get help in minutes, not days. Pinged to all nearby online nodes.</p>
                    </header>

                    <div className="flex bg-surface border border-border rounded-xl overflow-hidden mb-12">
                        <button className="flex-1 py-4 text-sm font-bold uppercase tracking-widest bg-primary text-background">Need Help</button>
                        <button className="flex-1 py-4 text-sm font-bold uppercase tracking-widest text-text-muted hover:bg-surface-2 transition-all">Can Help</button>
                    </div>

                    <section className="bg-surface border border-border p-8 rounded-2xl shadow-sm mb-12">
                        <h3 className="font-display text-xl mb-6">Raise Urgent Request</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 block">What do you need help with?</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your emergency..."
                                    className="w-full bg-surface-2 p-4 rounded-md border border-border outline-none focus:border-accent-red h-24 resize-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {['Live Now', '1 Hour', 'Today'].map(u => (
                                    <button key={u} className="py-2 border border-border rounded-md text-xs font-bold uppercase hover:border-accent-red transition-all">
                                        {u}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={handleEmit}
                                disabled={isSubmitting}
                                className="w-full bg-accent-red text-background py-4 rounded-md font-bold uppercase tracking-widest shadow-lg shadow-accent-red/20 hover:opacity-90 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Emitting...' : 'Emit Urgent Signal'}
                            </button>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-6 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> Live Urgent Signals
                        </h3>
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="bg-surface border-l-4 border-accent-red p-6 rounded-xl border border-border shadow-sm flex items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-bold bg-accent-red text-background px-2 py-0.5 rounded">URGENT</span>
                                            <span className="text-xs text-text-muted">Requested 10m ago</span>
                                        </div>
                                        <h4 className="font-medium mb-1">AWS DB Outage - Need RDS Expert</h4>
                                        <p className="text-xs text-text-secondary">Indiranagar • Within 10km</p>
                                    </div>
                                    <button className="p-4 bg-primary text-background rounded-full hover:scale-105 transition-transform">
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>

                <aside className="hidden lg:block w-[320px] p-8">
                    <div className="bg-surface-2 border border-border p-6 rounded-2xl">
                        <h4 className="font-display mb-4">How it works</h4>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-6 h-6 bg-primary text-background text-[10px] flex items-center justify-center rounded-full shrink-0 font-bold">1</div>
                                <p className="text-xs text-text-secondary leading-relaxed">Urgent signals bypass the regular feed and are sent as push notifications.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 bg-primary text-background text-[10px] flex items-center justify-center rounded-full shrink-0 font-bold">2</div>
                                <p className="text-xs text-text-secondary leading-relaxed">Verified online users in your city receive an immediate ping.</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}
