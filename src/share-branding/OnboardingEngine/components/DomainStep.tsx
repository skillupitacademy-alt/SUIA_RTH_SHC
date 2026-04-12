'use client';

import { useState } from 'react';
import { useBrand } from '../context/BrandContext';
import { domainCards } from '../models/onboardingSession';
import { ChevronDown, Check } from 'lucide-react';

interface DomainStepProps {
  selectedDomain: string;
  selectedSubDomain?: string;
  onChange: (domain: string, subDomain?: string) => void;
}

export function DomainStep({
  selectedDomain,
  selectedSubDomain,
  onChange
}: DomainStepProps) {
  const brand = useBrand();
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const handleDomainClick = (domainId: string) => {
    if (selectedDomain === domainId) {
      setExpandedDomain(expandedDomain === domainId ? null : domainId);
    } else {
      onChange(domainId);
      setExpandedDomain(domainId);
    }
  };

  const handleSubDomainClick = (domainId: string, subDomain: string) => {
    onChange(domainId, subDomain);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">
          Which field do you want to master?
        </h1>
        <p className="text-slate-600">
          Choose your area of focus
        </p>
      </div>

      {/* Domain Cards */}
      <div className="grid grid-cols-3 gap-4 max-w-5xl mx-auto">
        {domainCards.map((domain) => {
          const isSelected = selectedDomain === domain.id;
          const isExpanded = expandedDomain === domain.id;
          const hasSubDomains = domain.subDomains && domain.subDomains.length > 0;

          return (
            <div key={domain.id} className="space-y-2">
              <button
                onClick={() => handleDomainClick(domain.id)}
                className={`w-full p-6 rounded-xl border-2 transition-all relative ${
                  isSelected ? 'shadow-lg' : 'hover:border-slate-300'
                }`}
                style={{
                  borderColor: isSelected ? brand.primaryColor : '#e2e8f0',
                  backgroundColor: isSelected ? brand.accentBackground : '#ffffff'
                }}
              >
                {/* Checkmark */}
                {isSelected && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: brand.primaryColor }}
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}

                <div className="space-y-2">
                  <div
                    className="w-12 h-12 rounded-lg mx-auto flex items-center justify-center text-2xl"
                    style={{
                      backgroundColor: isSelected ? brand.primaryColor : brand.accentBackground
                    }}
                  >
                    {domain.id === 'web-dev' && '💻'}
                    {domain.id === 'data-science' && '📊'}
                    {domain.id === 'ai-ml' && '🤖'}
                    {domain.id === 'mobile-dev' && '📱'}
                    {domain.id === 'devops' && '⚙️'}
                    {domain.id === 'cybersecurity' && '🔒'}
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 text-center">
                    {domain.title}
                  </h2>
                  {hasSubDomains && isSelected && (
                    <div className="flex justify-center pt-1">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        style={{ color: brand.primaryColor }}
                      />
                    </div>
                  )}
                </div>
              </button>

              {/* Sub-domains */}
              {isSelected && isExpanded && hasSubDomains && (
                <div className="space-y-2 pl-2">
                  {domain.subDomains?.map((subDomain) => {
                    const isSubSelected = selectedSubDomain === subDomain;
                    return (
                      <button
                        key={subDomain}
                        onClick={() => handleSubDomainClick(domain.id, subDomain)}
                        className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                          isSubSelected
                            ? 'text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                        style={{
                          backgroundColor: isSubSelected ? brand.primaryColor : undefined
                        }}
                      >
                        {subDomain}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
