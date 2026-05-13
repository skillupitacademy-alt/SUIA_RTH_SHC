'use client';

import React, { useState } from 'react';
import { BrandProvider, useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { rthConfig } from '@/share-branding/brandConfig';
import {
  TUTORIAL_CONTENT_MANAGER_SECTION_OPTIONS,
  TUTORIAL_SECTION_TABS,
  type TutorialContentManagerSectionId,
} from '@quiz/types';

type SectionType = TutorialContentManagerSectionId;

interface SubtopicInfo {
  subtopicId: string;
  domain: string;
  subject: string;
  topic: string;
  subtopic: string;
}

interface AddSectionResponse {
  error?: string;
  details?: string;
  url?: string;
}

type SectionStatus = Record<SectionType, boolean>;

const sections = TUTORIAL_CONTENT_MANAGER_SECTION_OPTIONS;
const sectionTabs = TUTORIAL_SECTION_TABS;

const initialSectionStatus = sections.reduce((status, section) => ({
  ...status,
  [section.id]: false,
}), {} as SectionStatus);

function ContentManagerContent() {
  const brand = useBrand();
  const [subtopicInfo, setSubtopicInfo] = useState<SubtopicInfo>({
    subtopicId: '',
    domain: '',
    subject: '',
    topic: '',
    subtopic: '',
  });
  const [isSubtopicCreated, setIsSubtopicCreated] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SectionType>('notes');
  const [jsonInput, setJsonInput] = useState('');
  const [sectionStatus, setSectionStatus] = useState<SectionStatus>(initialSectionStatus);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const selectedSectionLabel = sections.find((section) => section.id === selectedSection)?.label ?? selectedSection;

  const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const createSubtopic = () => {
    const hasRequiredFields = Boolean(
      subtopicInfo.subtopicId &&
      subtopicInfo.domain &&
      subtopicInfo.subject &&
      subtopicInfo.topic &&
      subtopicInfo.subtopic
    );
    if (!hasRequiredFields) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    const idRegex = /^[a-z0-9-]+$/;
    if (!idRegex.test(subtopicInfo.subtopicId)) {
      showMessage('Subtopic ID must be lowercase with hyphens only, for example javascript-promises', 'error');
      return;
    }

    setIsSubtopicCreated(true);
    showMessage('Subtopic ready. Add content one section at a time.', 'success');
  };

  const validateJSON = () => {
    if (!jsonInput.trim()) {
      showMessage('Please paste JSON content', 'error');
      return false;
    }

    try {
      JSON.parse(jsonInput);
      showMessage('Valid JSON', 'success');
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(`Invalid JSON: ${errorMessage}`, 'error');
      return false;
    }
  };

  const addSection = async () => {
    if (!validateJSON()) return;

    try {
      const response = await fetch('/api/content-manager/add-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subtopicId: subtopicInfo.subtopicId,
          subtopicInfo,
          section: selectedSection,
          content: JSON.parse(jsonInput),
        }),
      });

      const result = await response.json() as AddSectionResponse;

      if (response.ok) {
        setSectionStatus((prev) => ({ ...prev, [selectedSection]: true }));
        setJsonInput('');
        showMessage(`${selectedSectionLabel} saved to tutorial_sections.`, 'success');
      } else {
        const details = result.details ? ` ${result.details}` : '';
        showMessage(`Error: ${result.error ?? 'Failed to save section'}${details}`, 'error');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(`Error: ${errorMessage}`, 'error');
    }
  };

  const getPageUrl = (section?: SectionType) => {
    const baseUrl = `https://user.realtutorialhub.com/start-learning/subtopic/${subtopicInfo.subtopicId}`;
    return section ? `${baseUrl}?tab=${sectionTabs[section]}` : baseUrl;
  };

  const openPreview = (section?: SectionType) => {
    window.open(getPageUrl(section), '_blank');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="p-8 text-center" style={{ backgroundColor: brand.primaryColor }}>
            <h1 className="mb-3 text-4xl font-bold text-white">Content Manager</h1>
            <p className="text-lg font-semibold text-white">Add AI-generated tutorial content one section at a time</p>
          </div>
        </header>

        {message ? (
          <div
            className={`mb-6 rounded-lg p-4 ${
              messageType === 'success'
                ? 'border-l-4 border-green-500 bg-green-50 text-green-800'
                : messageType === 'error'
                  ? 'border-l-4 border-red-500 bg-red-50 text-red-800'
                  : 'border-l-4 border-blue-500 bg-blue-50 text-blue-800'
            }`}
          >
            <p className="font-medium">{message}</p>
          </div>
        ) : null}

        {!isSubtopicCreated ? (
          <section className="mb-8 rounded-2xl bg-white p-8 shadow-lg">
            <h2 className="mb-6 text-2xl font-bold text-gray-800">Step 1: Create New Subtopic</h2>

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
                  placeholder="Asynchronous Programming"
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="subtopicName" className="mb-2 block text-sm font-semibold text-gray-700">
                  Subtopic Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="subtopicName"
                  type="text"
                  value={subtopicInfo.subtopic}
                  onChange={(event) => setSubtopicInfo((prev) => ({ ...prev, subtopic: event.target.value }))}
                  placeholder="JavaScript Promises"
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={createSubtopic}
              className="w-full rounded-xl py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Continue to Sections
            </button>
          </section>
        ) : (
          <>
            <section className="mb-8 rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-bold text-gray-800">Content Progress</h2>

              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`rounded-lg border-2 p-4 ${
                      sectionStatus[section.id] ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 min-w-8 items-center justify-center rounded bg-white px-2 text-xs font-bold text-gray-700 shadow-sm">
                        {section.marker}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800">{section.label}</p>
                        <p className={`text-xs ${sectionStatus[section.id] ? 'text-green-600' : 'text-gray-500'}`}>
                          {sectionStatus[section.id] ? 'Saved' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-4">
                <p className="font-medium text-blue-900">
                  Page URL:{' '}
                  <a href={getPageUrl()} target="_blank" rel="noopener noreferrer" className="underline">
                    {getPageUrl()}
                  </a>
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    onClick={() => openPreview()}
                    className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Preview Page
                  </button>
                  <button
                    onClick={() => openPreview(selectedSection)}
                    className="rounded-lg bg-slate-800 px-6 py-2 font-semibold text-white transition-colors hover:bg-slate-900"
                  >
                    Preview Selected Section
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-lg">
              <h2 className="mb-6 text-2xl font-bold text-gray-800">Step 2: Add Content Section</h2>

              <div className="mb-6">
                <label htmlFor="sectionSelect" className="mb-3 block text-sm font-semibold text-gray-700">
                  Select Section to Add
                </label>
                <select
                  id="sectionSelect"
                  value={selectedSection}
                  onChange={(event) => setSelectedSection(event.target.value as SectionType)}
                  className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.marker} {section.label} {sectionStatus[section.id] ? '(Saved)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="jsonInput" className="mb-3 block text-sm font-semibold text-gray-700">
                  Paste AI-Generated JSON
                </label>
                <textarea
                  id="jsonInput"
                  value={jsonInput}
                  onChange={(event) => setJsonInput(event.target.value)}
                  placeholder='{"notes": {"schemaVersion": 1, "sectionType": "notes", "simpleWords": "...", "definitionBlock": {...}, "sections": [...]}}'
                  className="h-96 w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={validateJSON}
                  className="flex-1 rounded-lg bg-gray-600 py-3 font-semibold text-white transition-colors hover:bg-gray-700"
                >
                  Validate JSON
                </button>
                <button
                  onClick={addSection}
                  className="flex-1 rounded-lg py-3 font-semibold text-white transition-all hover:shadow-xl"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  Save This Section
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default function ContentManagerPage() {
  return (
    <BrandProvider brand={rthConfig}>
      <ContentManagerContent />
    </BrandProvider>
  );
}
