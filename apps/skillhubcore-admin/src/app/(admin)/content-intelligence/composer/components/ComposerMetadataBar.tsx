'use client';

import React from 'react';
import { Edit3 } from 'lucide-react';

interface ComposerMetadataBarProps {
  domain?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  contentMode?: string;
  difficulty?: string;
  onChangeSelection?: () => void;
}

export function ComposerMetadataBar({
  domain = 'Full Stack Development',
  subject = 'Frontend Development',
  topic = 'JavaScript',
  subtopic = 'Variables & Data Types',
  contentMode = 'Notes',
  difficulty = 'Beginner',
  onChangeSelection,
}: ComposerMetadataBarProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 mb-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
        <div>
          <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
            Domain
          </span>
          <span className="font-bold text-slate-800 truncate block mt-0.5">{domain}</span>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
            Subject
          </span>
          <span className="font-bold text-slate-800 truncate block mt-0.5">{subject}</span>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
            Topic
          </span>
          <span className="font-bold text-slate-800 truncate block mt-0.5">{topic}</span>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
            Subtopic
          </span>
          <span className="font-bold text-slate-800 truncate block mt-0.5">{subtopic}</span>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
            Content Mode
          </span>
          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-pink-50 text-[#f54a8d] border border-pink-200">
            {contentMode}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
            Difficulty
          </span>
          <span className="font-bold text-slate-800 truncate block mt-0.5">{difficulty}</span>
        </div>
      </div>

      <button
        onClick={onChangeSelection}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shrink-0 transition-colors cursor-pointer self-start md:self-center"
      >
        <Edit3 size={13} className="text-[#f54a8d]" />
        <span>Change Selection</span>
      </button>
    </div>
  );
}
