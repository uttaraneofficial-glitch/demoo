"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/feed/Sidebar'
import MobileNavigation from '@/components/feed/MobileNavigation'
import { promoCodesApi } from '@/lib/apiClient'
import { useAuthStore } from '@/store/useAuthStore'
import { 
    Ticket, 
    Plus, 
    Copy, 
    Check, 
    X, 
    Trash2, 
    Download, 
    Search, 
    ArrowUpDown, 
    Loader2, 
    AlertCircle,
    Calendar,
    Mail,
    UserCheck,
    ShieldCheck,
    UserCircle
} from 'lucide-react'
import { format } from 'date-fns'

const ADMIN_EMAIL = "krishnamurthikm07@gmail.com";

export default function PromoCodesPage() {
    const router = useRouter()
    const { isAuthenticated, user, loading: authLoading } = useAuthStore()
    const [codes, setCodes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [generateCount, setGenerateCount] = useState(10)
    const [generating, setGenerating] = useState(false)
    const [stats, setStats] = useState({ total: 0, used: 0, unused: 0, expired: 0 })
    const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' }>({ isVisible: false, message: '', type: 'success' });
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push('/auth')
                return
            }
            if (user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
                router.push('/feed')
                return
            }
            fetchData()
        }
    }, [isAuthenticated, user, authLoading, router])

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            const [codesRes, statsRes] = await Promise.all([
                promoCodesApi.getAll({ status: statusFilter !== 'ALL' ? statusFilter : undefined, search: searchQuery }),
                promoCodesApi.getStats()
            ])

            if (codesRes.error) {
                setError(codesRes.error)
            } else {
                setCodes(codesRes.data || [])
            }

            if (statsRes.data) {
                setStats(statsRes.data)
            }
        } catch (err: any) {
            setError(err.message || "Failed to load promo codes")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated && user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            fetchData()
        }
    }, [statusFilter, searchQuery])

    const handleGenerate = async () => {
        if (generateCount <= 0) return
        setGenerating(true)
        try {
            const res = await promoCodesApi.generate(generateCount)
            if (res.error) {
                showToast(res.error, 'error')
            } else {
                showToast(`Successfully generated ${generateCount} promo codes`, 'success')
                fetchData()
            }
        } catch (err: any) {
            showToast(err.message || "Failed to generate codes", 'error')
        } finally {
            setGenerating(false)
        }
    }

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await promoCodesApi.updateStatus(id, newStatus)
            if (res.error) {
                showToast(res.error, 'error')
            } else {
                showToast(`Status updated to ${newStatus}`, 'success')
                fetchData()
            }
        } catch (err: any) {
            showToast(err.message || "Failed to update status", 'error')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const res = await promoCodesApi.delete(id)
            if (res.error) {
                showToast(res.error, 'error')
            } else {
                showToast("Promo code deleted", 'success')
                fetchData()
            }
        } catch (err: any) {
            showToast(err.message || "Failed to delete promo code", 'error')
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        showToast("Copied to clipboard!", 'success')
    }

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ isVisible: true, message, type });
        setTimeout(() => setToast({ isVisible: false, message: '', type: 'success' }), 3000);
    }

    const exportToCSV = () => {
        const headers = ["Code", "Discount", "Status", "Used By", "Used At", "Created At"];
        const rows = codes.map(c => [
            c.code,
            `${c.discount}%`,
            c.status,
            c.usedBy?.email || '',
            c.usedAt ? format(new Date(c.usedAt), 'yyyy-MM-dd HH:mm') : '',
            c.createdAt ? format(new Date(c.createdAt), 'yyyy-MM-dd HH:mm') : ''
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `promo_codes_${format(new Date(), 'yyyyMMdd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (authLoading || (loading && codes.length === 0)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-text-muted animate-pulse font-medium uppercase tracking-widest text-[10px]">Verifying Credentials...</p>
                </div>
            </div>
        )
    }

    if (error && codes.length === 0) {
        return (
            <div className="min-h-screen bg-background flex justify-center">
                <div className="max-w-[1400px] w-full flex">
                    <MobileNavigation title="Admin Promo Codes" />
                <Sidebar />
                    <main className="flex-1 p-8 flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-display mb-2">Restricted Area</h1>
                            <p className="text-text-muted text-sm">{error}</p>
                        </div>
                        <button 
                            onClick={() => router.push('/feed')}
                            className="bg-primary text-background px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                        >
                            Return to Feed
                        </button>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-text-primary flex justify-center">
            <div className="max-w-[1400px] w-full flex flex-col md:flex-row mb-16 md:mb-0">
                <Sidebar />

                <main className="flex-1 w-full px-4 py-8 md:overflow-y-auto border-r border-border">
                    <header className="mb-10 flex flex-col gap-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheck className="w-4 h-4 text-primary" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Admin Control Center</span>
                                </div>
                                <h1 className="text-4xl font-display tracking-tight">Promo Codes</h1>
                                <p className="text-text-muted mt-2 text-sm">Manage one-time promo codes for beta users.</p>
                            </div>
                            
                            <div className="flex gap-4">
                                <div className="bg-surface border border-border px-6 py-3 rounded-2xl shadow-sm text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Total</p>
                                    <p className="text-2xl font-mono font-bold text-text-primary">{stats.total}</p>
                                </div>
                                <div className="bg-surface border border-border px-6 py-3 rounded-2xl shadow-sm text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Used</p>
                                    <p className="text-2xl font-mono font-bold text-text-primary">{stats.used}</p>
                                </div>
                                <div className="bg-surface border border-border px-6 py-3 rounded-2xl shadow-sm text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Unused</p>
                                    <p className="text-2xl font-mono font-bold text-text-primary">{stats.unused}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions & Filters */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex gap-2 items-center w-full md:w-auto">
                                <input
                                    type="number"
                                    value={generateCount}
                                    onChange={(e) => setGenerateCount(parseInt(e.target.value))}
                                    className="w-20 px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                                    min="1"
                                />
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="flex items-center gap-2 bg-primary text-background px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Generate
                                </button>
                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center gap-2 bg-surface border border-border text-text-primary px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-surface-2 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Export CSV
                                </button>
                            </div>

                            <div className="flex gap-4 items-center w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchQuery ? 'text-primary' : 'text-text-muted'}`} />
                                    <input
                                        type="text"
                                        placeholder="Search code..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-3 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="UNUSED">Unused</option>
                                    <option value="USED">Used</option>
                                    <option value="EXPIRED">Expired</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </header>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => router.push('/admin')}
                            className="px-6 py-2 bg-surface border border-border text-text-primary text-xs font-bold uppercase tracking-widest rounded-full hover:bg-surface-2 transition-colors"
                        >
                            Ecosystem Users
                        </button>
                        <button
                            onClick={() => router.push('/admin/promo-codes')}
                            className="px-6 py-2 bg-primary text-background text-xs font-bold uppercase tracking-widest rounded-full"
                        >
                            Promo Codes
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-2 border-b border-border">
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Code</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Discount</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Used By</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Created At</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {codes.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center text-text-muted">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Ticket className="w-10 h-10 opacity-20" />
                                                    <p className="text-sm">No promo codes found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        codes.map((c) => (
                                            <tr key={c.id} className="border-b border-border hover:bg-surface-2/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-sm text-text-primary">{c.code}</span>
                                                        <button 
                                                            onClick={() => copyToClipboard(c.code)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-2 rounded transition-all"
                                                        >
                                                            <Copy className="w-3 h-3 text-text-muted" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-sm font-medium text-text-primary">{c.discount}%</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${
                                                        c.status === 'UNUSED' ? 'bg-primary/10 text-primary border-primary/20' :
                                                        c.status === 'USED' ? 'bg-surface-2 text-text-secondary border-border' :
                                                        'bg-red-50 text-red-500 border-red-100'
                                                    }`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    {c.usedBy ? (
                                                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                            <Mail className="w-3 h-3 opacity-50" />
                                                            {c.usedBy.email}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-text-muted">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                        <Calendar className="w-3 h-3 opacity-50" />
                                                        {c.createdAt ? format(new Date(c.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {c.status === 'UNUSED' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(c.id, 'INACTIVE')}
                                                                className="p-1.5 hover:bg-surface-2 rounded-lg transition-colors text-text-muted hover:text-text-primary"
                                                                title="Deactivate"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {c.status === 'INACTIVE' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(c.id, 'UNUSED')}
                                                                className="p-1.5 hover:bg-surface-2 rounded-lg transition-colors text-text-muted hover:text-primary"
                                                                title="Activate"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {c.status === 'UNUSED' && (
                                                            <button
                                                                onClick={() => setDeleteModal({ isOpen: true, id: c.id })}
                                                                className="p-1.5 hover:bg-surface-2 rounded-lg transition-colors text-text-muted hover:text-text-primary"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <footer className="mt-8 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted opacity-30">Starto V3 Administrative Dashboard</p>
                    </footer>
                </main>

                
            </div>

            {/* Delete Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-primary/50 flex items-center justify-center z-50">
                    <div className="bg-surface p-8 rounded-2xl max-w-sm w-full text-center shadow-xl border border-border">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-background" />
                        </div>
                        <h3 className="text-xl font-display mb-2">Delete Promo Code</h3>
                        <p className="text-text-muted text-sm mb-6">Are you sure you want to delete this promo code? This action cannot be undone.</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, id: null })}
                                className="px-6 py-2 bg-surface border border-border text-text-primary text-xs font-bold uppercase tracking-widest rounded-full hover:bg-surface-2 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (deleteModal.id) {
                                        await handleDelete(deleteModal.id);
                                    }
                                    setDeleteModal({ isOpen: false, id: null });
                                }}
                                className="px-6 py-2 bg-primary text-background text-xs font-bold uppercase tracking-widest rounded-full hover:bg-primary/90 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.isVisible && (
                <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-lg border text-sm font-bold uppercase tracking-widest transition-all transform translate-y-0 ${
                    toast.type === 'success' ? 'bg-surface border-primary/20 text-primary' : 'bg-surface border-border text-text-muted'
                }`}>
                    {toast.message}
                </div>
            )}
        </div>
    )
}
