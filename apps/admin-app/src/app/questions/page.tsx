'use client';

import { useState } from 'react';
import { QuestionTable } from '@/components/questions/QuestionTable';
import { DomainTable } from '@/components/questions/DomainTable';
import { SubjectTable } from '@/components/questions/SubjectTable';
import { TopicTable } from '@/components/questions/TopicTable';
import { Database, FolderTree, BookOpen, Layers, Hash } from 'lucide-react';

export default function QuestionsPage() {
    const [activeTab, setActiveTab] = useState<'questions' | 'domains' | 'subjects' | 'topics'>('questions');

    return (
        <div className="space-y-8 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-primary/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Database size={20} className="text-[#FF4B91]" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Governance_Matrix</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter italic uppercase text-[#1A1A1A]">Question Bank</h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Hierarchy • Difficulty • Compliance</p>
                </div>
                <div className="flex flex-col items-end gap-3 text-right">
                    <span className="px-4 py-2 rounded-xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">Read Only Mode</span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('questions')}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'questions' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'bg-white text-muted-foreground hover:bg-gray-50'
                        }`}
                >
                    Questions
                </button>
                <button
                    onClick={() => setActiveTab('domains')}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'domains' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'bg-white text-muted-foreground hover:bg-gray-50'
                        }`}
                >
                    <Layers size={14} /> Domains
                </button>
                <button
                    onClick={() => setActiveTab('subjects')}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'subjects' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'bg-white text-muted-foreground hover:bg-gray-50'
                        }`}
                >
                    <BookOpen size={14} /> Subjects
                </button>
                <button
                    onClick={() => setActiveTab('topics')}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'topics' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'bg-white text-muted-foreground hover:bg-gray-50'
                        }`}
                >
                    <Hash size={14} /> Topics
                </button>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {activeTab === 'questions' && <QuestionTable />}
                {activeTab === 'domains' && <DomainTable />}
                {activeTab === 'subjects' && <SubjectTable />}
                {activeTab === 'topics' && <TopicTable />}
            </div>
        </div>
    );
}
