"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, Zap, ShieldAlert, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    type: 'upgrade' | 'duplicate' | 'error' | 'confirm' | 'success';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

export default function StatusModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    type, 
    title, 
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
}: StatusModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-surface w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative"
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-2 transition-colors z-10"
                    >
                        <X className="w-5 h-5 text-text-muted" />
                    </button>

                    <div className="p-8 text-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
                            type === 'upgrade' ? 'bg-primary/10 text-primary' : 
                            type === 'duplicate' ? 'bg-yellow-50/10 text-yellow-600' :
                            type === 'confirm' ? 'bg-surface-2 text-text-primary' :
                            type === 'success' ? 'bg-primary/10 text-primary' :
                            'bg-surface-2 text-text-primary'
                        }`}>
                            {type === 'upgrade' ? <Zap className="w-8 h-8 fill-primary" /> : 
                             type === 'duplicate' ? <ShieldAlert className="w-8 h-8" /> :
                             type === 'confirm' ? <ShieldAlert className="w-8 h-8" /> :
                             type === 'success' ? <CheckCircle className="w-8 h-8" /> :
                             <AlertCircle className="w-8 h-8" />}
                        </div>

                        <h3 className="font-display text-2xl text-text-primary mb-2">{title}</h3>
                        <p className="text-text-secondary text-sm leading-relaxed mb-8">
                            {message}
                        </p>

                        <div className="space-y-3">
                            {type === 'upgrade' ? (
                                <Link 
                                    href="/subscription"
                                    onClick={onClose}
                                    className="block w-full py-3.5 bg-primary text-background text-xs font-bold uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all"
                                >
                                    View Plans & Upgrade
                                </Link>
                            ) : type === 'confirm' ? (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => {
                                            onConfirm?.();
                                            onClose();
                                        }}
                                        className="w-full py-3.5 bg-primary text-background text-xs font-bold uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all"
                                    >
                                        {confirmText}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-3.5 bg-surface-2 text-text-muted text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-border transition-all"
                                    >
                                        {cancelText}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="w-full py-3.5 bg-primary text-background text-xs font-bold uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all"
                                >
                                    Got it
                                </button>
                            )}
                            
                            {type !== 'confirm' && (
                                <button
                                    onClick={onClose}
                                    className="w-full py-3.5 bg-surface-2 text-text-muted text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-border transition-all"
                                >
                                    Close
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
