'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Search, Filter, MoreVertical, Edit2, Trash2,
    CheckCircle2, XCircle, Shield, UserPlus, Mail,
    Crown, UserCheck, Ban, ArrowUpDown, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    useEffect(() => {
        async function fetchUsers() {
            try {
                const query = new URLSearchParams();
                if (search) query.append('q', search);
                if (roleFilter) query.append('role', roleFilter);

                const res = await fetch(`/api/admin/users?${query.toString()}`);
                const data = await res.json();
                if (res.ok) setUsers(data);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchUsers();
    }, [search, roleFilter]);

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            if (res.ok) setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    const toggleSuspension = async (user: any) => {
        // Mock logic for now as we don't have a 'status' field in schema yet
        // We can repurpose role or add a field if needed in future
        alert('Suspension logic would go here (requires schema update for status field)');
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display">User Management</h1>
                    <p className="text-muted-foreground mt-1">Manage platform users, roles, and subscriptions.</p>
                </div>
                <Link href="/admin/users/new" className="btn-primary py-2 text-sm">
                    <UserPlus className="w-4 h-4" />
                    Add User
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="input-base pl-10 w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="input-base text-sm h-full px-4"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="USER">User</option>
                    </select>
                    <button className="btn-secondary h-full px-4">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* User Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/8 bg-white/2">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stats</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Joined</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/4">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ) : users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/2 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                                {user.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{user.name || 'N/A'}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={cn(
                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                            user.role === 'ADMIN' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                user.role === 'MANAGER' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                    "bg-green-500/10 text-green-400 border-green-500/20"
                                        )}>
                                            {user.role === 'ADMIN' ? <Shield className="w-2.5 h-2.5" /> : null}
                                            {user.role}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                user.subscription?.plan === 'AGENCY' ? "bg-purple-400" :
                                                    user.subscription?.plan === 'PRO' ? "bg-accent-400" :
                                                        "bg-muted-foreground/30"
                                            )} />
                                            <span className="text-xs font-medium text-foreground">{user.subscription?.plan || 'FREE'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Globe className="w-3 h-3" /> {user.websites?.length || 0} Sites
                                            </span>
                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> 0 Audits
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                href={`/admin/users/${user.id}`}
                                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                                                title="Edit User"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Link>
                                            <button
                                                onClick={() => toggleSuspension(user)}
                                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-yellow-500/20 text-muted-foreground hover:text-yellow-400 transition-all"
                                                title="Suspend/Activate"
                                            >
                                                <Ban className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-white/8 bg-white/2 flex items-center justify-between text-xs text-muted-foreground">
                    <p>Showing {users.length} users</p>
                    <div className="flex gap-2">
                        <button className="px-2 py-1 rounded border border-white/8 hover:bg-white/5 disabled:opacity-50" disabled>Previous</button>
                        <button className="px-2 py-1 rounded border border-white/8 hover:bg-white/5 disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
