'use client';

import React from 'react';
import { CheckCircle, ShieldCheck } from 'lucide-react';
import { getIconComponent } from './iconMapper';// FIXED IMPORT PATH
import { PlacementService } from '@quiz/marketing-site/lib/CoursesCardData';

interface PlacementCardProps {
  service: PlacementService;
}

export const PlacementCard: React.FC<PlacementCardProps> = ({ service }) => {
  const IconComponent = getIconComponent(service.icon);
  
  const getFeatureColor = (serviceId: number, isCompleted: boolean) => {
    if (!isCompleted) return 'bg-gray-100 text-gray-400';
    
    switch (serviceId) {
      case 1: return 'bg-blue-100 text-blue-600';
      case 2: return 'bg-orange-100 text-orange-600';
      case 3: return 'bg-indigo-100 text-indigo-600';
      case 4: return 'bg-emerald-100 text-emerald-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  return (
    <div
      key={service.id}
      data-aos="fade-up"
      data-aos-delay={service.id * 120}
      data-aos-duration="700"
      data-aos-once="true"
      className="relative"
    >
      {/* Main Card */}
      <div className={`
        relative rounded-3xl p-8 
        ${service.bgColor} 
        border-2 ${service.borderColor}
        shadow-lg
        h-full
      `}>
        {/* Top Section */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* Icon Badge */}
            <div className={` 
              p-4 rounded-2xl 
              bg-gradient-to-br ${service.color}
              shadow-lg
            `}>
              <IconComponent className="w-8 h-8" />
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                  {service.title}
                </h3>
              </div>
            </div>
          </div>

          {/* Number Badge */}
          <div className="text-4xl font-bold text-gray-200/60">
            0{service.id}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          {service.description}
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {service.features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-white/80"
            >
              <div className={`
                p-2 rounded-lg flex-shrink-0
                ${getFeatureColor(service.id, feature.completed)}
              `}>
                {feature.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-current"></div>
                )}
              </div>
              <span className={`font-medium ${feature.completed ? 'text-gray-800' : 'text-gray-500'}`}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>

        {/* Included Badge */}
        <div className="pt-6 border-t border-gray-200/50">
          <div className="flex items-center gap-2 text-gray-600">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <span className="font-medium">Included in placement package</span>
          </div>
        </div>
      </div>
    </div>
  );
};