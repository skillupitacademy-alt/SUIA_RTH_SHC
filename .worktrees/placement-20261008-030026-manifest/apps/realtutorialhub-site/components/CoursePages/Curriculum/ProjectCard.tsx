'use client';

import React from 'react';
import { renderLucideIcon } from './lucideIconsMapper';

interface ProjectCardProps {
  project: {
    id: number;
    title: string;
    description: string;
    icon: string;
    gradient: string;
    bgColor: string;
    borderColor: string;
    tags: string[];
  };
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className={`rounded-2xl border-2 p-6 ${project.bgColor} ${project.borderColor}`}>


      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center flex-col md:flex-row gap-4">
          <div className={`p-3 rounded-xl ${project.gradient}`}>
            {renderLucideIcon(project.icon, "w-7 h-7")}
          </div>
          <div>
            <h3 className="text-[18px] text-center md:text-xl font-bold text-gray-900">
              {project.title}
            </h3>
            <p className="text-[14px] text-center mt-4 md:mt-0  md:text-[18px] text-gray-600">
              {project.description}
            </p>
          </div>
        </div>
      </div>




      <p className="text-center text-gray-700 mb-4">
        {project.title.includes('E-Commerce') && 'Rich SPA + Authentication + Admin Dashboard + AI Suggestions.'}
        {project.title.includes('Financial') && 'Real-time websockets + trend prediction + charts.'}
        {project.title.includes('Chatbot') && 'Sentiment analysis + conversation history + ticket automation.'}
        {project.title.includes('Healthcare') && 'Telemedicine + patient history + automated insights.'}
        {project.title.includes('Job Portal') && 'Resume parsing, skill analysis, automated applications, and intelligent matching.'}
        {project.title.includes('Content') && 'Auto-tagging, content generation, SEO optimization, personalized recommendations.'}
        {project.title.includes('Fraud') && 'ML-based anomaly detection, real-time alerts, transaction monitoring.'}
        {project.title.includes('E-Learning') && 'AI tutor, progress tracking, discussion forums, personalized paths.'}
        {project.title.includes('Project Management') && 'Smart task assignment, timeline prediction, resource optimization.'}
        {project.title.includes('Music') && 'Mood detection, collaborative filtering, personalized playlists.'}
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        {project.tags.map((tag, idx) => (
          <span
            key={idx}
            className="px-3 py-1 bg-white/80 text-gray-800 rounded-full text-sm font-medium border border-gray-300"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};
