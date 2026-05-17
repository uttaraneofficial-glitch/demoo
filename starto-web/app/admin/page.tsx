"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/feed/Sidebar'
import MobileBottomNav from '@/components/feed/MobileBottomNav'
import { adminApi } from '@/lib/apiClient'
import { useAuthStore } from '@/store/useAuthStore'
import { 
    Users, 
    Search, 
    ArrowUpDown, 
    UserCheck, 
    Mail, 
    Phone, 
    ShieldCheck, 
    Loader2, 
    AlertCircle,
    UserCircle,
    Calendar,
    Briefcase
} from 'lucide-react'
import { format } from 'date-fns'

const ADMIN_EMAIL = "krishnamurthikm07@gmail.com";

export default function AdminDashboard() {
    const router = useRouter()
    const { isAuthenticated, user, isLoading } = useAuthStore()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [stats, setStats] = useState({ totalUsers: 0 })

    useEffect(() => {
    if (!isAuthenticated) {
        router.push('/auth')
        return
    }
    if (user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        router.push('/feed')
        return
    }
    fetchData()
}, [isAuthenticated, user, router])

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            const [usersRes, statsRes] = await Promise.all([
                adminApi.getUsers(),
                adminApi.getStats()
            ])

            if (usersRes.error) {
                setError(usersRes.error)
            } else {
                setUsers(usersRes.data || [])
            }

            if (statsRes.data) {
                setStats(statsRes.data)
            }
        } catch (err: any) {
            setError(err.message || "Failed to load admin data")
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(u => 
        (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         u.phone?.includes(searchQuery))
    )

    if (loading && users.length === 0) { {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-text-muted animate-pulse font-medium uppercase tracking-widest text-[10px]">Verifying Credentials...</p>
                </div>
            </div>
        )
    }

    if (error && users.length === 0) {
        return (
            <div className="min-h-screen bg-background flex justify-center">
                <div className="max-w-[1400px] w-full flex">
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
                            className="bg-black text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest"
                        >
                            Return to Feed
                        </button>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F5F4F0] text-black flex justify-center">
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
                                <h1 className="text-4xl font-display tracking-tight">Ecosystem Users</h1>
                                <p className="text-text-muted mt-2 text-sm">Managing the heart of Starto V3 network.</p>
                            </div>
                            
                            <div className="bg-white border border-border px-6 py-3 rounded-2xl shadow-sm text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Total Users</p>
                                <p className="text-2xl font-mono font-bold text-black">{stats.totalUsers}</p>
                            </div>
                        </div>

                        <div className="relative group">
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${searchQuery ? 'text-primary' : 'text-text-muted'}`} />
                            <input
                                type="text"
                                placeholder="Search by name, username, email or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-2xl text-sm focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                            />
                        </div>
                    </header>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => router.push('/admin')}
                            className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-full"
                        >
                            Ecosystem Users
                        </button>
                        <button
                            onClick={() => router.push('/admin/promo-codes')}
                            className="px-6 py-2 bg-white border border-border text-black text-xs font-bold uppercase tracking-widest rounded-full hover:bg-gray-50 transition-colors"
                        >
                            Promo Codes
                        </button>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-border">
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">User</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Contact Info</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Role & Plan</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Joined Date</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-text-muted">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Users className="w-10 h-10 opacity-20" />
                                                    <p className="text-sm">No users found matching your search.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((u) => (
                                            <tr key={u.id} className="border-b border-border hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-border overflow-hidden">
                                                            {u.avatarUrl ? (
                                                                <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <UserCircle className="w-6 h-6 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <p className="font-bold text-sm text-black group-hover:text-primary transition-colors">{u.name}</p>
                                                                {u.isVerified && <ShieldCheck className="w-3 h-3 text-primary" />}
                                                            </div>
                                                            <p className="text-[11px] text-text-muted">@{u.username}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                            <Mail className="w-3 h-3 opacity-50" />
                                                            {u.email}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                            <Phone className="w-3 h-3 opacity-50" />
                                                            {u.phone || 'No phone'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-black uppercase tracking-wider">
                                                            <Briefcase className="w-3 h-3 opacity-50" />
                                                            {u.role}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${
                                                                u.plan === 'EXPLORER' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-primary/10 text-primary border-primary/20'
                                                            }`}>
                                                                {u.plan}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                                        <Calendar className="w-3 h-3 opacity-50" />
                                                        {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <span className={`inline-block w-2 h-2 rounded-full ${u.isOnline ? 'bg-primary animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.1)]' : 'bg-gray-300'}`} />
                                                    <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                                                        {u.isOnline ? 'Active' : 'Offline'}
                                                    </span>
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

                <MobileBottomNav />
            </div>
        </div>
    )
  }
}
