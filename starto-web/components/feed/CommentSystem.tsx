"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { commentsApi } from '@/lib/apiClient'

export interface Comment {
    id: string;
    username: string;
    userId: string;
    text: string;
    timestamp: number;
    avatarUrl?: string | null;
    replies: Comment[];
}

import VerifiedAvatar from './VerifiedAvatar'
import DeleteConfirmModal from './DeleteConfirmModal'


// ── Shared Reply Input Component ─────────────────────────────────────────────
export function ReplyInput({ placeholder, onSubmit, onCancel, value, onChange }: {
    placeholder: string;
    onSubmit: (text: string) => void;
    onCancel: () => void;
    value?: string;
    onChange?: (v: string) => void;
}) {
    const [localValue, setLocalValue] = useState('')
    const val = value !== undefined ? value : localValue
    const setVal = onChange || setLocalValue

    return (
        <div className="mt-3 bg-surface-2 p-3 rounded-lg border border-border">
            <textarea
                autoFocus
                placeholder={placeholder}
                className="w-full bg-transparent border-none outline-none text-xs resize-none min-h-[60px]"
                value={val}
                onChange={(e) => setVal(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-2">
                <button 
                    onClick={onCancel}
                    className="px-3 py-1.5 text-[10px] font-bold text-text-muted hover:bg-surface-3 rounded-md transition-colors"
                >
                    Cancel
                </button>
                <button 
                    disabled={!val.trim()}
                    onClick={() => {
                        onSubmit(val);
                        if (!onChange) setVal('');
                    }}
                    className="px-3 py-1.5 text-[10px] font-bold bg-primary text-background rounded-md hover:bg-primary transition-colors disabled:opacity-50"
                >
                    Post Reply
                </button>
            </div>
        </div>
    )
}

// ── Recursive Comment/Reply Row ───────────────────────────────────────────────
export function CommentRow({ comment, signalId, currentUser, currentUserId, isSignalOwner, onReplySuccess, onDeleteSuccess, depth = 0 }: {
    comment: Comment; signalId: string; currentUser: string | null | undefined; currentUserId?: string | null; isSignalOwner?: boolean; onReplySuccess?: () => void; onDeleteSuccess?: (id: string) => void; depth?: number
}) {
    const [showReply, setShowReply] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [visibleReplies, setVisibleReplies] = useState(1)
    const avatarSize = depth === 0 ? 'w-6 h-6' : 'w-5 h-5'
    const textSize = depth === 0 ? 'text-sm' : 'text-xs'

    const handleReply = async (text: string) => {
        if (!currentUser) return
        
        // If replying to a reply, prefix their handle so it's clear who is being addressed
        const finalString = depth > 0 && !text.startsWith(`@${comment.username}`) 
            ? `@${comment.username} ${text}` 
            : text;
            
        try {
            const { error } = await commentsApi.postReply(signalId, comment.id, finalString);
            if (!error) {
                if (onReplySuccess) onReplySuccess();
            } else {
                console.error('Failed to post reply:', error);
            }
        } catch (err) {
            console.error('Reply error:', err);
        }
        setShowReply(false)
    }
    
    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await commentsApi.delete(signalId, comment.id);
            if (!error) {
                if (onDeleteSuccess) onDeleteSuccess(comment.id);
            } else {
                console.error('Failed to delete comment:', error);
            }
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    }

    return (
        <div className={`flex gap-2 ${textSize}`}>
            <VerifiedAvatar
                username={comment.username}
                avatarUrl={comment.avatarUrl}
                size={avatarSize}
                badgeSize={depth === 0 ? "w-3 h-3" : "w-2.5 h-2.5"}
            />
            <div className="flex-1 min-w-0">
                <p>
                    <Link href={`/profile/${comment.userId || comment.username}`} className="font-bold mr-1.5 text-text-primary cursor-pointer hover:underline">
                        @{comment.username}
                    </Link>
                    <span className="text-text-secondary">{comment.text}</span>
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-[10px] text-text-muted">
                        {new Date(comment.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {currentUser && (
                        <button onClick={() => setShowReply(v => !v)} className="text-[10px] font-bold text-text-muted hover:text-primary transition-colors">
                            Reply
                        </button>
                    )}
                    {(currentUserId && currentUserId === comment.userId) && (
                        <button onClick={() => setIsDeleteModalOpen(true)} className="text-[10px] font-bold text-text-muted hover:text-primary transition-colors">
                            Delete
                        </button>
                    )}
                </div>

                <DeleteConfirmModal 
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDelete}
                    isDeleting={isDeleting}
                    title="Delete Comment?"
                    message="Are you sure you want to remove this response? This cannot be undone."
                />

                {/* Nested replies — paginated */}
                {(comment.replies || []).length > 0 && (
                    <div className="mt-2 space-y-3 pl-3 border-l border-border/60 ml-1">
                        {(comment.replies || []).slice(0, visibleReplies).map(reply => (
                            <CommentRow 
                                key={reply.id} 
                                comment={reply} 
                                signalId={signalId} 
                                currentUser={currentUser} 
                                currentUserId={currentUserId}
                                isSignalOwner={isSignalOwner}
                                onReplySuccess={onReplySuccess} 
                                onDeleteSuccess={onDeleteSuccess}
                                depth={depth + 1} 
                            />
                        ))}
                        
                        {(comment.replies || []).length > visibleReplies && (
                            <button 
                                onClick={() => setVisibleReplies(prev => prev + 3)}
                                className="text-[9px] font-bold text-primary/70 hover:text-primary transition-colors py-1 flex items-center gap-1"
                            >
                                <span className="w-4 h-[1px] bg-border/60"></span>
                                View {(comment.replies || []).length - visibleReplies} more replies
                            </button>
                        )}
                    </div>
                )}

                {showReply && (
                    <ReplyInput
                        placeholder={`Reply to @${comment.username}...`}
                        onSubmit={handleReply}
                        onCancel={() => setShowReply(false)}
                    />
                )}
            </div>
        </div>
    )
}

export function CommentThread({ comment, signalId, currentUser, currentUserId, isSignalOwner, onReplySuccess, onDeleteSuccess }: { 
    comment: Comment; 
    signalId: string; 
    currentUser: string | null | undefined; 
    currentUserId?: string | null;
    isSignalOwner?: boolean;
    onReplySuccess?: () => void;
    onDeleteSuccess?: (id: string) => void;
}) {
    return <CommentRow 
        comment={comment} 
        signalId={signalId} 
        currentUser={currentUser} 
        currentUserId={currentUserId}
        isSignalOwner={isSignalOwner}
        onReplySuccess={onReplySuccess} 
        onDeleteSuccess={onDeleteSuccess}
        depth={0} 
    />
}
