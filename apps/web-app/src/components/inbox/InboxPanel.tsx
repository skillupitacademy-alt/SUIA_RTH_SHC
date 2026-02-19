"use client";

import { formatDistanceToNow } from "date-fns";
import { BookOpen, Check, Mail, Sparkles, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import { Notification, useNotifications } from "./useNotifications";

const typeIcons: Record<string, React.ComponentType<{ size?: number }>> = {
    notes_sent: Mail,
    level_up: Trophy,
    live_session: Sparkles,
    system: BookOpen,
};

const filterOptions = [
    { label: "All", value: null },
    { label: "Notes", value: "notes_sent" },
    { label: "Levels", value: "level_up" },
    { label: "System", value: "system" },
];

export function NotificationItem({
    item,
    onRead
}: {
    item: Notification;
    onRead: (id: string) => void;
}) {
    const Icon = typeIcons[item.type] || BookOpen;

    return (
        <button
            className={cn(
                "w-full text-left p-4 rounded-2xl border transition-all duration-300 flex gap-4 group",
                item.isRead
                    ? "bg-white border-slate-100 opacity-75"
                    : "bg-white border-primary/20 shadow-sm shadow-primary/5 hover:border-primary/40 ring-1 ring-primary/5"
            )}
            onClick={() => !item.isRead && onRead(item.id)}
        >
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                item.isRead ? "bg-slate-50 text-slate-400" : "bg-primary/10 text-primary"
            )}>
                <Icon size={20} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                    <h4 className={cn(
                        "text-sm font-bold truncate",
                        item.isRead ? "text-slate-600" : "text-slate-900"
                    )}>
                        {item.title}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap mt-1">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                </div>

                <p className={cn(
                    "text-xs mt-1 leading-relaxed",
                    item.isRead ? "text-slate-500" : "text-slate-700 font-medium"
                )}>
                    {item.message}
                </p>

                {item.actionUrl && (
                    <a
                        href={item.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-primary mt-3 hover:underline"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRead(item.id);
                        }}
                    >
                        Study Resource <Sparkles size={10} />
                    </a>
                )}
            </div>

            {!item.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shadow-sm shadow-primary/50" />
            )}
        </button>
    );
}

export function InboxPanel() {
    const { notifications, loading, filterType, setFilterType, markAsRead, markAllAsRead } = useNotifications();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Your Inbox</h3>
                <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                >
                    <Check size={12} /> Mark all read
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-50 border border-slate-100 gap-1 overflow-x-auto no-scrollbar">
                {filterOptions.map((opt) => (
                    <button
                        key={opt.label}
                        onClick={() => setFilterType(opt.value)}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                            filterType === opt.value
                                ? "bg-white text-primary shadow-sm ring-1 ring-slate-200"
                                : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 w-full bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                        <Mail size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No messages found</h3>
                    <p className="text-sm text-slate-500 max-w-[240px] mt-1 font-medium">
                        {filterType
                            ? `You don't have any ${filterType.replace('_', ' ')} messages.`
                            : "Your personalized study hub is empty."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((item) => (
                        <NotificationItem
                            key={item.id}
                            item={item}
                            onRead={markAsRead}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
