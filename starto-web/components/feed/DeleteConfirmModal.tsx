"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    isDeleting?: boolean;
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Item?",
    message = "This action is permanent and cannot be undone.",
    isDeleting = false
}: DeleteConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-background w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 text-center"
                    >
                        <div className="w-16 h-16 bg-surface-2 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 font-display">{title}</h3>
                        <p className="text-sm text-text-muted mb-6">{message}</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-3 border border-border rounded-xl text-sm font-bold hover:bg-surface-2 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isDeleting}
                                onClick={onConfirm}
                                className="px-4 py-3 bg-primary text-background rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
