'use client';

import React from 'react';

type FilterKey = 'all' | 'learning' | 'projects' | 'tools' | 'career';

interface MobileFilterProps {
  showMobileFilter: boolean;
  activeFilter: FilterKey;
  filterOptions: Array<{ key: string; label: string }>;
  onFilterClick: (key: FilterKey) => void;
  onClose: () => void;
}

export const MobileFilter: React.FC<MobileFilterProps> = ({
  showMobileFilter,
  activeFilter,
  filterOptions,
  onFilterClick,
  onClose
}) => {
  if (!showMobileFilter) {
    console.log('MobileFilter: not showing because showMobileFilter is false');
    return null;
  }

  console.log('MobileFilter: rendering with showMobileFilter =', showMobileFilter);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'stretch'
    }}>
      <div style={{
        width: '80%',
        maxWidth: '300px',
        backgroundColor: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Filter</h2>
          <button onClick={onClose} style={{ padding: '8px', borderRadius: '50%' }}>
            ✕
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filterOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => onFilterClick(option.key as FilterKey)}
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                backgroundColor: activeFilter === option.key ? '#4B49AC' : '#f3f4f6',
                color: activeFilter === option.key ? 'white' : 'black',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '5px' }}>Currently viewing:</div>
          <div style={{ padding: '8px 12px', backgroundColor: '#dbeafe', borderRadius: '6px' }}>
            <span style={{ fontWeight: 'bold', color: '#1e40af' }}>
              {filterOptions.find(opt => opt.key === activeFilter)?.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};