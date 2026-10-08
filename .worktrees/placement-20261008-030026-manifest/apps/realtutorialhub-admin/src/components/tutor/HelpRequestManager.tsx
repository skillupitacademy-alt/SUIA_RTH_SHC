'use client';

import { apiClient } from "@quiz/api-client";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, Calendar, CheckCircle2, Clock, MessageSquare, User, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { clientLogger } from "@/utils/clientLogger";

type HelpRequest = {
    id: string;
    status: string;
    priority: string;
    createdAt: string;
    email: string;
    userName: string;
    topicName: string;
    metadata?: { accuracy?: number; adminNote?: string };
};

export function HelpRequestManager() {
    const [requests, setRequests] = useState<HelpRequest[]>([]);
    const [status, setStatus] = useState("pending");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const hasError = typeof error === "string" && error.length > 0;
    const isUpdating = typeof updating === "string" && updating.length > 0;
    const [adminNote, setAdminNote] = useState("");
    const [activePrompt, setActivePrompt] = useState<{ id: string; status: string } | null>(null);
    const promptId = activePrompt?.id ?? "";
    const promptStatus = activePrompt?.status ?? "pending";

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            apiClient.client.setPortalIdentity("admin");
            const data = await apiClient.client.get<{ requests: HelpRequest[] }>(`/admin/tutor/help/list?status=${status}`);
            setRequests(data.requests);
        } catch (err) {
            clientLogger.error("Failed to fetch help requests", { error: err instanceof Error ? err.message : "unknown" });
            setError("Unable to load tutor help requests right now.");
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        void fetchRequests();
    }, [fetchRequests]);

    const updateStatus = async (requestId: string, nextStatus: string, note?: string) => {
        setUpdating(requestId);
        try {
            apiClient.client.setPortalIdentity("admin");
            await apiClient.client.patch<{ success: boolean }, { requestId: string; status: string; note?: string }>(
                "/admin/tutor/help/list",
                { requestId, status: nextStatus, note },
            );
            setRequests((prev) => prev.filter((r) => r.id !== requestId));
            setActivePrompt(null);
            setAdminNote("");
            setError(null);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "unknown";
            clientLogger.error("Failed to update request status", { error: msg });
            setError(msg);
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Action Prompt Overlay (Modal style) */}
            {promptId.length > 0 && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Tutor Intervention</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Transitioning to {promptStatus}</p>
                                </div>
                            </div>
                            <button onClick={() => { setActivePrompt(null); setAdminNote(""); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="admin-note"
                                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block"
                                >
                                    Resolution Note
                                </label>
                                <textarea
                                    id="admin-note"
                                    placeholder="Briefly describe the intervention logic or next steps..."
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all min-h-[140px] resize-none"
                                />
                            </div>

                            <button
                                disabled={isUpdating || promptId.length === 0}
                                onClick={() => void updateStatus(promptId, promptStatus, adminNote)}
                                className="w-full bg-primary text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {isUpdating ? "Processing..." : `Confirm ${promptStatus}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            {hasError ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold">
                    {error}
                </div>
            ) : null}

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

                                {typeof request.metadata?.accuracy === "number" && (
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
                                {status === "pending" ? (
                                    <>
                                        <button
                                            disabled={updating !== null}
                                            onClick={() => setActivePrompt({ id: request.id, status: "scheduled" })}
                                            className="flex-1 bg-primary text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Calendar size={12} />
                                            Schedule
                                        </button>
                                        <button
                                            disabled={updating !== null}
                                            onClick={() => setActivePrompt({ id: request.id, status: "resolved" })}
                                            className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={12} />
                                            Solve
                                        </button>
                                    </>
                                ) : status === "scheduled" ? (
                                    <button
                                        disabled={updating !== null}
                                        onClick={() => setActivePrompt({ id: request.id, status: "resolved" })}
                                        className="flex-1 bg-green-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={12} />
                                        Mark Resolved
                                    </button>
                                ) : (
                                    <div className="flex-1 flex items-center gap-2 text-green-500 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest justify-center">
                                        <CheckCircle2 size={12} />
                                        Resolved
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
