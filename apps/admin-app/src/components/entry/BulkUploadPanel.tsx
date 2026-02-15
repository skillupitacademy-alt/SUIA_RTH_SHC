'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import { AlertCircle, Check, Copy, FileJson, Sparkles,Trash2, Upload } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

interface BulkUploadPanelProps {
    topicId: string;
    topicName?: string;
    subtopicId: string | null;
    skillIds: string[];
    onSuccess: (count: number) => void;
    onError: (message: string) => void;
}

export function BulkUploadPanel({ topicId, topicName, subtopicId, skillIds, onSuccess, onError }: BulkUploadPanelProps) {
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

    const [copiedSchema, setCopiedSchema] = useState(false);
    const [copiedPrompt, setCopiedPrompt] = useState(false);

    const schemaExample = `[
  {
    "text": "Identify the primary function of a database index.",
    "difficulty": "intermediate",
    "type": "mcq",
    "mappingType": "conceptual",
    "options": [
      { "text": "Speed up data retrieval", "isCorrect": true },
      { "text": "Reduce disk space", "isCorrect": false }
    ],
    "explanation": "Indexes improve query performance by..."
  }
]`;

    const aiPrompt = `You are an expert exam content generator.
Generate 5 high-quality multiple-choice questions for the topic: ${topicName || "[INSERT TOPIC HERE]"}
Output strictly in the following JSON format:

[
  {
    "text": "Question text here...",
    "difficulty": "intermediate", // simple, intermediate, expert
    "type": "mcq", // mcq, code_mcq
    "mappingType": "conceptual", // conceptual, technical, practical
    "options": [
      { "text": "Option A", "isCorrect": true },
      { "text": "Option B", "isCorrect": false }
    ],
    "explanation": "Detailed explanation..."
  }
]
`;

    const copyToClipboard = (text: string, isSchema: boolean) => {
        navigator.clipboard.writeText(text);
        if (isSchema) {
            setCopiedSchema(true);
            setTimeout(() => setCopiedSchema(false), 2000);
        } else {
            setCopiedPrompt(true);
            setTimeout(() => setCopiedPrompt(false), 2000);
        }
    };

    return (
        <div className="space-y-8">
            {!file ? (
                <div className="relative">
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center bg-white/40 backdrop-blur-sm hover:border-[#FF4B91]/50 hover:bg-[#FF4B91]/5 transition-all group">
                        <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform shadow-inner ring-1 ring-slate-100">
                            <Upload className="w-10 h-10 text-slate-400 group-hover:text-[#FF4B91] transition-colors" />
                        </div>
                        <h4 className="text-2xl font-black text-slate-800 mb-3 uppercase tracking-tight">Drop JSON File Here</h4>
                        <p className="text-slate-500 text-lg font-medium">Or click to browse your computer for questions</p>
                        <div className="mt-8 flex items-center justify-center gap-6 text-xs font-black uppercase tracking-widest text-slate-400">
                            <div className="flex items-center gap-2">
                                <FileJson className="w-4 h-4" />
                                <span>Format: JSON</span>
                            </div>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span>Limit: 100 per file</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white/40">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-[#FF4B91]/10 flex items-center justify-center shadow-inner">
                                <FileJson className="w-8 h-8 text-[#FF4B91]" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 tracking-tight">{file.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-black uppercase tracking-wider border border-green-200">
                                        {questions.length} Valid Questions
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={clearFile}
                            className="w-12 h-12 flex items-center justify-center hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-100"
                            title="Remove File"
                        >
                            <Trash2 className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto p-8 space-y-4 bg-slate-50/30">
                        {questions.slice(0, 10).map((q, idx) => (
                            <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-start gap-5 hover:border-[#FF4B91]/30 transition-colors group">
                                <span className="w-8 h-8 rounded-xl bg-slate-100 text-xs font-black flex items-center justify-center text-slate-500 group-hover:bg-[#FF4B91] group-hover:text-white transition-colors">
                                    {idx + 1}
                                </span>
                                <div className="space-y-2 flex-1">
                                    <p className="text-base font-bold text-slate-800 line-clamp-2 leading-relaxed">{q.text || q.questionText}</p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={cn(
                                            "text-[10px] font-black uppercase px-2 py-1 rounded-lg border",
                                            q.difficulty === 'simple' ? "bg-green-50 text-green-600 border-green-100" :
                                                q.difficulty === 'intermediate' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                                    "bg-red-50 text-red-600 border-red-100"
                                        )}>{q.difficulty || 'intermediate'}</span>

                                        {q.mappingType && (
                                            <span className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                                                {q.mappingType}
                                            </span>
                                        )}

                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                            <Check className="w-3 h-3" /> {q.options.length} Options
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {questions.length > 10 && (
                            <div className="text-center py-6 text-sm font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                + {questions.length - 10} more questions ready
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-white border-t border-gray-100 flex justify-between items-center">
                        <div className="text-xs font-medium text-slate-500">
                            Targeting: <span className="font-bold text-slate-800">Current Topic</span>
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={isUploading || questions.length === 0}
                            className="flex items-center gap-3 px-10 py-5 bg-[#FF4B91] hover:bg-[#ff3382] text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl shadow-[#FF4B91]/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
                        >
                            {isUploading ? (
                                <>
                                    <ZLoader size="xs" className="text-white" center={false} /> Processing...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" /> Finalize & Upload All
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Resources Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* 1. JSON Schema Guide */}
                <div className="bg-white rounded-[2rem] p-8 shadow-xl flex flex-col gap-6 border border-slate-200 relative overflow-hidden group hover:border-blue-300 transition-colors">
                    {/* Header */}
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <FileJson className="w-6 h-6" />
                            </div>
                            <div>
                                <h5 className="font-black text-base uppercase tracking-widest text-slate-800">JSON Schema</h5>
                                <p className="text-xs text-slate-500 font-medium">Strict format required</p>
                            </div>
                        </div>
                        <button
                            onClick={() => copyToClipboard(schemaExample, true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-blue-200 shadow-sm"
                        >
                            {copiedSchema ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            {copiedSchema ? 'COPIED' : 'COPY'}
                        </button>
                    </div>

                    {/* Code Block */}
                    <div className="relative z-10 bg-slate-50 rounded-2xl p-6 border border-slate-200 overflow-x-auto group-hover:shadow-inner transition-shadow">
                        <pre className="text-sm font-mono leading-relaxed text-slate-600 selection:bg-blue-100">
                            {schemaExample}
                        </pre>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl group-hover:bg-blue-100/50 transition-colors duration-700" />
                </div>

                {/* 2. AI Generator Prompt */}
                <div className="bg-white rounded-[2rem] p-8 shadow-xl flex flex-col gap-6 border border-slate-200 relative overflow-hidden group hover:border-[#FF4B91]/30 transition-colors">
                    {/* Header */}
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-[#FF4B91]/10 text-[#FF4B91] border border-[#FF4B91]/20 group-hover:bg-[#FF4B91] group-hover:text-white transition-colors">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                                <h5 className="font-black text-base uppercase tracking-widest text-slate-800">AI Generator Prompt</h5>
                                <p className="text-xs text-slate-500 font-medium">Paste into ChatGPT / Claude</p>
                            </div>
                        </div>
                        <button
                            onClick={() => copyToClipboard(aiPrompt, false)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#FF4B91] rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-[#FF4B91]/30 shadow-sm"
                        >
                            {copiedPrompt ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            {copiedPrompt ? 'COPIED' : 'COPY'}
                        </button>
                    </div>

                    {/* Prompt Content */}
                    <div className="relative z-10 bg-slate-50 rounded-2xl p-6 border border-slate-200 overflow-hidden group-hover:shadow-inner transition-shadow">
                        <p className="text-sm font-mono text-slate-600 leading-relaxed whitespace-pre-wrap selection:bg-[#FF4B91]/20">
                            {aiPrompt}
                        </p>
                    </div>

                    {/* Background decoration - Subtle */}
                    <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#FF4B91]/5 rounded-full blur-3xl group-hover:bg-[#FF4B91]/10 transition-colors duration-700" />
                </div>
            </div>
        </div>
    );
}

export default BulkUploadPanel;
