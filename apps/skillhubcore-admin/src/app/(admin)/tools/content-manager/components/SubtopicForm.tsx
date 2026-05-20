'use client';

import React from 'react';
import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { SubtopicInfo } from './types';

interface SubtopicFormProps {
  subtopicInfo: SubtopicInfo;
  setSubtopicInfo: React.Dispatch<React.SetStateAction<SubtopicInfo>>;
  isFetchingSubsection: boolean;
  createSubtopic: () => void;
  loadSubtopic: () => void;
}

export function SubtopicForm({
  subtopicInfo,
  setSubtopicInfo,
  isFetchingSubsection,
  createSubtopic,
  loadSubtopic
}: SubtopicFormProps) {
  const brand = useBrand();

  return (
    <section className="mb-8 rounded-2xl bg-white p-8 shadow-lg border border-slate-100">
      <h2 className="mb-6 text-2xl font-bold text-gray-800 font-outfit">Step 1: Create New Subtopic</h2>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="subtopicId" className="mb-2 block text-sm font-semibold text-gray-700">
            Subtopic ID <span className="text-red-500">*</span>
          </label>
          <input
            id="subtopicId"
            type="text"
            value={subtopicInfo.subtopicId}
            onChange={(event) => setSubtopicInfo((prev) => ({ ...prev, subtopicId: event.target.value.toLowerCase() }))}
            placeholder="javascript-promises"
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">Lowercase with hyphens, used in the learner URL</p>
        </div>

        <div>
          <label htmlFor="domain" className="mb-2 block text-sm font-semibold text-gray-700">
            Domain <span className="text-red-500">*</span>
          </label>
          <input
            id="domain"
            type="text"
            value={subtopicInfo.domain}
            onChange={(event) => setSubtopicInfo((prev) => ({ ...prev, domain: event.target.value }))}
            placeholder="Programming"
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="subject" className="mb-2 block text-sm font-semibold text-gray-700">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            value={subtopicInfo.subject}
            onChange={(event) => setSubtopicInfo((prev) => ({ ...prev, subject: event.target.value }))}
            placeholder="JavaScript"
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="topic" className="mb-2 block text-sm font-semibold text-gray-700">
            Topic <span className="text-red-500">*</span>
          </label>
          <input
            id="topic"
            type="text"
            value={subtopicInfo.topic}
            onChange={(event) => setSubtopicInfo((prev) => ({ ...prev, topic: event.target.value }))}
            placeholder="Asynchronous JavaScript"
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="subtopic" className="mb-2 block text-sm font-semibold text-gray-700">
            Subtopic Name <span className="text-red-500">*</span>
          </label>
          <input
            id="subtopic"
            type="text"
            value={subtopicInfo.subtopic}
            onChange={(event) => setSubtopicInfo((prev) => ({ ...prev, subtopic: event.target.value }))}
            placeholder="Promises & Futures"
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          onClick={loadSubtopic}
          className="flex-1 rounded-xl bg-slate-800 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-slate-900"
          disabled={isFetchingSubsection}
        >
          {isFetchingSubsection ? 'Loading...' : 'Load Existing Subtopic'}
        </button>
        <button
          onClick={createSubtopic}
          className="flex-1 rounded-xl py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl"
          style={{ backgroundColor: brand.primaryColor }}
        >
          Continue to Sections
        </button>
      </div>
    </section>
  );
}
