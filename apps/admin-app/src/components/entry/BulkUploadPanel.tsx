'use client';

import { useState } from 'react';
import { Upload, FileJson, X, Check, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@quiz/api-client';

interface BulkUploadPanelProps {
    topicId: string;
    subtopicId: string | null;
    skillIds: string[];
    onSuccess: (count: number) => void;
    onError: (message: string) => void;
}

export function BulkUploadPanel({ topicId, subtopicId, skillIds, onSuccess, onError }: BulkUploadPanelProps) {
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
        if (!topicId) return;

        setIsUploading(true);

        try {
            await apiClient.admin.bulkCreateQuestions({
                topicId,
                subtopicId: subtopicId || undefined,
                skillIds: skillIds.length > 0 ? skillIds : undefined,
                questions
            });

            onSuccess(questions.length);
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 border border-slate-100 rounded-3xl p-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[#1A1A1A]">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                            <FileJson className="w-5 h-5" />
                        </div>
                        <h5 className="font-black text-sm uppercase tracking-widest">JSON Schema Guide</h5>
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-4 overflow-x-auto">
                        <pre className="text-[10px] text-blue-400 font-mono leading-relaxed">
                            {`[
  {
    "text": "Identify the primary function of a database index.",
    "difficulty": "intermediate",
    "skillIds": ["skill_uuid_1", "skill_uuid_2"],
    "options": [
      { "text": "Speed up data retrieval", "isCorrect": true },
      { "text": "Reduce disk space", "isCorrect": false }
    ],
    "explanation": "Indexes improve query performance..."
  }
]`}
                        </pre>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[#1A1A1A]">
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <h5 className="font-black text-sm uppercase tracking-widest">Knowledge Base</h5>
                    </div>
                    <div className="space-y-3">
                        <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                            <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">
                                "Mapping skills directly in the JSON allows for high-granularity assessment tagging. Ensure <span className="text-[#FF4B91]">skillIds</span> are included per item for precise mapping."
                            </p>
                        </div>
                        <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                            <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                                Upload is prioritized at the <span className="text-blue-600 underline">Subtopic</span> level. Use this panel to inject bulk content into your assessment matrix.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BulkUploadPanel;
