'use client';

import React from 'react';
import { renderLucideIcon } from './lucideIconsMapper';

interface CareerOutcomeProps {
  title: string;
  salary: string;
  icon: string;
  gradient: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

interface CareerOutcomesProps {
  outcomes: CareerOutcomeProps[];
  capstoneData: {
    title: string;
    icon: string;
    bgColor: string;
    borderColor: string;
    projects: string[];
    outcome: string;
  };
  interviewPrep: {
    title: string;
    icon: string;
    bgColor: string;
    borderColor: string;
    technical: string[];
    career: string[];
    outcome: string;
  };
}

export const CareerOutcomes: React.FC<CareerOutcomesProps> = ({
  outcomes,
  capstoneData,
  interviewPrep
}) => {
  return (
    <div className="space-y-10">
      {/* Capstone + Interview Prep */}
      <div className="rounded-2xl p-6 border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
            {renderLucideIcon(capstoneData.icon, "w-10 h-7 text-white")}
          </div>
          <h3 className="text-md md:text-2xl font-bold text-gray-900">{capstoneData.title}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Capstone */}
          <div className={`rounded-xl p-6 bg-white ${capstoneData.borderColor}`}>
            <h4 className="text-md md:text-xl font-bold mb-4 flex items-center gap-2">
              {renderLucideIcon(capstoneData.icon, "w-6 h-6 text-red-500")} {capstoneData.title}
            </h4>
            <ul className="space-y-2 pl-4 text-gray-700 text-sm">
              {capstoneData.projects.map((project, idx) => (
                <li key={idx}>{project}</li>
              ))}
            </ul>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <span className="font-bold text-red-700">Outcome: </span>
              {capstoneData.outcome}
            </div>
          </div>
          {/* Interview */}
          <div className={`rounded-xl p-6 bg-white ${interviewPrep.borderColor}`}>
            <h4 className="text-md md:text-xl font-bold mb-4 flex items-center gap-2">
              {renderLucideIcon(interviewPrep.icon, "w-6 h-6 text-red-500")} {interviewPrep.title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-bold mb-2">Technical:</h5>
                <ul className="space-y-1 text-gray-700 text-sm pl-4">
                  {interviewPrep.technical.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="font-bold mb-2">Career:</h5>
                <ul className="space-y-1 text-gray-700 text-sm pl-4">
                  {interviewPrep.career.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <span className="font-bold text-red-700">Outcome: </span>
              {interviewPrep.outcome}
            </div>
          </div>
        </div>
      </div>

      {/* Job Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {outcomes.map((outcome, idx) => {
          return (
            <div key={idx} className={`rounded-2xl p-6 border-2 ${outcome.borderColor} ${outcome.bgColor}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${outcome.gradient}`}>
                  {renderLucideIcon(outcome.icon, "w-7 h-7 text-white")}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{outcome.title}</h4>
                  <div className="text-2xl font-bold text-gray-900">{outcome.salary}</div>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{outcome.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
