'use client';

import React from 'react';

export const ChordPlaceholder: React.FC = () => (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Skill Correlation (Chord)</div>
        <div className="h-36 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-500">
            Chord diagram placeholder — needs skill-cooccurrence data
        </div>
    </div>
);
