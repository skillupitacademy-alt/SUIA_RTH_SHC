'use client';

import { PageTitle } from '@quiz/ui';
import { Award, BookOpen, Database, GitBranch, Hash, Layers, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { DomainTable } from '@/components/questions/DomainTable';
import { QuestionTable } from '@/components/questions/QuestionTable';
import { SkillTable } from '@/components/questions/SkillTable';
import { SubjectTable } from '@/components/questions/SubjectTable';
import { SubtopicTable } from '@/components/questions/SubtopicTable';
import { TopicTable } from '@/components/questions/TopicTable';

export default function QuestionsPage() {
    const [activeTab, setActiveTab] = useState<'domains' | 'subjects' | 'topics' | 'subtopics' | 'questions' | 'skills'>('domains');

    return (
        <div className="space-y-8 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-primary/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Database size={20} className="text-[#f54a8d]" />
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-[#f54a8d]">Governance_Matrix</span>
                    </div>
                    <PageTitle text="Question Bank" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Hierarchy • Difficulty • Compliance</p>
                </div>
                <div className="flex flex-col sm:flex-row items-end gap-3 text-right">
                    <Link
                        href="/factory/question-generator"
                        className="px-5 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-[#1A1A1A] text-xs font-black uppercase tracking-widest shadow-lg border border-slate-200 transition-all flex items-center gap-2"
                    >
                        <Sparkles size={16} /> Question Factory
                    </Link>
                    <Link
                        href="/questions/new"
                        className="px-5 py-2.5 rounded-xl bg-[#f54a8d] hover:bg-[#d63d7a] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-[#f54a8d]/20 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> New Question
                    </Link>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 flex-wrap">
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
                <button
                    onClick={() => setActiveTab('subtopics')}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'subtopics' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'bg-white text-muted-foreground hover:bg-gray-50'
                        }`}
                >
                    <GitBranch size={14} /> Subtopics
                </button>
                <button
                    onClick={() => setActiveTab('questions')}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'questions' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'bg-white text-muted-foreground hover:bg-gray-50'
                        }`}
                >
                    <Database size={14} /> Questions
                </button>
                <button
                    onClick={() => setActiveTab('skills')}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'skills' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'bg-white text-muted-foreground hover:bg-gray-50'
                        }`}
                >
                    <Award size={14} /> Skills
                </button>
            </div>

            {/* Tab Content */}
            <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {activeTab === 'domains' && <DomainTable />}
                {activeTab === 'subjects' && <SubjectTable />}
                {activeTab === 'topics' && <TopicTable />}
                {activeTab === 'subtopics' && <SubtopicTable />}
                {activeTab === 'questions' && <QuestionTable />}
                {activeTab === 'skills' && <SkillTable />}
            </div>
        </div>
    );
}
