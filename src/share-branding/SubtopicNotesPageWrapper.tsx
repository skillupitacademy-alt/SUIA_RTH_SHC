/**
 * SubtopicNotesPageWrapper
 * 
 * Wrapper component that loads data from API instead of static files
 * This is the new entry point for the tutorial page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { SubtopicNotesPage } from './SubtopicNotesPage';
import { loadSubtopicNotesDataFromAPI } from './subtopicNotesDataAPI';
import { loadSubtopicNotesData, SubtopicNotesViewData } from './subtopicNotesData';
import { useBrand } from './PostLandingPage/app/context/BrandContext';

export interface SubtopicNotesPageWrapperProps {
  subtopicId: string;
  overviewData: any;
  useAPI?: boolean; // Toggle between API and static files
}

export function SubtopicNotesPageWrapper({ 
  subtopicId, 
  overviewData,
  useAPI = false // Default to static files for now, can be toggled via feature flag
}: SubtopicNotesPageWrapperProps) {
  const brand = useBrand();
  const [notesData, setNotesData] = useState<SubtopicNotesViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        let data: SubtopicNotesViewData;
        
        if (useAPI) {
          // Load from database via API
          console.log('[SubtopicNotesPageWrapper] Loading from API:', subtopicId);
          data = await loadSubtopicNotesDataFromAPI(brand, subtopicId);
        } else {
          // Load from static files
          console.log('[SubtopicNotesPageWrapper] Loading from static files:', subtopicId);
          data = await loadSubtopicNotesData(brand, subtopicId);
        }
        
        setNotesData(data);
      } catch (err) {
        console.error('[SubtopicNotesPageWrapper] Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [subtopicId, brand, useAPI]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" 
               style={{ borderColor: `${brand.primaryColor} transparent ${brand.primaryColor} ${brand.primaryColor}` }}
               role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error && !notesData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-red-800">Failed to Load Content</h2>
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg px-4 py-2 text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!notesData) {
    return null;
  }

  return (
    <SubtopicNotesPage 
      notesData={notesData} 
      overviewData={overviewData}
      subtopicId={subtopicId}
    />
  );
}
