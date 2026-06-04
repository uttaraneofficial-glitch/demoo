import Sidebar from '@/components/feed/Sidebar'
import { ArrowLeft, Clock, MapPin, Share2, Flag, Send } from 'lucide-react'
import Link from 'next/link'

export default function SignalDetail() {
    return (
        <div className="min-h-screen bg-background flex justify-center">
            <div className="max-w-[1400px] w-full flex">
                <Sidebar />

                <main className="flex-1 max-w-[680px] border-r border-border min-h-screen p-6 overflow-y-auto">
                    <Link href="/feed" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-8 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium uppercase tracking-widest text-[10px]">Back to Feed</span>
                    </Link>

                    <article>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-background px-3 py-1 rounded-full mb-4 inline-block">
                                    Talent
                                </span>
                                <h1 className="text-3xl font-display mb-4">Need Full-stack Developer for AgriTech MVP</h1>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 border border-border rounded-md hover:bg-surface-2"><Share2 className="w-4 h-4" /></button>
                                <button className="p-2 border border-border rounded-md hover:bg-surface-2"><Flag className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-8 text-sm text-text-secondary">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 rounded-md border border-border">
                                <Clock className="w-4 h-4 text-accent-red" />
                                <span>Expiring in 2 days</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 rounded-md border border-border">
                                <MapPin className="w-4 h-4" />
                                <span>Pune (Remote OK)</span>
                            </div>
                        </div>

                        <div className="prose prose-sm max-w-none text-text-primary mb-12">
                            <p className="text-lg leading-relaxed">Looking for someone with React and Node.js experience to help build our core platform. Remote-first team based in Pune. We are specifically focused on the Nashik-Pune-Mumbai agrarian corridor.</p>
                            <h4 className="mt-8 font-display">What we need:</h4>
                            <ul className="list-disc pl-5 space-y-2 mt-4 text-text-secondary">
                                <li>3+ years in React / Next.js</li>
                                <li>Experience with PostgreSQL and PostGIS is a plus</li>
                                <li>Willingness to visit local mandi hubs for field research</li>
                            </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-12">
                            <div className="p-4 border border-border rounded-xl">
                                <span className="text-[10px] font-bold uppercase text-text-muted">Compensation</span>
                                <p className="font-medium mt-1">₹40k - ₹60k / Mo + Equity</p>
                            </div>
                            <div className="p-4 border border-border rounded-xl">
                                <span className="text-[10px] font-bold uppercase text-text-muted">Expected Timeline</span>
                                <p className="font-medium mt-1">45 Days to MVP</p>
                            </div>
                        </div>

                        <section className="bg-surface-2 p-8 rounded-2xl border border-border">
                            <h3 className="font-display text-xl mb-6">Offer Your Help</h3>
                            <textarea
                                placeholder="Explain why you are a good fit..."
                                className="w-full bg-surface p-4 rounded-md border border-border outline-none focus:border-primary text-sm h-32 resize-none mb-4"
                            />
                            <button className="bg-primary text-background w-full py-4 rounded-md font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90">
                                <Send className="w-4 h-4" /> Submit Help Offer
                            </button>
                        </section>
                    </article>
                </main>

                <aside className="hidden lg:block w-[320px] p-8 space-y-8">
                    <div className="p-6 border border-border rounded-2xl bg-surface text-center">
                        <div className="w-20 h-20 bg-surface-2 rounded-full mx-auto mb-4 border border-border" />
                        <h4 className="font-display">Arjun Sharma</h4>
                        <p className="text-xs text-text-secondary mb-6">Founder at KrishiFast</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="py-2 border border-border rounded-md text-xs font-bold uppercase">Profile</button>
                            <button className="py-2 bg-primary text-background rounded-md text-xs font-bold uppercase">Connect</button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}
