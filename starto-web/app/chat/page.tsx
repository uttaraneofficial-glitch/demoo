"use client"

import Sidebar from '@/components/feed/Sidebar'
import { Send, Image, Paperclip, MoreVertical, Phone, Video } from 'lucide-react'

export default function ChatPage() {
    return (
        <div className="min-h-screen bg-background flex justify-center">
            <div className="max-w-[1400px] w-full flex">
                <Sidebar />

                <main className="flex-1 flex min-h-screen">
                    <aside className="w-[320px] border-r border-border bg-surface flex flex-col">
                        <header className="p-6 border-b border-border">
                            <h2 className="text-xl font-display">Messages</h2>
                        </header>
                        <div className="flex-1 overflow-y-auto">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`p-4 border-b border-border flex gap-4 cursor-pointer hover:bg-surface-2 transition-all ${i === 1 ? 'bg-surface-2' : ''}`}>
                                    <div className="w-12 h-12 bg-border rounded-full shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="text-sm font-medium truncate">Node Connection {i}</h4>
                                            <span className="text-[10px] text-text-muted">14:20</span>
                                        </div>
                                        <p className="text-xs text-text-secondary truncate">Hey! I saw your signal about AgriTech...</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    <section className="flex-1 flex flex-col bg-surface-2">
                        <header className="p-4 border-b border-border bg-surface flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-border rounded-full" />
                                <div>
                                    <h3 className="text-sm font-medium">Node Connection 1</h3>
                                    <p className="text-[10px] text-accent-green font-bold uppercase tracking-widest">Online</p>
                                </div>
                            </div>
                            <div className="flex gap-4 text-text-muted">
                                <button className="hover:text-primary"><Phone className="w-5 h-5" /></button>
                                <button className="hover:text-primary"><Video className="w-5 h-5" /></button>
                                <button className="hover:text-primary"><MoreVertical className="w-5 h-5" /></button>
                            </div>
                        </header>

                        <div className="flex-1 p-6 overflow-y-auto space-y-6">
                            <div className="flex flex-col items-center py-10 opacity-20">
                                <div className="w-1 bg-border h-20 mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted Signal</p>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-8 h-8 bg-border rounded-full shrink-0" />
                                <div className="bg-surface p-4 rounded-xl rounded-tl-none border border-border max-w-[70%]">
                                    <p className="text-sm">Hey Krishna, I'm an AWS export based in Indiranagar. Saw your urgent signal about the DB outage. Still need help?</p>
                                </div>
                            </div>

                            <div className="flex gap-4 flex-row-reverse">
                                <div className="w-8 h-8 bg-primary rounded-full shrink-0" />
                                <div className="bg-primary text-background p-4 rounded-xl rounded-tr-none max-w-[70%]">
                                    <p className="text-sm">Yes! We are running on RDS and seeing 100% CPU usage. Can you jump on a call?</p>
                                </div>
                            </div>
                        </div>

                        <footer className="p-4 bg-surface border-t border-border">
                            <div className="flex gap-4 items-center bg-surface-2 p-2 rounded-lg border border-border">
                                <button className="p-2 text-text-muted hover:text-primary"><Paperclip className="w-5 h-5" /></button>
                                <input type="text" placeholder="Type a message..." className="flex-1 bg-transparent outline-none text-sm" />
                                <button className="p-2 text-text-muted hover:text-primary"><Image className="w-5 h-5" /></button>
                                <button className="bg-primary text-background p-2 rounded-md hover:opacity-90"><Send className="w-4 h-4" /></button>
                            </div>
                        </footer>
                    </section>
                </main>
            </div>
        </div>
    )
}
