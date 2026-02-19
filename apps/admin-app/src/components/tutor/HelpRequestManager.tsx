'use client';
/* eslint-disable simple-import-sort/imports */

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Calendar, BookOpen, CheckCircle2, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

type HelpRequest = {
    id: string;
    status: string;
    priority: string;
    createdAt: string;
    email: string;
    userName: string;
    topicName: string;
    metadata?: { accuracy?: number };
};

export function HelpRequestManager() {
    const [requests, setRequests] = useState<HelpRequest[]>([]);
    const [status, setStatus] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/tutor/help/list?status=${status}`);
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests);
            }
        } catch (err) {
            console.error("Failed to fetch help requests", err);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        void fetchRequests();
    }, [fetchRequests]);

    const updateStatus = async (requestId: string, nextStatus: string) => {
        setUpdating(requestId);
        try {
            const res = await fetch('/api/admin/tutor/help/list', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status: nextStatus })
            });
            if (res.ok) {
                setRequests(requests.filter(r => r.id !== requestId));
            }
        } catch (err) {
            console.error("Failed to update status", err);
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center p-1 rounded-xl bg-slate-50 border border-slate-100 gap-1">
                    {["pending", "scheduled", "resolved"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                status === s
                                    ? "bg-white text-primary shadow-sm ring-1 ring-slate-200"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {requests.length} Requests Found
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-[2rem] bg-slate-50 animate-pulse border border-slate-100" />
                    ))}
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                    <CheckCircle2 className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No {status} requests</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requests.map((request) => (
                        <div
                            key={request.id}
                            className={cn(
                                "p-6 rounded-[2rem] bg-white border border-slate-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden",
                                request.priority === 'high' && "border-l-4 border-l-rose-500"
                            )}
                        >
                            {request.priority === 'high' && (
                                <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl">
                                    Urgent
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900">{request.userName || 'Anonymous Student'}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{request.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <BookOpen size={14} className="text-slate-400" />
                                        <span className="text-xs font-bold">{request.topicName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Clock size={14} className="text-slate-400" />
                                        <span className="text-xs font-bold">
                                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>

                                {request.metadata?.accuracy !== undefined && (
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Accuracy</span>
                                            <span className={cn(
                                                "text-[9px] font-black px-1.5 py-0.5 rounded",
                                                request.metadata.accuracy < 50 ? "bg-rose-100 text-rose-600" : "bg-orange-100 text-orange-600"
                                            )}>
                                                {request.metadata.accuracy}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500",
                                                    request.metadata.accuracy < 50 ? "bg-rose-500" : "bg-orange-500"
                                                )}
                                                style={{ width: `${request.metadata.accuracy}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                        {status === "pending" && (
                            <>
                                <button
                                    disabled={updating === request.id}
                                    onClick={() => void updateStatus(request.id, "scheduled")}
                                    className="flex-1 bg-primary text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    <Calendar size={12} />
                                    Schedule
                                </button>
                                <button
                                    disabled={updating === request.id}
                                    onClick={() => void updateStatus(request.id, "resolved")}
                                    className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={12} />
                                    Solve
                                </button>
                            </>
                        )}
                        {status === "scheduled" && (
                            <button
                                disabled={updating === request.id}
                                onClick={() => void updateStatus(request.id, "resolved")}
                                className="flex-1 bg-green-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={12} />
                                Mark Resolved
                            </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
