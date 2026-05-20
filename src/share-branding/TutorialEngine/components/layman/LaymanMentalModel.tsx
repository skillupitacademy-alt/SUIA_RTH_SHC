import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface Node {
  id: string;
  label: string;
  type?: string;
}

interface Connection {
  from: string;
  to: string;
  label: string;
}

interface Tool {
  id: string;
  label: string;
  icon: string;
}

interface LaymanMentalModelProps {
  title: string;
  conceptMap?: Node[];
  visualLabels?: Connection[];
  flowArrows?: Tool[];
  tooltips?: string;
}

/**
 * Layman Mental Model Component
 * Renderer: diagram_renderer
 * Purpose: Mental model and conceptual visual system (Big Picture)
 */
export function LaymanMentalModel({ 
  title, 
  conceptMap = [], 
  visualLabels = [], 
  flowArrows = [], 
  tooltips = '' 
}: LaymanMentalModelProps) {
  const brand = useBrand();

  const getIconByName = (name: string) => {
    const IconComponent = (Icons as any)[name] || Icons.HelpCircle;
    return <IconComponent size={24} style={{ color: brand.primaryColor }} />;
  };

  return (
    <div className="w-full mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: '#00ACC1' }} // Teal circle like in the image
        >
          6
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
      </div>

      <div className="bg-[#F8FAFC] rounded-[32px] p-8 lg:p-12 border border-gray-100 shadow-inner">
        {/* TOP ROW: The Flow */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-12 relative">
          {conceptMap.map((node, index) => {
            const connection = visualLabels.find(c => c.from === node.id);
            
            return (
              <React.Fragment key={node.id}>
                {/* Node Card */}
                <div 
                  className={`flex flex-col items-center p-6 rounded-[24px] shadow-sm border w-full max-w-[200px] transition-transform hover:scale-105 ${
                    node.type === 'actor' ? 'bg-[#E3F2FD] border-[#BBDEFB]' :
                    node.type === 'concept' ? 'bg-[#FFF9C4] border-[#FFF176]' :
                    'bg-[#E8F5E9] border-[#C8E6C9]'
                  }`}
                >
                  <div className="mb-3">
                    {node.type === 'actor' && <Icons.User size={32} className="text-blue-600" />}
                    {node.type === 'concept' && <span className="text-3xl font-black text-slate-900">JS</span>}
                    {node.type === 'output' && <Icons.Layout size={32} className="text-emerald-600" />}
                  </div>
                  <span className="text-sm font-black text-slate-500 uppercase tracking-tighter mb-1">
                    {node.type === 'actor' ? 'You (User)' : node.type === 'concept' ? 'Concept' : 'Result'}
                  </span>
                  <span className="text-base font-black text-slate-900 text-center">
                    {node.label}
                  </span>
                </div>

                {/* Connection Arrow */}
                {connection && index < conceptMap.length - 1 && (
                  <div className="flex flex-col items-center gap-2 px-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{connection.label}</span>
                    <Icons.ArrowRight size={24} className="text-slate-300 hidden lg:block" />
                    <Icons.ArrowDown size={24} className="text-slate-300 lg:hidden" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* MIDDLE ROW: The Toolkit */}
        <div className="relative mb-10">
          <div className="absolute inset-0 flex items-center justify-center -top-8">
            <div className="w-1 h-8 border-l-2 border-dashed border-slate-300"></div>
          </div>
          
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-6">
              Other Tools & Services
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {flowArrows.map((tool) => (
                <div key={tool.id} className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-transparent transition-all group-hover:border-slate-200 group-hover:bg-white group-hover:shadow-md">
                    {getIconByName(tool.icon)}
                  </div>
                  <span className="text-xs font-bold text-slate-600">{tool.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Footer Note */}
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#E0F2F1] border border-[#B2DFDB]">
          <Icons.Lightbulb size={24} className="text-[#00897B] shrink-0 mt-0.5" />
          <p className="text-base font-bold text-[#00695C] leading-tight italic">
            {tooltips}
          </p>
        </div>
      </div>
    </div>
  );
}
