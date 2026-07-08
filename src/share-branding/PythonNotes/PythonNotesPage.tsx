'use client';

import React, { useState } from 'react';
import { BrandProvider, useBrand } from '../PostLandingPage/app/context/BrandContext';
import { BrandConfig } from '../brandConfig';
import { pythonChapters } from './pythonNotesContent';
import { ChevronRight, Code, BookOpen, Brain, Terminal, Info, AlertTriangle, Lightbulb } from 'lucide-react';

function PythonNotesContent() {
  const brand = useBrand();
  const [activeChapter, setActiveChapter] = useState(pythonChapters[0]?.id || 'intro');

  const currentChapter = pythonChapters.find((c) => c.id === activeChapter);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar Navigation */}
      <aside className="fixed bottom-0 left-0 top-0 hidden w-64 overflow-y-auto border-r border-gray-200 bg-white p-6 shadow-sm lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white shadow-md"
            style={{ backgroundColor: brand.primaryColor }}
          >
            {brand.brandMark}
          </div>
          <span className="text-xl font-bold tracking-tight">{brand.name}</span>
        </div>
        
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
          Learning Path
        </h3>
        
        <nav className="space-y-1">
          {pythonChapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => setActiveChapter(chapter.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                activeChapter === chapter.id
                  ? 'bg-opacity-10 text-opacity-100'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              style={
                activeChapter === chapter.id
                  ? { backgroundColor: `${brand.primaryColor}20`, color: brand.primaryColorDark }
                  : {}
              }
            >
              <span className="truncate">{chapter.title}</span>
              {activeChapter === chapter.id && <ChevronRight size={16} />}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64">
        {/* Hero Section */}
        <div 
          className="relative overflow-hidden bg-gradient-to-br px-8 py-16 sm:px-16"
          style={{ backgroundImage: `linear-gradient(to bottom right, ${brand.primaryColor}, ${brand.primaryColorDark})` }}
        >
          <div className="relative z-10 mx-auto max-w-4xl text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-md">
              <BookOpen size={16} />
              <span>{brand.tutorBadgeText}</span>
            </div>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Python Masterclass
            </h1>
            <p className="max-w-2xl text-lg text-white/90 sm:text-xl">
              Enterprise-grade documentation and deep-dive engineering notes designed for the <strong>{brand.ecosystemLabel}</strong>.
            </p>
          </div>
        </div>

        {/* Article Content */}
        <div className="mx-auto max-w-4xl px-8 py-12 sm:px-16">
          {currentChapter ? (
            <article className="prose prose-lg max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-h3:text-2xl prose-h4:text-xl prose-a:text-blue-600 hover:prose-a:text-blue-800">
              <h1 className="mb-8 text-4xl font-extrabold text-gray-900">{currentChapter.title}</h1>
              
              {/* Sections rendering logic */}
              {currentChapter.sections.map((section: any, idx: number) => (
                <section key={idx} className="mb-12">
                  {section.type === 'heading2' && <h2 className="mt-12 mb-6 border-b border-gray-200 pb-2 text-3xl font-bold">{section.content}</h2>}
                  {section.type === 'heading3' && <h3 className="mt-8 mb-4 text-2xl font-bold">{section.content}</h3>}
                  {section.type === 'paragraph' && (
                    <div className="mb-6 leading-relaxed text-gray-700" dangerouslySetInnerHTML={{ __html: section.content }} />
                  )}
                  {section.type === 'code' && (
                    <div className="my-6 overflow-hidden rounded-xl bg-gray-900 shadow-lg">
                      <div className="flex items-center gap-2 bg-gray-800 px-4 py-3 text-xs text-gray-400">
                        <Terminal size={14} />
                        <span>{section.language || 'python'}</span>
                      </div>
                      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-100">
                        <code>{section.content}</code>
                      </pre>
                      {section.output && (
                        <div className="border-t border-gray-700 bg-black p-4 font-mono text-sm text-green-400">
                          <span className="text-gray-500">Output: </span><br/>
                          {section.output}
                        </div>
                      )}
                    </div>
                  )}
                  {section.type === 'info-box' && (
                    <div className="my-8 flex gap-4 rounded-xl border border-blue-200 bg-blue-50 p-6">
                      <Info className="flex-shrink-0 text-blue-500" size={24} />
                      <div>
                        <h4 className="mb-2 text-lg font-bold text-blue-900">{section.title}</h4>
                        <div className="text-blue-800" dangerouslySetInnerHTML={{ __html: section.content }} />
                      </div>
                    </div>
                  )}
                  {section.type === 'warning-box' && (
                    <div className="my-8 flex gap-4 rounded-xl border border-orange-200 bg-orange-50 p-6">
                      <AlertTriangle className="flex-shrink-0 text-orange-500" size={24} />
                      <div>
                        <h4 className="mb-2 text-lg font-bold text-orange-900">{section.title}</h4>
                        <div className="text-orange-800" dangerouslySetInnerHTML={{ __html: section.content }} />
                      </div>
                    </div>
                  )}
                  {section.type === 'interview-tip' && (
                    <div className="my-8 flex gap-4 rounded-xl border border-purple-200 bg-purple-50 p-6">
                      <Brain className="flex-shrink-0 text-purple-600" size={24} />
                      <div>
                        <h4 className="mb-2 text-lg font-bold text-purple-900">FAANG Interview Tip</h4>
                        <div className="text-purple-800" dangerouslySetInnerHTML={{ __html: section.content }} />
                      </div>
                    </div>
                  )}
                  {section.type === 'best-practice' && (
                    <div className="my-8 flex gap-4 rounded-xl border border-green-200 bg-green-50 p-6">
                      <Lightbulb className="flex-shrink-0 text-green-600" size={24} />
                      <div>
                        <h4 className="mb-2 text-lg font-bold text-green-900">Engineering Best Practice</h4>
                        <div className="text-green-800" dangerouslySetInnerHTML={{ __html: section.content }} />
                      </div>
                    </div>
                  )}
                  {section.type === 'ascii-diagram' && (
                    <div className="my-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 border-b border-gray-200">
                        {section.title || 'Diagram'}
                      </div>
                      <pre className="overflow-x-auto p-6 font-mono text-xs leading-none text-gray-800 bg-gray-50">
                        {section.content}
                      </pre>
                    </div>
                  )}
                </section>
              ))}
            </article>
          ) : (
            <div className="text-center text-gray-500">Select a chapter to begin reading.</div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PythonNotesPage({ config }: { config: BrandConfig }) {
  return (
    <BrandProvider brand={config}>
      <PythonNotesContent />
    </BrandProvider>
  );
}
