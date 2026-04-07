import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { Code, Database, Shield, Laptop, Brain, Cloud, Network, Settings } from 'lucide-react';


interface Domain {
  id: string;
  title: string;
  description: string;
  category: string;
  coverage: number;
  icon: string;
}

const domains: Domain[] = [
  {
    id: 'fullstack',
    title: 'Full Stack Development',
    description: 'Front End, Back End, Database Architecture',
    category: 'Engineering',
    coverage: 95,
    icon: 'code',
  },
  {
    id: 'datascience',
    title: 'Data Science',
    description: 'ML, Analytics, Statistical Modeling',
    category: 'Data',
    coverage: 88,
    icon: 'brain',
  },
  {
    id: 'dataeng',
    title: 'Data Engineering',
    description: 'Pipelines, ETL, Data Warehousing',
    category: 'Data',
    coverage: 92,
    icon: 'database',
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity',
    description: 'Security, Penetration Testing, Compliance',
    category: 'Security',
    coverage: 85,
    icon: 'shield',
  },
  {
    id: 'devops',
    title: 'DevOps & Cloud',
    description: 'CI/CD, Infrastructure, Cloud Architecture',
    category: 'Operations',
    coverage: 78,
    icon: 'cloud',
  },
  {
    id: 'mobile',
    title: 'Mobile Development',
    description: 'iOS, Android, Cross-Platform',
    category: 'Engineering',
    coverage: 72,
    icon: 'laptop',
  },
  {
    id: 'networking',
    title: 'Network Engineering',
    description: 'Protocols, Infrastructure, Administration',
    category: 'Infrastructure',
    coverage: 68,
    icon: 'network',
  },
  {
    id: 'sysadmin',
    title: 'System Administration',
    description: 'Linux, Windows, Server Management',
    category: 'Operations',
    coverage: 75,
    icon: 'settings',
  },
];

const iconMap: any = {
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
  selected: Domain | null;
  onSelect: (domain: Domain) => void;
}

export function DomainSelection({ selected, onSelect }: DomainSelectionProps) {
  const brandConfig = useBrand();

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Select Your Domain</h2>
        <p className="text-slate-600">Choose the subject area you want to practice</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {domains.map((domain) => {
          const Icon = iconMap[domain.icon];
          const isSelected = selected?.id === domain.id;

          return (
            <button
              key={domain.id}
              onClick={() => onSelect(domain)}
              className={`p-6 rounded-2xl border transition-all duration-300 text-left hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] hover:scale-[1.02] ${
                isSelected
                  ? 'border-2 bg-[#d81b60]/5 shadow-sm'
                  : 'border border-gray-200 bg-white'
              }`}
              style={
                isSelected
                  ? {
                      borderColor: brandConfig.primaryColor,
                      borderWidth: '2px',
                      backgroundColor: `${brandConfig.primaryColor}0D`, // 5% opacity
                    }
                  : {}
              }
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-[#d81b60]' : 'bg-gray-100'
                  }`}
                  style={isSelected ? { backgroundColor: brandConfig.primaryColor } : {}}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isSelected
                      ? 'bg-[#d81b60] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  style={isSelected ? { backgroundColor: brandConfig.primaryColor } : {}}
                >
                  {domain.category}
                </span>
              </div>

              <h3 className="font-bold text-lg text-slate-900 mb-2">{domain.title}</h3>
              <p className="text-sm text-slate-600 mb-4">{domain.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Coverage</span>
                <span
                  className={`text-sm font-bold ${
                    isSelected ? 'text-[#d81b60]' : 'text-slate-900'
                  }`}
                  style={isSelected ? { color: brandConfig.primaryColor } : {}}
                >
                  {domain.coverage}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isSelected ? 'bg-[#d81b60]' : 'bg-gray-400'
                  }`}
                  style={
                    isSelected
                      ? { width: `${domain.coverage}%`, backgroundColor: brandConfig.primaryColor }
                      : { width: `${domain.coverage}%` }
                  }
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
