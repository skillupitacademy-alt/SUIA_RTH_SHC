import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { Code, Database, Shield, Laptop, Brain, Cloud, Network, Settings } from 'lucide-react';
import { useLaunchData } from '../LaunchDataContext';

const iconMap: Record<string, any> = {
  code: Code,
  database: Database,
  shield: Shield,
  laptop: Laptop,
  brain: Brain,
  cloud: Cloud,
  network: Network,
  settings: Settings,
};

interface DomainSelectionProps {
  selected: any;
  onSelect: (domain: any) => void;
}

export function DomainSelection({ selected, onSelect }: DomainSelectionProps) {
  const brandConfig = useBrand();
  const data = useLaunchData();

  return (
    <div className="flex h-full w-full min-w-0 max-w-full flex-col">
      <div className="mb-6 min-w-0">
        <h2 className="mb-2 break-words text-2xl font-bold text-slate-800">{data.domainSelection.title}</h2>
        <p className="break-words text-slate-600">{data.domainSelection.description}</p>
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.domainSelection.domains.map((domain) => {
          const Icon = iconMap[domain.icon];
          const isSelected = selected?.id === domain.id;

          return (
            <button
              key={domain.id}
              onClick={() => onSelect(domain)}
              className={`w-full min-w-0 overflow-hidden rounded-2xl border p-5 text-left shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] sm:p-6 ${
                isSelected ? 'bg-white shadow-sm' : 'border border-gray-200 bg-white'
              }`}
              style={isSelected ? { borderColor: brandConfig.primaryColor, borderWidth: '2px', backgroundColor: `${brandConfig.primaryColor}0D` } : {}}
            >
              <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isSelected ? '' : 'bg-gray-100'}`} style={isSelected ? { backgroundColor: brandConfig.primaryColor } : {}}>
                  <Icon className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <span className={`max-w-full shrink-0 rounded-full px-2 py-1 text-xs font-medium ${isSelected ? 'text-white' : 'bg-gray-100 text-gray-600'}`} style={isSelected ? { backgroundColor: brandConfig.primaryColor } : {}}>
                  {domain.category}
                </span>
              </div>

              <h3 className="mb-2 break-words text-base font-bold text-slate-900 sm:text-lg">{domain.title}</h3>
              <p className="mb-4 break-words text-sm text-slate-600">{domain.description}</p>

              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="text-xs text-slate-500">{data.domainSelection.coverageLabel}</span>
                <span className={`text-sm font-bold ${isSelected ? '' : 'text-slate-900'}`} style={isSelected ? { color: brandConfig.primaryColor } : {}}>
                  {domain.coverage}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full" style={{ width: `${domain.coverage}%`, backgroundColor: isSelected ? brandConfig.primaryColor : '#9ca3af' }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
