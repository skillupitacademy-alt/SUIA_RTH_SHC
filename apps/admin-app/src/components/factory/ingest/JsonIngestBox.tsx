import React, { useState, useRef, useEffect } from 'react';
import { useFactory } from '@/context/FactoryContext';
import { Terminal, Import, AlertTriangle, CheckCircle2, Trash2, Zap, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function JsonIngestBox() {
    const { ingestRawJson, isIngesting, validationErrors, clearStage, stagedQuestions } = useFactory();
    const [rawJson, setRawJson] = useState('');
    const [errorInfo, setErrorInfo] = useState<{ line?: number; column?: number; message?: string } | null>(null);
    const router = useRouter();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);

    // Sync scroll between gutter and textarea
    const handleScroll = () => {
        if (textareaRef.current && gutterRef.current) {
            gutterRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    // Calculate line numbers
    const lineCount = rawJson.split('\n').length;
    const lineNumbers = Array.from({ length: Math.max(10, lineCount) }, (_, i) => i + 1);

    const handleIngest = () => {
        if (!rawJson.trim()) return;
        setErrorInfo(null);

        const success = ingestRawJson(rawJson);
        if (success) {
            router.push('/factory/question-generator/review');
        } else {
            // Attempt to extract line/column from the first error if it looks like a parsing error
            const parseError = validationErrors.find(e => e.includes('Parsing Error'));
            if (parseError) {
                const lineMatch = parseError.match(/line (\d+)/i);
                const colMatch = parseError.match(/column (\d+)/i);
                setErrorInfo({
                    line: lineMatch ? parseInt(lineMatch[1]) : undefined,
                    column: colMatch ? parseInt(colMatch[1]) : undefined,
                    message: parseError
                });
            }
        }
    };

    return (
        <div className="space-y-6 flex-1 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1 bg-[#FF4B91] rounded-full" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                        4. Surgical Ingestion (Auto-Healing)
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                        <Zap size={10} /> Healing Active
                    </div>
                    {validationErrors.length > 0 && (
                        <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100 animate-pulse">
                            <AlertTriangle size={12} /> {validationErrors.length} Schema Violations
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 relative group bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col">
                {/* Editor Header */}
                <div className="px-10 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-900 rounded-xl text-[#FF4B91]">
                            <FileJson size={20} />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-[#1A1A1A] italic">Payload Editor</h4>
                    </div>
                    {errorInfo?.line && (
                        <div className="text-[10px] font-black text-rose-500 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100 uppercase tracking-widest">
                            Error detected at Line {errorInfo.line}
                        </div>
                    )}
                </div>

                <div className="relative flex-1 bg-white flex overflow-hidden">
                    {/* Gutter */}
                    <div
                        ref={gutterRef}
                        className="w-16 bg-slate-50/50 border-r border-slate-100 flex flex-col items-center pt-8 text-[11px] font-mono text-slate-300 pointer-events-none select-none overflow-hidden"
                    >
                        {lineNumbers.map(n => (
                            <div
                                key={n}
                                className={cn(
                                    "h-[24px] flex items-center justify-center transition-colors",
                                    errorInfo?.line === n && "bg-rose-100 text-rose-500 font-bold w-full"
                                )}
                            >
                                {n}
                            </div>
                        ))}
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={rawJson}
                        onChange={(e) => setRawJson(e.target.value)}
                        onScroll={handleScroll}
                        placeholder="PASTE THE AI-GENERATED JSON PAYLOAD HERE..."
                        className="flex-1 p-8 bg-transparent text-sm font-mono text-slate-700 resize-none focus:outline-none custom-scrollbar selection:bg-[#FF4B91]/10 leading-[24px]"
                        spellCheck={false}
                    />
                </div>

                {/* Footer Action Bar */}
                <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] text-slate-800 font-black uppercase tracking-widest">
                            Surgical Extraction & Repair
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium italic">
                            Trailing commas, unquoted keys, and single-quotes are auto-healed.
                        </p>
                    </div>
                    <button
                        onClick={handleIngest}
                        disabled={!rawJson || isIngesting}
                        className={cn(
                            "px-10 py-4 rounded-xl flex items-center gap-3 font-black uppercase tracking-widest text-[11px] transition-all active:scale-95",
                            !rawJson || isIngesting
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-[#FF4B91] text-white shadow-xl shadow-[#FF4B91]/10 hover:bg-[#FF4B91]/90"
                        )}
                    >
                        <Import size={16} /> {isIngesting ? 'Processing...' : 'Process & Review'}
                    </button>
                </div>

                {/* Verification Overlay */}
                {validationErrors.length > 0 && (
                    <div className="max-h-[150px] overflow-y-auto bg-rose-50/80 backdrop-blur-sm border-t border-rose-100 p-6 flex flex-col gap-2 custom-scrollbar z-20">
                        {validationErrors.map((err, i) => (
                            <div key={i} className="flex items-center gap-2 text-rose-600 text-[10px] font-bold uppercase tracking-tight">
                                <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                                {err}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
