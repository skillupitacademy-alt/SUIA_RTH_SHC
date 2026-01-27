'use client';

import { useState } from 'react';
import { Upload, FileJson, X, Check, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@quiz/api-client';

interface BulkUploadPanelProps {
    topicId: string;
    subtopicId: string | null;
    onSuccess: (count: number) => void;
    onError: (message: string) => void;
}

export function BulkUploadPanel({ topicId, subtopicId, onSuccess, onError }: BulkUploadPanelProps) {
    const [file, setFile] = useState<File | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
            onError('Please upload a valid JSON file.');
            return;
        }

        setFile(selectedFile);
        setIsParsing(true);

        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const content = event.target?.result as string;
                    const parsed = JSON.parse(content);

                    if (!Array.isArray(parsed)) {
                        throw new Error('JSON must be an array of questions.');
                    }

                    // Basic validation
                    const validated = parsed.map((q, idx) => {
                        if (!q.text && !q.questionText) throw new Error(`Question at index ${idx} is missing text.`);
                        if (!Array.isArray(q.options) || q.options.length < 2) throw new Error(`Question at index ${idx} must have at least 2 options.`);

                        // Ensure options have IDs for UI stability
                        q.options = q.options.map((o: any) => ({
                            ...o,
                            id: o.id || crypto.randomUUID()
                        }));

                        return q;
                    });

                    setQuestions(validated);
                } catch (err: any) {
                    onError(`Parsing Error: ${err.message}`);
                    setFile(null);
                } finally {
                    setIsParsing(false);
                }
            };
            reader.readAsText(selectedFile);
        } catch (err: any) {
            onError('Failed to read file.');
            setIsParsing(false);
        }
    };

    const handleUpload = async () => {
        if (!file || questions.length === 0) return;
        setIsUploading(true);

        try {
            const response = await apiClient.admin.bulkCreateQuestions({
                topicId,
                subtopicId: subtopicId || undefined,
                questions
            });

            onSuccess(response.count);
            setQuestions([]);
            setFile(null);
        } catch (err: any) {
            onError(err.message || 'Bulk upload failed.');
        } finally {
            setIsUploading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setQuestions([]);
    };

    return (
        <div className="space-y-6">
            {!file ? (
                <div className="relative">
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center bg-white/40 backdrop-blur-sm hover:border-[#FF4B91]/50 hover:bg-[#FF4B91]/5 transition-all group">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-inner">
                            <Upload className="w-8 h-8 text-slate-400 group-hover:text-[#FF4B91]" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 mb-2 uppercase tracking-tight">Drop JSON File Here</h4>
                        <p className="text-slate-500 text-sm font-medium">Or click to browse your computer for questions</p>
                        <div className="mt-6 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Format: JSON</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>Limit: 100 per file</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/40">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#FF4B91]/10 flex items-center justify-center">
                                <FileJson className="w-6 h-6 text-[#FF4B91]" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 tracking-tight">{file.name}</h4>
                                <p className="text-xs font-bold text-green-600 uppercase tracking-widest">{questions.length} questions detected</p>
                            </div>
                        </div>
                        <button onClick={clearFile} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto p-6 space-y-4">
                        {questions.slice(0, 5).map((q, idx) => (
                            <div key={idx} className="p-4 bg-white/60 rounded-2xl border border-slate-100 flex items-start gap-4">
                                <span className="w-6 h-6 rounded-lg bg-slate-100 text-[10px] font-black flex items-center justify-center text-slate-500">{idx + 1}</span>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-800 line-clamp-1">{q.text || q.questionText}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black uppercase text-slate-400">{q.difficulty || 'intermediate'}</span>
                                        <span className="text-[10px] font-black uppercase text-slate-400">{q.options.length} options</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {questions.length > 5 && (
                            <div className="text-center py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                + {questions.length - 5} more questions
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50/50 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={handleUpload}
                            disabled={isUploading || questions.length === 0}
                            className="flex items-center gap-3 px-8 py-4 bg-[#FF4B91] hover:bg-[#ff3382] text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-[#FF4B91]/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isUploading ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" /> Finalize & Upload All
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h5 className="text-sm font-bold text-blue-900">Pro Tip</h5>
                    <p className="text-xs text-blue-700/80 font-medium leading-relaxed">
                        The bulk uploader automatically maps your questions to the selected topic. Use the standard JSON schema to ensure high reliability.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default BulkUploadPanel;
