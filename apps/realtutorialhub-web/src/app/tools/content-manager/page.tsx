'use client';

import React, { useState } from 'react';
import { useBrand, BrandProvider } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { rthConfig } from '@/share-branding/brandConfig';

type SectionType = 'overview' | 'notes' | 'layman' | 'reallife' | 'technical' | 'code' | 'assignment' | 'project' | 'quiz' | 'visual' | 'practice';

interface SubtopicInfo {
  subtopicId: string;
  domain: string;
  subject: string;
  topic: string;
  subtopic: string;
}

interface SectionStatus {
  overview: boolean;
  notes: boolean;
  layman: boolean;
  reallife: boolean;
  technical: boolean;
  code: boolean;
  assignment: boolean;
  project: boolean;
  quiz: boolean;
  visual: boolean;
  practice: boolean;
}

function ContentManagerContent() {
  const brand = useBrand();
  
  // Step 1: Basic Info
  const [subtopicInfo, setSubtopicInfo] = useState<SubtopicInfo>({
    subtopicId: '',
    domain: '',
    subject: '',
    topic: '',
    subtopic: ''
  });
  
  const [isSubtopicCreated, setIsSubtopicCreated] = useState(false);
  
  // Step 2: Section Management
  const [selectedSection, setSelectedSection] = useState<SectionType>('notes');
  const [jsonInput, setJsonInput] = useState('');
  const [sectionStatus, setSectionStatus] = useState<SectionStatus>({
    overview: false,
    notes: false,
    layman: false,
    reallife: false,
    technical: false,
    code: false,
    assignment: false,
    project: false,
    quiz: false,
    visual: false,
    practice: false
  });
  
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const sections = [
    { id: 'overview' as SectionType, label: 'Overview/Main Content', icon: '📋' },
    { id: 'notes' as SectionType, label: 'Notes Section', icon: '📝' },
    { id: 'layman' as SectionType, label: 'Layman Explanation', icon: '💡' },
    { id: 'reallife' as SectionType, label: 'Real Life Examples', icon: '🌍' },
    { id: 'technical' as SectionType, label: 'Technical Deep Dive', icon: '🔧' },
    { id: 'code' as SectionType, label: 'Code Example', icon: '💻' },
    { id: 'assignment' as SectionType, label: 'Assignment', icon: '📚' },
    { id: 'project' as SectionType, label: 'Project', icon: '🚀' },
    { id: 'quiz' as SectionType, label: 'Quiz', icon: '❓' },
    { id: 'visual' as SectionType, label: 'Visual Explanation', icon: '📊' },
    { id: 'practice' as SectionType, label: 'Practice Test', icon: '✍️' }
  ];

  const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const createSubtopic = () => {
    if (!subtopicInfo.subtopicId || !subtopicInfo.domain || !subtopicInfo.subject || 
        !subtopicInfo.topic || !subtopicInfo.subtopic) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    // Validate subtopic ID format (lowercase, hyphens only)
    const idRegex = /^[a-z0-9-]+$/;
    if (!idRegex.test(subtopicInfo.subtopicId)) {
      showMessage('Subtopic ID must be lowercase with hyphens only (e.g., javascript-promises)', 'error');
      return;
    }

    setIsSubtopicCreated(true);
    showMessage('Subtopic created! Now add content sections one by one.', 'success');
  };

  const validateJSON = () => {
    if (!jsonInput.trim()) {
      showMessage('Please paste JSON content', 'error');
      return false;
    }

    try {
      JSON.parse(jsonInput);
      showMessage('✓ Valid JSON!', 'success');
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
        body: JSON.stringify({
          subtopicId: subtopicInfo.subtopicId,
          subtopicInfo: subtopicInfo,
          section: selectedSection,
          content: JSON.parse(jsonInput)
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSectionStatus(prev => ({ ...prev, [selectedSection]: true }));
        setJsonInput('');
        showMessage(`✓ ${sections.find(s => s.id === selectedSection)?.label} added successfully!`, 'success');
      } else {
        showMessage(`Error: ${result.error}`, 'error');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(`Error: ${errorMessage}`, 'error');
    }
  };

  const getPageUrl = () => {
    return `http://localhost:3003/start-learning/subtopic/${subtopicInfo.subtopicId}`;
  };

  const openPreview = () => {
    window.open(getPageUrl(), '_blank');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="p-8 text-center" style={{ backgroundColor: brand.primaryColor }}>
            <h1 className="text-4xl font-bold text-white mb-3">📝 Content Manager</h1>
            <p className="text-white text-lg font-semibold">Add AI-generated content phase by phase</p>
          </div>
        </header>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            messageType === 'success' ? 'bg-green-50 border-l-4 border-green-500 text-green-800' :
            messageType === 'error' ? 'bg-red-50 border-l-4 border-red-500 text-red-800' :
            'bg-blue-50 border-l-4 border-blue-500 text-blue-800'
          }`}>
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {!isSubtopicCreated && (
          <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 1: Create New Subtopic</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="subtopicId" className="block text-sm font-semibold text-gray-700 mb-2">
                  Subtopic ID <span className="text-red-500">*</span>
                </label>
                <input
                  id="subtopicId"
                  type="text"
                  value={subtopicInfo.subtopicId}
                  onChange={(e) => setSubtopicInfo(prev => ({ ...prev, subtopicId: e.target.value.toLowerCase() }))}
                  placeholder="javascript-promises"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase with hyphens (used in URL)</p>
              </div>

              <div>
                <label htmlFor="domain" className="block text-sm font-semibold text-gray-700 mb-2">
                  Domain <span className="text-red-500">*</span>
                </label>
                <input
                  id="domain"
                  type="text"
                  value={subtopicInfo.domain}
                  onChange={(e) => setSubtopicInfo(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="Programming"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subtopicInfo.subject}
                  onChange={(e) => setSubtopicInfo(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="JavaScript"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="topic" className="block text-sm font-semibold text-gray-700 mb-2">
                  Topic <span className="text-red-500">*</span>
                </label>
                <input
                  id="topic"
                  type="text"
                  value={subtopicInfo.topic}
                  onChange={(e) => setSubtopicInfo(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="Asynchronous Programming"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="subtopicName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Subtopic Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="subtopicName"
                  type="text"
                  value={subtopicInfo.subtopic}
                  onChange={(e) => setSubtopicInfo(prev => ({ ...prev, subtopic: e.target.value }))}
                  placeholder="JavaScript Promises"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={createSubtopic}
              className="w-full py-4 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Create Subtopic
            </button>
          </section>
        )}

        {/* Step 2: Add Sections */}
        {isSubtopicCreated && (
          <>
            {/* Progress Status */}
            <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Content Progress</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {sections.map(section => (
                  <div
                    key={section.id}
                    className={`p-4 rounded-lg border-2 ${
                      sectionStatus[section.id]
                        ? 'bg-green-50 border-green-500'
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{section.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{section.label}</p>
                        <p className={`text-xs ${sectionStatus[section.id] ? 'text-green-600' : 'text-gray-500'}`}>
                          {sectionStatus[section.id] ? '✓ Added' : '⏳ Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-blue-900 font-medium">
                  🔗 Page URL: <a href={getPageUrl()} target="_blank" rel="noopener noreferrer" className="underline">{getPageUrl()}</a>
                </p>
                <button
                  onClick={openPreview}
                  className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Preview Page in New Tab
                </button>
              </div>
            </section>

            {/* Add Section Form */}
            <section className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 2: Add Content Section</h2>

              <div className="mb-6">
                <label htmlFor="sectionSelect" className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Section to Add
                </label>
                <select
                  id="sectionSelect"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value as SectionType)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base"
                >
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.icon} {section.label} {sectionStatus[section.id] ? '(✓ Added)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="jsonInput" className="block text-sm font-semibold text-gray-700 mb-3">
                  Paste AI-Generated JSON
                </label>
                <textarea
                  id="jsonInput"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='{"notes": {"coreDefinition": {...}}}'
                  className="w-full h-96 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={validateJSON}
                  className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  Validate JSON
                </button>
                <button
                  onClick={addSection}
                  className="flex-1 py-3 text-white rounded-lg hover:shadow-xl transition-all font-semibold"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  Add This Section
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
