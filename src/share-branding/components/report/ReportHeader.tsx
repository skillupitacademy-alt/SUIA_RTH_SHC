import React from 'react';
import { Calendar, Clock, Award } from 'lucide-react';
import { SubjectLogo } from '../SubjectLogo';

interface ReportHeaderProps {
  subject: string;
  examSubjectName: string;
  examDateStr: string;
  formattedTotalTime: string;
  isPassed: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}

export function ReportHeader({
  subject,
  examSubjectName,
  examDateStr,
  formattedTotalTime,
  isPassed,
  primaryColor = '#ff0055',
  secondaryColor = '#0b132b',
}: ReportHeaderProps) {
  return (
    <div className="bg-[#0b132b] rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg border border-[#1e295f]">
      {/* Left Title & Dynamic Subject Logo */}
      <div className="flex items-center gap-3.5">
        <div className="flex-shrink-0">
          <SubjectLogo
            subject={subject}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            size="md"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight">
            <span className="text-[#ff0055]">{examSubjectName}</span>
            <span className="text-white"> — EXAM SUMMARY</span>
          </h1>
        </div>
      </div>

      {/* Right Info Capsules */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
        {/* Exam Date */}
        <div className="bg-[#070d24] border border-[#1e295f] rounded-xl px-3.5 py-2 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#ff0055] flex items-center justify-center text-white flex-shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Exam Date</p>
            <p className="text-xs sm:text-sm font-bold text-white mt-0.5">{examDateStr}</p>
          </div>
        </div>

        {/* Duration */}
        <div className="bg-[#070d24] border border-[#1e295f] rounded-xl px-3.5 py-2 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#ff0055] flex items-center justify-center text-white flex-shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Duration</p>
            <p className="text-xs sm:text-sm font-bold text-white mt-0.5">{formattedTotalTime}</p>
          </div>
        </div>

        {/* Overall Result */}
        <div className="bg-[#070d24] border border-[#1e295f] rounded-xl px-3.5 py-2 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#ff0055] flex items-center justify-center text-white flex-shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Overall Result</p>
            <p className={`text-xs sm:text-sm font-black uppercase mt-0.5 ${isPassed ? 'text-[#ff0055]' : 'text-red-400'}`}>
              {isPassed ? 'PASS' : 'RETRY'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
