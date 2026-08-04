"use client";

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { eventStartupsApi } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AdminEventsPage() {
    const { isAuthenticated, user, isAuthReady } = useAuthStore();
    const router = useRouter();
    const [startups, setStartups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [editing, setEditing] = useState<any>(null); // null means adding new or not editing

    useEffect(() => {
        if (!isAuthReady) return;
        if (!isAuthenticated || !user || user.email !== 'krishnamurthikm07@gmail.com') {
            router.push('/');
            return;
        }
        loadStartups();
    }, [isAuthReady, isAuthenticated, user]);

    const loadStartups = async () => {
        try {
            const data = await eventStartupsApi.getAll();
            setStartups(data);
        } catch (error: any) {
            toast.error('Failed to load startups: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this startup?')) return;
        try {
            await eventStartupsApi.delete(id);
            toast.success('Deleted successfully');
            loadStartups();
        } catch (error: any) {
            toast.error('Failed to delete: ' + error.message);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editing.id) {
                await eventStartupsApi.update(editing.id, editing);
                toast.success('Updated successfully');
            } else {
                await eventStartupsApi.create(editing);
                toast.success('Created successfully');
            }
            setEditing(null);
            loadStartups();
        } catch (error: any) {
            toast.error('Failed to save: ' + error.message);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 pt-24">
            <h1 className="text-3xl font-bold mb-8">SARATHI 2047 - Admin Panel</h1>

            {editing ? (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                    <h2 className="text-xl font-semibold mb-4">{editing.id ? 'Edit Startup' : 'Add New Startup'}</h2>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input required className="w-full border p-2 rounded" value={editing.name || ''} onChange={e => setEditing({...editing, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Slug</label>
                            <input required className="w-full border p-2 rounded" value={editing.slug || ''} onChange={e => setEditing({...editing, slug: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Industry</label>
                            <input required className="w-full border p-2 rounded" value={editing.industry || ''} onChange={e => setEditing({...editing, industry: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">City</label>
                            <input required className="w-full border p-2 rounded" value={editing.city || ''} onChange={e => setEditing({...editing, city: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Tagline</label>
                            <input required className="w-full border p-2 rounded" value={editing.tagline || ''} onChange={e => setEditing({...editing, tagline: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Mission</label>
                            <textarea required className="w-full border p-2 rounded h-24" value={editing.mission || ''} onChange={e => setEditing({...editing, mission: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Viksit Bharat Contribution</label>
                            <textarea required className="w-full border p-2 rounded h-24" value={editing.viksitBharatContribution || ''} onChange={e => setEditing({...editing, viksitBharatContribution: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Website URL</label>
                            <input required className="w-full border p-2 rounded" value={editing.website || ''} onChange={e => setEditing({...editing, website: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Logo URL</label>
                            <input required className="w-full border p-2 rounded" value={editing.logoUrl || ''} onChange={e => setEditing({...editing, logoUrl: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Cover Image URL</label>
                            <input required className="w-full border p-2 rounded" value={editing.coverUrl || ''} onChange={e => setEditing({...editing, coverUrl: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 flex gap-4 mt-4">
                            <button type="submit" className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800">Save Startup</button>
                            <button type="button" onClick={() => setEditing(null)} className="border border-gray-300 px-6 py-2 rounded-full font-medium hover:bg-gray-50">Cancel</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="mb-6 flex justify-end">
                    <button onClick={() => setEditing({})} className="bg-black text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800">
                        + Add Startup
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                            <th className="p-4 font-medium text-gray-600">Logo</th>
                            <th className="p-4 font-medium text-gray-600">Name</th>
                            <th className="p-4 font-medium text-gray-600">Industry</th>
                            <th className="p-4 font-medium text-gray-600">City</th>
                            <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {startups.map((s) => (
                            <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-4">
                                    <img src={s.logoUrl} alt={s.name} className="w-10 h-10 rounded-md object-cover border" />
                                </td>
                                <td className="p-4 font-medium">{s.name}</td>
                                <td className="p-4 text-gray-600">{s.industry}</td>
                                <td className="p-4 text-gray-600">{s.city}</td>
                                <td className="p-4 text-right flex justify-end gap-3">
                                    <button onClick={() => setEditing(s)} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
                                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline text-sm font-medium">Delete</button>
                                </td>
                            </tr>
                        ))}
                        {startups.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">No startups found. Add one above.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
