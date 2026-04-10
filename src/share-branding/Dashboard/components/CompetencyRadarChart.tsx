import React, { useEffect, useRef, useState } from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';
import { useDashboardData } from './DashboardDataContext';

export function CompetencyRadarChart() {
  const brand = useBrand();
  const { competencyMap } = useDashboardData();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const chartData = competencyMap.data.map((item) => ({
    ...item,
    displaySubject:
      chartWidth < 320
        ? item.subject.length > 7
          ? item.subject.slice(0, 6)
          : item.subject
        : chartWidth < 380
        ? item.subject === 'Architecture'
          ? 'Arch'
          : item.subject === 'Debugging'
          ? 'Debug'
          : item.subject
        : item.subject,
  }));

  useEffect(() => {
    const updateWidth = () => {
      if (!chartRef.current) {
        return;
      }
      setChartWidth(Math.max(Math.min(chartRef.current.clientWidth, 440), 220));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-2 text-lg font-bold text-gray-900">{competencyMap.title}</h3>
      <p className="mb-4 text-sm text-gray-600">{competencyMap.subtitle}</p>

      <div ref={chartRef} className="flex h-72 min-w-0 items-center justify-center">
        {chartWidth > 0 ? (
          <RadarChart width={chartWidth} height={288} data={chartData}>
            <PolarGrid stroke="#e5e7eb" strokeWidth={1} />
            <PolarAngleAxis dataKey="displaySubject" tick={{ fill: '#6b7280', fontSize: chartWidth < 340 ? 10 : 12, fontWeight: 600 }} />
            <Radar
              name="Skills"
              dataKey="value"
              stroke={brand.primaryColor}
              fill={brand.primaryColor}
              fillOpacity={0.5}
              strokeWidth={2}
            />
          </RadarChart>
        ) : (
          <div className="h-full rounded-[1.5rem] bg-gray-50" />
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {chartData.slice(0, 3).map((item, index) => (
          <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
            <div className="mb-1 text-2xl font-black" style={{ color: brand.primaryColor }}>
              {item.value}
            </div>
            <div className="text-xs font-semibold text-gray-600">{item.subject}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
