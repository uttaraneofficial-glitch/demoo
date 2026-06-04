"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, MessageSquare, Zap, Target, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

interface InsightsModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: {
        responses: number;
        offers: number;
        views: number;
    };
    signalTitle: string;
    hideOffers?: boolean;
}

export default function InsightsModal({ isOpen, onClose, stats, signalTitle, hideOffers = false }: InsightsModalProps) {
    const [chartData, setChartData] = useState<{ day: string; dateStr: string; value: number; height: string }[]>([])

    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const data = [];
            let remainingViews = stats.views;
            const weights = [0.05, 0.1, 0.15, 0.1, 0.2, 0.25, 0.15];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                
                const noise = 0.8 + Math.random() * 0.4; 
                let dailyViews = Math.floor(stats.views * weights[6 - i] * noise);
                
                if (i === 0) dailyViews = remainingViews;
                else {
                    remainingViews -= dailyViews;
                    if (remainingViews < 0) { dailyViews += remainingViews; remainingViews = 0; }
                }
                
                data.push({
                    day: days[date.getDay()],
                    dateStr: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    value: dailyViews,
                    height: "0%"
                });
            }
            
            const maxVal = Math.max(...data.map(d => d.value), 10);
            
            const finalizedData = data.map(d => ({
                ...d,
                height: `${Math.max((d.value / maxVal) * 100, 4)}%`
            }));
            
            setChartData(finalizedData);
        } else {
            setChartData([]);
        }
    }, [isOpen, stats.views]);

    if (!isOpen) return null;

    const conversionRate = stats.views > 0 ? ((stats.responses / stats.views) * 100).toFixed(1) : "0";
    const totalEngagement = stats.responses + stats.offers;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-background w-full max-w-[460px] rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-8 pt-8 pb-4 flex justify-between items-start bg-background relative">
                            <div>
                                <h2 className="text-[28px] font-bold tracking-tight text-text-primary mb-1">Insights</h2>
                                <p className="text-sm text-text-muted leading-tight truncate max-w-[300px]">
                                    {signalTitle}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-surface-1 hover:bg-surface-2 rounded-full transition-all text-text-primary border border-border">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-8 pb-8 space-y-6">
                            
                            {/* Modern Graph */}
                            <section className="bg-primary text-background p-6 rounded-3xl shadow-xl mt-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-blue/20 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none" />
                                
                                <div className="relative z-10 flex justify-between items-end mb-8">
                                    <div>
                                        <p className="text-background/60 text-xs uppercase tracking-widest font-bold mb-1">Performance</p>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-4xl font-light tracking-tighter">{stats.views}</h3>
                                            <TrendingUp className="w-5 h-5 text-background" />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-background/60 text-[10px] uppercase tracking-widest font-bold mb-1">Conversion</p>
                                        <span className="text-xl font-light text-background">{conversionRate}%</span>
                                    </div>
                                </div>
                                
                                <div className="h-32 flex items-end justify-between gap-1 sm:gap-2 relative z-10">
                                    {chartData.map((data, idx) => (
                                        <div key={idx} className="flex flex-col items-center flex-1 group/bar relative">
                                            {/* Hover tooltip */}
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-surface text-text-primary text-[10px] px-3 py-1.5 rounded-lg font-bold pointer-events-none z-20 whitespace-nowrap shadow-xl">
                                                {data.value} views
                                                <div className="text-[8px] text-text-muted font-normal mt-0.5">{data.dateStr}</div>
                                            </div>
                                            
                                            <div className="w-full relative flex items-end justify-center h-28 bg-surface/5 rounded-xl hover:bg-surface/10 transition-colors cursor-pointer overflow-hidden p-0.5">
                                                <motion.div 
                                                    initial={{ height: 0 }}
                                                    animate={{ height: data.height }}
                                                    transition={{ duration: 1, delay: 0.2 + (idx * 0.05), type: "spring", stiffness: 60 }}
                                                    className="w-full bg-surface rounded-[10px]"
                                                />
                                            </div>
                                            <span className="text-[10px] text-background/50 mt-3 font-medium tracking-wide uppercase">{data.day}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Interaction Stats */}
                            <div className={`grid ${hideOffers ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="bg-surface-1 p-4 rounded-3xl flex flex-col items-start shadow-sm border border-border/50 w-full"
                                >
                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                        <MessageSquare className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="text-2xl font-light tracking-tighter text-text-primary mb-0.5">{stats.responses}</span>
                                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Responses</span>
                                </motion.div>

                                {!hideOffers && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="bg-surface-1 p-4 rounded-3xl flex flex-col items-start shadow-sm border border-border/50 w-full"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center mb-2">
                                            <Zap className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-2xl font-light tracking-tighter text-text-primary mb-0.5">{stats.offers}</span>
                                        <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Help Offers</span>
                                    </motion.div>
                                )}

                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="bg-surface-1 p-4 rounded-3xl flex flex-col items-start shadow-sm border border-border/50 w-full"
                                >
                                    <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center mb-2">
                                        <Eye className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="text-2xl font-light tracking-tighter text-text-primary mb-0.5">{stats.views}</span>
                                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Total Views</span>
                                </motion.div>
                            </div>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
