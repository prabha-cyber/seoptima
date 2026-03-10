'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

type Notification = {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
    link?: string;
};

export function NotificationsDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Option to poll every 60s
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markAllRead' })
            });
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const handleMarkRead = async (id: string, currentRead: boolean) => {
        if (currentRead) return;
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markRead', notificationId: id })
            });
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const getIconColor = (type: string) => {
        switch (type.toUpperCase()) {
            case 'SUCCESS': return 'text-green-400 bg-green-400/10';
            case 'WARNING': return 'text-amber-400 bg-amber-400/10';
            case 'ERROR': return 'text-red-400 bg-red-400/10';
            default: return 'text-brand-400 bg-brand-400/10';
        }
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors focus:outline-none">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-background" />
                    )}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 w-80 rounded-xl border border-white/10 bg-surface/95 backdrop-blur-xl shadow-2xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="bg-brand-500/20 text-brand-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                                <Check className="w-3 h-3" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[360px] overflow-y-auto custom-scroll py-2">
                        {isLoading ? (
                            <div className="flex justify-center p-4">
                                <span className="w-5 h-5 border-2 border-white/10 border-t-brand-500 rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-muted-foreground">
                                    <Bell className="w-5 h-5 opacity-50" />
                                </div>
                                <p className="text-sm font-medium text-foreground/80">All caught up!</p>
                                <p className="text-xs text-muted-foreground mt-1">Check back later for new alerts.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map((notification) => (
                                    <DropdownMenu.Item
                                        key={notification.id}
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            handleMarkRead(notification.id, notification.read);
                                        }}
                                        className={`flex gap-3 p-3 mx-2 rounded-lg cursor-pointer transition-colors outline-none
                                            ${notification.read ? 'hover:bg-white/5 opacity-70' : 'bg-white/5 hover:bg-white/10'}`}
                                    >
                                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getIconColor(notification.type)}`}>
                                            <Bell className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm tracking-tight leading-snug mb-1 ${notification.read ? 'text-foreground/90 font-medium' : 'text-foreground font-semibold'}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <div className="w-2 h-2 rounded-full bg-brand-500 mt-1 shrink-0" />
                                        )}
                                    </DropdownMenu.Item>
                                ))}
                            </div>
                        )}
                    </div>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
