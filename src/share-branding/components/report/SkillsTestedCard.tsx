import React from 'react';
import { DonutGauge } from './DonutGauges';
import { SkillItem } from './types';

interface SkillsTestedCardProps {
  skillList: SkillItem[];
}

export function SkillsTestedCard({ skillList }: SkillsTestedCardProps) {
  return (
    <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="inline-block bg-[#ff0055] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-4">
          SKILLS TESTED
        </div>

        {/* 6 Skills in a Row */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center items-start">
          {skillList.map((skill, index) => {
            const gaugeColor =
              skill.accuracy >= 80
                ? '#059669'
                : skill.accuracy >= 60
                ? '#2563eb'
                : skill.accuracy > 0
                ? '#f97316'
                : '#cbd5e1';

            const displayAccuracy =
              skill.accuracy > 0
                ? `${skill.accuracy.toFixed(skill.accuracy % 1 === 0 ? 0 : 1)}%`
                : '0%';

            return (
              <div key={index} className="flex flex-col items-center">
                {/* Skill Title (2 lines) */}
                <div className="h-8 flex items-center justify-center mb-2">
                  <span className="text-[11px] font-bold text-gray-800 leading-tight line-clamp-2">
                    {skill.name}
                  </span>
                </div>

                {/* Skill Icon */}
                <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                  {skill.icon}
                </div>

                {/* Circular Progress Gauge */}
                <DonutGauge
                  percentage={skill.accuracy}
                  size={54}
                  strokeWidth={6}
                  color={gaugeColor}
                  trackColor="#f1f5f9"
                >
                  <span className="text-[10px] font-black text-gray-900">
                    {displayAccuracy}
                  </span>
                </DonutGauge>

                {/* Score / Total */}
                <div className="text-[11px] font-bold text-gray-700 mt-2">
                  {skill.score} / {skill.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
