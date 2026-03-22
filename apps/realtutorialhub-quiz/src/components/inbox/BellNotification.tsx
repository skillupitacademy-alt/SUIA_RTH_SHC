"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useNotifications } from "./useNotifications";
import { cn } from "@/lib/utils";

export function BellNotification() {
    const { unreadCount } = useNotifications();

    return (
        <Link
            href="/dashboard/inbox"
            className="relative p-2 rounded-full hover:bg-slate-100 transition-colors group"
            aria-label={`${unreadCount} unread notifications`}
        >
            <Bell
                size={20}
                className={cn(
                    "text-slate-600 group-hover:text-primary transition-colors",
                    unreadCount > 0 && "animate-wiggle"
                )}
            />
            {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center p-0.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                </span>
            )}
        </Link>
    );
}
