'use client';

import { useEffect, useState } from 'react';
import { Mail, Bell, Clock, MoreVertical, Archive, CheckCircle2, Loader2, Info } from 'lucide-react';
import { apiClient } from '@quiz/api-client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export default function InboxPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInbox = async () => {
            try {
                const data = await apiClient.dashboard.getNotifications();
                setNotifications(data);
            } catch (err) {
                console.error('Failed to fetch inbox', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInbox();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-pink-500 mb-4" size={48} />
                <p className="text-gray-500 font-bold tracking-tight uppercase">Accessing secure communications...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">MISSION CONTROL INBOX</h1>
                    <p className="text-gray-500 font-semibold mt-1 uppercase tracking-widest text-xs flex items-center gap-2">
                        <Bell size={14} className="text-pink-500" /> Secure authenticated dispatch center
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="px-6 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors">
                        Mark all read
                    </button>
                </div>
            </div>

            <div className="max-w-4xl space-y-4">
                {notifications.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                            <Mail size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Your inbox is clear</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">
                            Any study notes you request or system updates will appear here. Start a mission to get personalized feedback!
                        </p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={cn(
                                "group relative bg-white p-6 rounded-[2rem] border-2 transition-all hover:shadow-xl hover:shadow-pink-500/5",
                                notif.isRead ? "border-gray-100" : "border-pink-200 bg-pink-50/10"
                            )}
                        >
                            {!notif.isRead && (
                                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-12 bg-pink-500 rounded-r-full shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
                            )}

                            <div className="flex gap-6">
                                <div className={cn(
                                    "shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center",
                                    notif.type === 'notes_sent' ? "bg-indigo-100 text-indigo-600" : "bg-pink-100 text-pink-600"
                                )}>
                                    {notif.type === 'notes_sent' ? <CheckCircle2 size={24} /> : <Info size={24} />}
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight">{notif.title}</h3>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                                            <Clock size={12} />
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 font-medium leading-relaxed">
                                        {notif.message}
                                    </p>

                                    <div className="flex items-center gap-4 pt-4 mt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="text-xs font-black uppercase text-pink-600 hover:underline">View Details</button>
                                        <button className="text-xs font-black uppercase text-gray-400 hover:text-gray-600 flex items-center gap-1">
                                            <Archive size={12} /> Archive
                                        </button>
                                        <button className="ml-auto text-gray-300 hover:text-gray-600">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
