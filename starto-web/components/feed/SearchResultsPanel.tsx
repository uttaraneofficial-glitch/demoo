"use client"

import { useSearchStore, SearchResultProfile, SearchResultSignal } from '@/store/useSearchStore'
import { User as UserIcon, MapPin, Search as SearchIcon, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SearchResultsPanel() {
    const { profiles, signals, isLoading, query, clearSearch } = useSearchStore()
    const router = useRouter()

    if (!query || query.length < 2) return null

    const hasResults = profiles.length > 0 || signals.length > 0

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-0 left-0 right-0 z-50 bg-surface border border-border rounded-2xl shadow-none overflow-hidden max-h-[600px] flex flex-col w-full border-primary/10"
            >
                <div className="flex items-center justify-between p-3 border-b border-border bg-surface-2/50 backdrop-blur-sm">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Search Results</span>
                    <button onClick={clearSearch} className="p-1 hover:bg-border rounded-md transition-colors">
                        <X className="w-3 h-3 text-text-muted" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-muted">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <p className="text-sm">Searching Starto...</p>
                        </div>
                    ) : !hasResults ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-muted text-center px-6">
                            <SearchIcon className="w-8 h-8 opacity-20" />
                            <p className="text-sm font-medium">No matches found for "{query}"</p>
                            <p className="text-xs">Try searching for different keywords or names.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {/* PROFILES Section */}
                            {profiles.length > 0 && (
                                <div className="p-2">
                                    <h4 className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">Profiles</h4>
                                    <div className="space-y-1">
                                        {profiles.map((profile) => (
                                            <div
                                                key={profile.id}
                                                onClick={() => {
                                                    router.push(`/profile/${profile.username}`)
                                                    clearSearch()
                                                }}
                                                className="flex items-center gap-3 p-3 hover:bg-surface-2 rounded-lg cursor-pointer transition-colors group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center border border-border group-hover:border-primary/20 overflow-hidden">
                                                    {profile.avatarUrl ? (
                                                        <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserIcon className="w-5 h-5 text-text-muted" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium font-body text-text-primary truncate">{profile.name}</p>
                                                    <p className="text-xs text-text-muted truncate lowercase group-hover:text-primary transition-colors">@{profile.username}</p>
                                                </div>
                                                {profile.role && (
                                                    <span className="text-[9px] font-bold uppercase tracking-tighter bg-border px-1.5 py-0.5 rounded">
                                                        {profile.role}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SIGNALS Section */}
                            {signals.length > 0 && (
                                <div className="p-2">
                                    <h4 className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">Signals</h4>
                                    <div className="space-y-1">
                                        {signals.map((signal) => (
                                            <Link 
                                                key={signal.id} 
                                                href={`/signals/${signal.id}`}
                                                className="p-4 hover:bg-surface-2 transition-colors block group/res rounded-lg"
                                                onClick={clearSearch}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-sm font-medium font-body group-hover/res:text-primary transition-colors">{signal.title}</h4>
                                                    <span className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{signal.username}</span>
                                                </div>
                                                <p className="text-xs text-text-muted line-clamp-1">{signal.description}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
