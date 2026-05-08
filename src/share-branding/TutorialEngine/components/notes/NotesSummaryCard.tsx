import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface ChecklistItem {
  id: string;
  item: string;
  checked: boolean;
}

interface NotesSummaryCardProps {
  summaryTitle: string;
  keyTakeaways: string[];
  revisionChecklist: ChecklistItem[];
  memoryReinforcement: string;
  examTips: string[];
}

/**
 * Summary Card Component
 * Renderer: summary_card
 * Layout Template: exam_ready_summary
 * Purpose: Revision summary and exam-preparation dashboard
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function NotesSummaryCard({ 
  summaryTitle, 
  keyTakeaways, 
  revisionChecklist, 
  memoryReinforcement, 
  examTips 
}: NotesSummaryCardProps) {
  const brand = useBrand();
  const [checklist, setChecklist] = useState(revisionChecklist);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const completedCount = checklist.filter(item => item.checked).length;
  const totalCount = checklist.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="w-full max-w-[1200px] mb-8">
      <div 
        className="rounded-[20px] p-10 shadow-2xl border-2 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]"
        style={{ 
          background: `linear-gradient(135deg, ${brand.primaryColor}08 0%, ${brand.primaryColor}12 100%)`,
          borderColor: `${brand.primaryColor}30`
        }}
      >
        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${brand.primaryColor}20` }}
          >
            <Icons.BookMarked 
              size={24} 
              style={{ color: brand.primaryColor }}
              aria-hidden="true"
            />
          </div>
          <h3 className="text-3xl font-bold text-slate-950">{summaryTitle}</h3>
        </div>

        {/* Key Takeaways */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-950 mb-4 flex items-center gap-2">
            <Icons.Star size={20} style={{ color: brand.primaryColor }} aria-hidden="true" />
            Key Takeaways
          </h3>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <ul className="space-y-3">
              {keyTakeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Icons.CheckCircle2 
                    size={18} 
                    className="shrink-0 mt-0.5" 
                    style={{ color: brand.primaryColor }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-slate-800 leading-relaxed">
                    {takeaway}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Revision Checklist */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-950 flex items-center gap-2">
              <Icons.ClipboardCheck size={20} style={{ color: brand.primaryColor }} aria-hidden="true" />
              Revision Checklist
            </h3>
            <span 
              className="text-sm font-bold px-3 py-1 rounded-full"
              style={{ 
                backgroundColor: `${brand.primaryColor}20`,
                color: brand.primaryColorDark
              }}
            >
              {completedCount}/{totalCount} ({completionPercentage}%)
            </span>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <div className="space-y-3">
              {checklist.map((item) => (
                <label 
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="mt-0.5 w-5 h-5 rounded border-2 cursor-pointer"
                    style={{ 
                      accentColor: brand.primaryColor,
                      borderColor: brand.primaryColor
                    }}
                  />
                  <span 
                    className={`text-sm font-medium leading-relaxed ${
                      item.checked ? 'text-slate-500 line-through' : 'text-slate-800'
                    }`}
                  >
                    {item.item}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Memory Reinforcement */}
        <div className="mb-8">
          <div 
            className="flex gap-4 p-6 rounded-xl border-l-4"
            style={{ 
              backgroundColor: `${brand.primaryColor}15`,
              borderLeftColor: brand.primaryColor
            }}
          >
            <Icons.Brain 
              size={24} 
              className="shrink-0 mt-0.5" 
              style={{ color: brand.primaryColorDark }}
              aria-hidden="true"
            />
            <div>
              <h3 className="text-base font-bold mb-2" style={{ color: brand.primaryColorDark }}>
                Memory Reinforcement
              </h3>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {memoryReinforcement}
              </p>
            </div>
          </div>
        </div>

        {/* Exam Tips */}
        <div>
          <h3 className="text-xl font-bold text-slate-950 mb-4 flex items-center gap-2">
            <Icons.GraduationCap size={20} style={{ color: brand.primaryColor }} aria-hidden="true" />
            Exam Tips
          </h3>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <ul className="space-y-3">
              {examTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Icons.Target 
                    size={18} 
                    className="shrink-0 mt-0.5" 
                    style={{ color: brand.primaryColor }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-slate-800 leading-relaxed">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
