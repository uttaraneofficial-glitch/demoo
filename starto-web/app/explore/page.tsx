"use client"
 
import Sidebar from '@/components/feed/Sidebar'
import MobileBottomNav from '@/components/feed/MobileBottomNav'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { MapPin, Search, BarChart4, TrendingUp, AlertTriangle, Briefcase, FileText, CheckCircle2, Crown, Sparkles } from 'lucide-react'
import { exploreApi, ApiExploreResponse } from '@/lib/apiClient'
import { useAuthStore } from '@/store/useAuthStore'
import CityAutocomplete from '@/components/CityAutocomplete'
import { useRouter } from 'next/navigation'

export default function StartoAIExplore() {
    const { user, isAuthenticated } = useAuthStore()
    const router = useRouter()
    const [analyzing, setAnalyzing] = useState(false)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [loadingMessage, setLoadingMessage] = useState('Analyzing Market...')
    const [results, setResults] = useState<ApiExploreResponse | null>(null)
    const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null)
    const [recentReports, setRecentReports] = useState<any[]>([])
    const [isLoadingReports, setIsLoadingReports] = useState(false)

    const fetchUsage = async () => {
        try {
            const { data } = await exploreApi.getUsage()
            if (data) setUsage(data)
        } catch (err) {
            console.error('Failed to fetch usage:', err)
        }
    }

    const fetchReports = async () => {
        setIsLoadingReports(true)
        try {
            const { data } = await exploreApi.getReports()
            if (data) setRecentReports(data)
        } catch (err) {
            console.error('Failed to fetch reports:', err)
        } finally {
            setIsLoadingReports(false)
        }
    }

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth')
        } else {
            fetchUsage()
            fetchReports()
        }
    }, [isAuthenticated, router])

    // Form state
    const [location, setLocation] = useState('')
    const [industry, setIndustry] = useState('')
    const [budget, setBudget] = useState('')

    const loadingMessages = [
        'Analyzing Market Trend...',
        'Sourcing Real-time Data...',
        'Synthesizing Insights...',
        'Benchmarking Competitors...',
        'Generating Action Plan...',
        'Finalizing Report...'
    ]

    const handleAnalyze = async () => {
        if (!isAuthenticated) {
            router.push('/auth')
            return
        }
        if (!location || !industry) return;
        
        setAnalyzing(true)
        let msgIndex = 0
        const interval = setInterval(() => {
            msgIndex = (msgIndex + 1) % loadingMessages.length
            setLoadingMessage(loadingMessages[msgIndex])
        }, 2000)

        try {
            const { data, error, status } = await exploreApi.analyze({
                location,
                industry,
                budget: parseInt(budget.replace(/[^0-9]/g, '')) || 0,
                stage: 'Prototype',
                targetCustomer: 'B2B/B2C'
            })

            if (data) {
                setResults(data)
                setShowResults(true)
                // Refresh usage and reports after successful analysis
                fetchUsage()
                fetchReports()
            } else {
                if (status === 403) {
                    setShowUpgradeModal(true);
                } else {
                    console.error('Analysis failed:', error)
                    setShowResults(true)
                }
            }
        } finally {
            clearInterval(interval)
            setAnalyzing(false)
        }
    }

    const handleViewReport = (report: any) => {
        try {
            const data = typeof report.reportData === 'string' 
                ? JSON.parse(report.reportData) 
                : report.reportData;
            setResults(data);
            setLocation(report.location);
            setIndustry(report.industry);
            setBudget(`₹${report.budget}`);
            setShowResults(true);
        } catch (e) {
            console.error('Failed to parse report data:', e);
        }
    }

    const handleDownloadReport = () => {
        window.print()
    }

    return (
        <div className="min-h-screen bg-background flex justify-center">
            <style>{`
                @media print {
                    body, .bg-background, main {
                        background-color: white !important;
                        color: black !important;
                    }
                    .bg-surface, .bg-surface-1, .bg-surface-2, .bg-primary {
                        background-color: white !important;
                        color: black !important;
                        border-color: #e5e7eb !important;
                    }
                    .text-text-primary, .text-text-secondary, .text-text-muted, .text-primary, .text-background {
                        color: black !important;
                    }
                    .border-border {
                        border-color: #e5e7eb !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
            <div className="max-w-[1400px] w-full flex flex-col md:flex-row pb-16 md:pb-0">
                <div className="no-print">
                    <Sidebar />
                </div>

                <main className="flex-1 w-full p-4 md:p-6 lg:p-12 overflow-y-auto">
                    <header className="mb-12">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className="inline-flex items-center gap-2 bg-primary text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                Powered by Starto Ai
                            </div>
                            {usage && (
                                <div className="inline-flex items-center gap-2 bg-surface-2 border border-border px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-text-primary">
                                    <Sparkles className="w-3 h-3 text-primary" />
                                    {usage.remaining} Free Calls Left
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display mb-4">Starto AI Explore</h1>
                        <p className="text-text-secondary text-lg max-w-2xl">Real Market Intelligence. No Assumptions. No Hallucinations. Only Verified Data.</p>
                    </header>

                    {!showResults ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface border border-border rounded-2xl shadow-xl overflow-hidden"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-8 space-y-6 border-r border-border">
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">Where are you launching?</label>
                                        <CityAutocomplete 
                                            value={location}
                                            onChange={setLocation}
                                            placeholder="Enter city name..."
                                            useBackendData={true}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">What sector are you in?</label>
                                        <input 
                                            type="text" 
                                            value={industry}
                                            onChange={(e) => setIndustry(e.target.value)}
                                            placeholder="e.g. AgriTech, FinTech" 
                                            className="w-full bg-surface-2 p-3 rounded-md border border-border outline-none focus:border-primary transition-all" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">What is your initial budget?</label>
                                        <input 
                                            type="text" 
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            placeholder="e.g. ₹10L - ₹50L" 
                                            className="w-full bg-surface-2 p-3 rounded-md border border-border outline-none focus:border-primary transition-all" 
                                        />
                                    </div>
                                </div>

                                <div className="p-8 bg-surface-2 flex flex-col justify-center">
                                    <div className="space-y-4 mb-10">
                                        <div className="flex gap-4">
                                            <div className="bg-primary text-background p-2 rounded-md h-fit">
                                                <Search className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm">Real-time Data Sourcing</h4>
                                                <p className="text-xs text-text-secondary">We scan active signals and verified market reports.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="bg-primary text-background p-2 rounded-md h-fit">
                                                <TrendingUp className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm">Competitive Intelligence</h4>
                                                <p className="text-xs text-text-secondary">Direct mapping of competitors in your region.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={analyzing || !location || !industry}
                                        className="w-full bg-primary text-background py-4 rounded-md font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden relative"
                                    >
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={loadingMessage}
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -20, opacity: 0 }}
                                                className="flex items-center gap-3"
                                            >
                                                {analyzing ? loadingMessage : 'Analyze My Market →'}
                                            </motion.span>
                                        </AnimatePresence>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="mb-8 flex items-center justify-between no-print">
                            <button 
                                onClick={() => {
                                    setShowResults(false)
                                    setResults(null)
                                }}
                                className="text-sm font-bold text-text-muted hover:text-text-primary flex items-center gap-2 transition-colors"
                            >
                                ← Run New Analysis
                            </button>
                        </div>
                    )}

                    {!showResults && recentReports.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-12"
                        >
                            <h3 className="text-xl font-display mb-6">Your Recent Market Reports</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recentReports.map((report) => (
                                    <div 
                                        key={report.id}
                                        onClick={() => handleViewReport(report)}
                                        className="bg-surface border border-border p-5 rounded-2xl hover:border-primary hover:shadow-lg transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-primary/5 text-primary p-2 rounded-lg group-hover:bg-primary group-hover:text-background transition-colors">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <span className="text-[10px] text-text-muted font-mono">
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-sm mb-1">{report.industry}</h4>
                                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                            <MapPin className="w-3 h-3" />
                                            <span>{report.location}</span>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">₹{report.budget} Budget</span>
                                            <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">View Report →</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {showResults && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="md:col-span-2 space-y-6">
                                <div className="bg-surface border border-border p-8 rounded-2xl">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-2xl font-display flex items-center gap-3">
                                            <BarChart4 className="w-6 h-6" /> Market Demand
                                        </h3>
                                        <div className="text-4xl font-mono text-primary">
                                            {results?.marketDemand?.score || '0'} <span className="text-lg text-text-muted">/ 10</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-sm text-text-secondary border-l-2 border-primary pl-4">
                                            {results?.marketDemand?.marketSummary || `The ${industry || 'AgriTech'} sector in ${location || 'Pune'} shows strong growth indicators.`}
                                        </p>

                                    </div>
                                </div>

                                <div className="bg-surface border border-border p-8 rounded-2xl">
                                    <h3 className="text-2xl font-display mb-8 flex items-center gap-3">
                                        <AlertTriangle className="w-6 h-6" /> Risk Analysis
                                    </h3>
                                    <div className="space-y-4">
                                        {(results?.risks || []).map((risk, idx) => (
                                            <div key={idx} className="p-4 border border-border rounded-lg flex justify-between items-center group hover:border-text-muted transition-all">
                                                <div className="space-y-1">
                                                    <span className="text-sm font-medium block">{risk.title}</span>
                                                    <p className="text-[10px] text-text-muted">{risk.description}</p>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ml-4 ${
                                                    risk.severity === 'High' ? 'bg-accent-red/10 text-accent-red' : 
                                                    risk.severity === 'Medium' ? 'bg-accent-yellow/10 text-accent-yellow' : 
                                                    'bg-accent-blue/10 text-accent-blue'
                                                }`}>
                                                    {risk.severity}
                                                </span>
                                            </div>
                                        ))}
                                        {(!results?.risks || results.risks.length === 0) && (
                                            <p className="text-sm text-text-muted text-center py-4 italic">No significant risks identified.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-surface border border-border p-8 rounded-2xl">
                                    <h3 className="text-2xl font-display mb-8 flex items-center gap-3">
                                        <Briefcase className="w-6 h-6" /> Competitive Landscape
                                    </h3>
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-border text-text-muted uppercase text-[10px] tracking-widest">
                                                <th className="pb-4">Company</th>
                                                <th className="pb-4">Location</th>
                                                <th className="pb-4">Threat</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {(results?.competitors || []).slice(0, (() => {
                                                const plan = user?.plan?.toUpperCase() || 'EXPLORER';
                                                console.log('[DEBUG] Explore Page - User Plan:', plan, 'Total Competitors available:', results?.competitors?.length);
                                                if (plan === 'EXPLORER') return 3; // Show only 3 for Explorer
                                                if (plan === 'TRIAL') return 5;
                                                if (plan === 'SPRINT') return 6;
                                                if (plan === 'BOOST') return 8;
                                                if (plan === 'PRO') return 10;
                                                if (plan === 'PRO_PLUS') return 20;
                                                return 12;
                                            })()).map((c, idx) => (
                                                <tr key={idx} className="group hover:bg-surface-2">
                                                    <td className="py-4">
                                                        <div>
                                                            <p className="font-medium">{c.name}</p>
                                                            <p className="text-[10px] text-text-muted line-clamp-1">{c.description}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-text-secondary">{c.location}</td>
                                                    <td className="py-4">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                            c.threatLevel === 'HIGH' ? 'bg-accent-red/10 text-accent-red' : 
                                                            c.threatLevel === 'MEDIUM' ? 'bg-accent-yellow/10 text-accent-yellow' : 
                                                            'bg-accent-blue/10 text-accent-blue'
                                                        }`}>
                                                            {c.threatLevel}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {results?.competitors && results.competitors.length > (() => {
                                                const plan = user?.plan?.toUpperCase() || 'EXPLORER';
                                                if (plan === 'EXPLORER') return 3;
                                                if (plan === 'TRIAL') return 5;
                                                if (plan === 'SPRINT') return 6;
                                                if (plan === 'BOOST') return 8;
                                                if (plan === 'PRO') return 10;
                                                if (plan === 'PRO_PLUS') return 20;
                                                return 12;
                                            })() && (
                                                <tr>
                                                    <td colSpan={3} className="py-6 text-center">
                                                        <div className="bg-surface-2 p-4 rounded-xl border border-dashed border-border">
                                                            <p className="text-xs text-text-secondary mb-3">Upgrade to see all {(results.competitors.length - (() => {
                                                                const plan = user?.plan?.toUpperCase() || 'EXPLORER';
                                                                if (plan === 'EXPLORER') return 3;
                                                                if (plan === 'TRIAL') return 5;
                                                                if (plan === 'SPRINT') return 6;
                                                                if (plan === 'BOOST') return 8;
                                                                if (plan === 'PRO') return 10;
                                                                return 12;
                                                            })())} more competitors found via Google Maps.</p>
                                                            <Link href="/subscription" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest flex items-center justify-center gap-2">
                                                                <Crown className="w-3 h-3" /> Go Premium to Unlock All →
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {results?.competitors && results.competitors.length > 0 && results.competitors.length <= (() => {
                                                const plan = user?.plan?.toUpperCase() || 'EXPLORER';
                                                if (plan === 'EXPLORER') return 3;
                                                if (plan === 'TRIAL') return 5;
                                                if (plan === 'SPRINT') return 6;
                                                if (plan === 'BOOST') return 8;
                                                if (plan === 'PRO') return 10;
                                                if (plan === 'PRO_PLUS') return 20;
                                                return 12;
                                            })() && (
                                                <tr>
                                                    <td colSpan={3} className="py-4 text-center text-xs text-text-muted italic">
                                                        Only this much competitors found in this area.
                                                    </td>
                                                </tr>
                                            )}
                                            {(!results?.competitors || results.competitors.length === 0) && (
                                                <tr>
                                                    <td colSpan={3} className="py-8 text-center text-sm text-text-muted italic">No direct competitors found in this area. This might be a great opportunity to capture the market!</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.section>

                            <aside className="space-y-6 report-sidebar">
                                <div className="bg-primary text-background p-8 rounded-2xl relative print:bg-surface print:text-text-primary print:border print:border-border overflow-hidden group">
                                    <FileText className="w-48 h-48 text-background/5 absolute -top-10 -right-10 print:hidden transition-transform group-hover:scale-110 duration-700" />
                                    <h4 className="text-xl font-display mb-8 relative flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-surface/10 flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4 text-background" />
                                        </div>
                                        90-Day Execution Plan
                                    </h4>
                                    <div className="space-y-8 relative text-background">
                                        {(results?.actionPlan?.map((phase, pIdx) => (
                                            <div key={pIdx} className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="px-3 py-1 bg-surface/10 text-background text-[10px] uppercase font-bold tracking-widest rounded-full print:bg-primary/10 print:text-text-primary">
                                                        {phase.range}
                                                    </div>
                                                </div>
                                                
                                                <div className="border-l-2 border-white/20 ml-[15px] pl-6 py-2 space-y-4 print:border-border">
                                                    {(phase.estimatedBudget || phase.goal) && (
                                                        <div className="bg-surface/5 p-4 rounded-xl border border-white/10 space-y-2 mb-4 backdrop-blur-sm print:border-border">
                                                            {phase.estimatedBudget && (
                                                                <div className="flex items-start gap-2 text-xs">
                                                                    <span className="shrink-0 text-text-muted mt-0.5"><Briefcase className="w-3 h-3 text-background/50" /></span>
                                                                    <div>
                                                                        <span className="text-background/60 font-bold uppercase text-[9px] tracking-widest block mb-0.5 print:text-text-muted">Est. Budget</span>
                                                                        <span className="font-mono">{phase.estimatedBudget}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {phase.goal && (
                                                                <div className="flex items-start gap-2 text-xs">
                                                                    <span className="shrink-0 text-text-muted mt-0.5"><AlertTriangle className="w-3 h-3 text-background/50" /></span>
                                                                    <div>
                                                                        <span className="text-background/60 font-bold uppercase text-[9px] tracking-widest block mb-0.5 print:text-text-muted">Primary Goal</span>
                                                                        <span className="text-background/90">{phase.goal}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="space-y-3">
                                                        <span className="text-background/60 font-bold uppercase text-[9px] tracking-widest print:text-text-muted border-b border-white/10 pb-1 inline-block mb-2">Action Items</span>
                                                        {phase.tasks.map((task, tIdx) => (
                                                            <div key={tIdx} className="flex items-start gap-3 group/task">
                                                                <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center shrink-0 mt-0.5 group-hover/task:bg-accent-green group-hover/task:border-accent-green transition-colors print:border-border">
                                                                    <CheckCircle2 className="w-3 h-3 text-transparent group-hover/task:text-primary transition-colors" />
                                                                </div>
                                                                <p className="text-sm text-background/80 group-hover/task:text-background transition-colors leading-relaxed print:text-text-primary">{task}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )) || (
                                            <div className="text-center py-10 opacity-50 text-sm">
                                                Plan generation is available for valid reports.
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={handleDownloadReport}
                                        className="w-full mt-10 border border-white/20 py-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-surface hover:text-primary transition-all no-print flex items-center justify-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" /> Download Full Report
                                    </button>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-surface-2 rounded-xl border border-border no-print">
                                    <AlertTriangle className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-text-muted leading-relaxed">
                                        Starto AI provides strategic guidance based on available market data. Market conditions can rapidly change. Always verify critical decisions with professional advisors.
                                    </p>
                                </div>

                                <div className="bg-surface-2 border border-border p-6 rounded-2xl no-print">
                                    <h4 className="font-display mb-4">Need More Detail?</h4>
                                    <p className="text-xs text-text-secondary mb-6">Upgrade to Studio to unlock team access and unlimited real-time market data exports.</p>
                                    <Link href="/subscription" className="w-full py-3 bg-primary text-background border border-border rounded-md text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center">
                                        Upgrade Plan
                                    </Link>
                                </div>
                            </aside>
                        </div>
                    )}
                </main>
                <div className="no-print">
                    <MobileBottomNav />
                </div>
            </div>
            <AnimatePresence>
                {showUpgradeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-primary/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                        onClick={() => setShowUpgradeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            className="bg-surface rounded-[2rem] p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 p-20 bg-primary/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <Crown className="w-7 h-7 text-primary" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-display tracking-tight text-text-primary">AI Limit Reached</h3>
                                    <p className="text-sm text-text-muted">Upgrade to unlock more market intelligence</p>
                                </div>
                            </div>

                            <div className="p-6 bg-surface-2 rounded-2xl border border-border mb-8 space-y-4">
                                <p className="text-text-secondary text-sm leading-relaxed">
                                    You've reached the daily limit of AI Market Analysis for your current plan. 
                                    Premium plans include deeper insights, granular data, and unlimited strategy reports.
                                </p>
                                <div className="flex items-center gap-3 py-2">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Priority Access Available</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowUpgradeModal(false)}
                                    className="flex-1 border border-border py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-surface-2 transition-colors text-text-primary"
                                >
                                    Dismiss
                                </button>
                                <Link
                                    href="/subscription"
                                    className="flex-1 bg-primary text-background py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    View Plans
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
