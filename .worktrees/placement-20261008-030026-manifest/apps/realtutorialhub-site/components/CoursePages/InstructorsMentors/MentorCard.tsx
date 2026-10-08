'use client';

import React from 'react';
import { FaStar, FaBriefcase } from 'react-icons/fa';
import { getReactIcon } from './reactIconMapper';
import { Mentor } from '@/lib/CoursesCardData';

interface MentorCardProps {
  mentor: Mentor;
}

export const MentorCard: React.FC<MentorCardProps> = ({ mentor }) => {
  return (
    <div className="group relative bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-500 flex flex-col h-full">
      {/* Top Gradient Banner */}
      <div className={`h-3 ${mentor.color}`}></div>

      <div className="p-8 flex flex-col flex-grow">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-8 flex-shrink-0">
          {/* Profile Image with Badge */}
          <div className="relative mb-6">
            <div className={`w-28 h-28 rounded-full ${mentor.color} flex items-center justify-center text-white text-4xl font-bold shadow-xl ring-4 ring-white ring-opacity-30`}>
              {mentor.initials}
            </div>
          </div>

          {/* Name and Title */}
          <div className="mb-4 min-h-[120px]">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{mentor.name}</h3>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full mb-4">
              <FaBriefcase className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700 font-semibold">{mentor.title}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2 rounded-full">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="text-amber-500 w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-amber-700 font-bold text-lg">{mentor.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8 min-h-[120px] flex-shrink-0">
          <p className="text-gray-600 leading-relaxed text-center text-lg">
            {mentor.description}
          </p>
        </div>

        {/* Stats Grid */}
        {mentor.stats && (
          <div className="mb-8 flex-shrink-0">
            <div className="grid grid-cols-3 gap-4">
              {mentor.stats.map((stat, index) => {
                const StatIcon = getReactIcon(stat.icon);
                
                return (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 text-center border border-gray-100 shadow-sm h-full"
                  >
                    <div className="flex justify-center mb-2">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        <StatIcon className={`w-5 h-5 ${stat.iconColor}`} />
                      </div>
                    </div>
                    <div className="text-lg md:text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expertise Tags */}
        <div className="flex-grow flex flex-col">
          <div className="mb-4 flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
              <h4 className="text-lg font-bold text-gray-900">Expertise</h4>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center flex-grow items-start">
            {mentor.tags.map((tag, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-br from-gray-50 to-white text-gray-700 rounded-full text-sm font-medium border border-gray-200 shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};