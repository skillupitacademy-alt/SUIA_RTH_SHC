'use client';

import React, { useState } from 'react';
import { useFactory } from '@/context/FactoryContext';
import { Terminal, Import, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function JsonIngestBox() {
    const { ingestRawJson, isIngesting, validationErrors, clearStage, stagedQuestions } = useFactory();
    const [rawJson, setRawJson] = useState('');

    const handleIngest = () => {
        if (!rawJson.trim()) return;
        ingestRawJson(rawJson);
    };

    if (stagedQuestions.length > 0) {
        return (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2.5rem] p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-800 tracking-tight">Stage Populated</h4>
                        <p className="text-xs text-slate-500 font-medium italic">
                            {stagedQuestions.length} Questions ready for Review & Ingestion
                        </p>
                    </div>
                </div>
                <button
                    onClick={clearStage}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-400 font-bold text-[11px] uppercase tracking-widest hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95"
                >
                    <Trash2 size={14} /> Clear Batch
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 flex-1 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1 bg-[#FF4B91] rounded-full" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                        4. Intelligence Ingestion (Phase 2)
                    </h3>
                </div>
                {validationErrors.length > 0 && (
                    <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full animate-bounce">
                        <AlertTriangle size={12} /> {validationErrors.length} Schema Violations
                    </div>
                )}
            </div>

            <div className="flex-1 relative group bg-white border-2 border-dashed border-primary/20 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col">
                {/* Header */}
                <div className="px-10 py-5 border-b border-primary/5 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-900 rounded-xl text-[#FF4B91]">
                            <Terminal size={20} />
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-widest text-[#1A1A1A] italic">Payload Ingestor</h4>
                    </div>
                </div>

                <div className="relative flex-1 bg-slate-50/30 flex flex-col">
                    <textarea
                        value={rawJson}
                        onChange={(e) => setRawJson(e.target.value)}
                        placeholder="PASTE THE AI-GENERATED JSON PAYLOAD HERE..."
                        className="flex-1 w-full p-10 bg-transparent text-sm font-mono text-slate-700 resize-none focus:outline-none custom-scrollbar selection:bg-[#FF4B91]/10 leading-relaxed"
                        spellCheck={false}
                    />

                    {/* Action Bar */}
                    <div className="px-10 py-6 border-t border-slate-100 bg-white flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[250px]">
                            Extracts JSON from conversational text automatically.
                        </p>
                        <button
                            onClick={handleIngest}
                            disabled={!rawJson || isIngesting}
                            className={cn(
                                "px-10 py-4 rounded-xl flex items-center gap-3 font-black uppercase tracking-widest text-[11px] transition-all active:scale-95",
                                !rawJson || isIngesting
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-slate-900 text-white shadow-xl hover:bg-black"
                            )}
                        >
                            <Import size={16} /> {isIngesting ? 'Validating...' : 'Ingest & Parse'}
                        </button>
                    </div>
                </div>

                {/* Verification Overlay */}
                {validationErrors.length > 0 && (
                    <div className="absolute inset-x-0 bottom-[88px] max-h-[150px] overflow-y-auto bg-rose-50 border-t border-rose-100 p-6 flex flex-col gap-2 custom-scrollbar z-20">
                        {validationErrors.map((err, i) => (
                            <div key={i} className="flex items-center gap-2 text-rose-600 text-[10px] font-bold uppercase tracking-tight">
                                <div className="w-1 h-1 bg-rose-400 rounded-full" />
                                {err}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
