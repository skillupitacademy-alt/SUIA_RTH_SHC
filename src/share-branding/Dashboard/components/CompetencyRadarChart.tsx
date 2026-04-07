import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

export function CompetencyRadarChart() {
  const brand = useBrand();

  const data = [
    { subject: 'Logic', value: 85, fullMark: 100 },
    { subject: 'Syntax', value: 92, fullMark: 100 },
    { subject: 'Memory', value: 78, fullMark: 100 },
    { subject: 'Speed', value: 88, fullMark: 100 },
    { subject: 'Debugging', value: 75, fullMark: 100 },
    { subject: 'Architecture', value: 82, fullMark: 100 },
  ];

  return (
    <div className="rounded-[2rem] p-6 bg-white border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{(brand as any).graphLabel || 'Competency Map'}</h3>
      <p className="text-sm text-gray-600 mb-4">Based on exam performance metrics</p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#e5e7eb" strokeWidth={1} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
            />
            <Radar
              name="Skills"
              dataKey="value"
              stroke={brand.primaryColor}
              fill={brand.primaryColor}
              fillOpacity={0.5}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {data.slice(0, 3).map((item, index) => (
          <div key={index} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-2xl font-black mb-1" style={{ color: brand.primaryColor }}>
              {item.value}
            </div>
            <div className="text-xs text-gray-600 font-semibold">{item.subject}</div>
          </div>
        ))}
      </div>
    </div>
  );
}