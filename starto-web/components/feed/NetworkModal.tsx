"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, MapPin, ExternalLink, ShieldCheck } from 'lucide-react'
import VerifiedAvatar from './VerifiedAvatar'
import Link from 'next/link'

interface NetworkModalProps {
    isOpen: boolean;
    onClose: () => void;
    connections: any[];
    currentUserId?: string;
}

export default function NetworkModal({ isOpen, onClose, connections, currentUserId }: NetworkModalProps) {
    // Extract unique users from connections
    const uniqueUsersMap = new Map();
    
    connections.forEach(conn => {
        // Ensure comparison works regardless of UUID object vs string differences
        const requesterIdStr = String(conn.requesterId);
        const receiverIdStr = String(conn.receiverId);
        const currentIdStr = String(currentUserId);

        const isRequester = requesterIdStr === currentIdStr;
        const otherUser = {
            id: isRequester ? conn.receiverId : conn.requesterId,
            name: isRequester ? conn.receiverName : conn.requesterName,
            username: isRequester ? conn.receiverUsername : conn.requesterUsername,
            avatarUrl: isRequester ? conn.receiverAvatarUrl : conn.requesterAvatarUrl,
            role: isRequester ? conn.receiverRole : conn.requesterRole
        };
        
        if (otherUser.id && !uniqueUsersMap.has(otherUser.id)) {
            uniqueUsersMap.set(otherUser.id, otherUser);
        }
    });

    const networkUsers = Array.from(uniqueUsersMap.values());

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-surface rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-surface-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/5 rounded-xl">
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-display font-medium">Network Nodes</h2>
                                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
                                        {networkUsers.length} Strategic Partners
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-surface-2 rounded-full transition-colors text-text-muted hover:text-text-primary"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {networkUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-text-muted opacity-50">
                                    <Users className="w-12 h-12 mb-4" />
                                    <p className="text-sm font-display">No connections found in this network</p>
                                </div>
                            ) : (
                                networkUsers.map((u) => (
                                    <Link 
                                        key={u.id}
                                        href={`/profile/${u.id}`}
                                        className="flex items-center gap-4 p-3 rounded-2xl border border-transparent hover:border-border hover:bg-surface-2 transition-all group"
                                        onClick={onClose}
                                    >
                                        <VerifiedAvatar 
                                            username={u.name || u.username}
                                            avatarUrl={u.avatarUrl}
                                            size="w-12 h-12"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="font-display text-base font-medium truncate group-hover:text-primary transition-colors">
                                                    {u.name}
                                                </h4>
                                                <ShieldCheck className="w-3.5 h-3.5 text-primary opacity-60" />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                                                {u.role || 'Partner'}
                                            </p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-2 text-text-muted">
                                            <ExternalLink className="w-4 h-4" />
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-surface-2 border-t border-border flex justify-between items-center">
                            <span className="text-[9px] text-text-muted uppercase font-extrabold tracking-tighter">
                                Starto Trust Network • Verified Nodes
                            </span>
                            <button 
                                onClick={onClose}
                                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                            >
                                Close View
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

