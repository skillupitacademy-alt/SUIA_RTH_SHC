import { Zap } from 'lucide-react';
import type { PromptManagementTabProps } from './types';

export function PromptManagementTabContent({
  isUiUxMode,
  adminSectionId,
  selectedComponentKey,
  formatTitle,
  selectedPipelineSubsectionKey,
  dummyContext,
  selectedComponentData,
  selectedRendererMapping,
  selectedWorkflowUrls,
  openWorkflowUrl,
}: PromptManagementTabProps) {
  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isUiUxMode ? 'UI/UX Prompt Management Bridge' : 'Prompt Management Bridge'}
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              This tab does not replace the Prompt Generator page. It decides what selected{' '}
              {isUiUxMode ? 'UI/UX architecture' : 'architecture'} context will be sent to Prompt
              Generator for this component.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openWorkflowUrl(selectedWorkflowUrls.promptGenerator)}
            className="px-5 py-3 rounded-xl bg-amber-500 text-white text-sm font-black hover:bg-amber-600 flex items-center justify-center gap-2"
          >
            <Zap size={16} /> Open Prompt Generator
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-900 mb-5">Selected Prompt Target</h3>
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Section
              </span>
              <p className="font-black text-slate-900">{String(adminSectionId)}</p>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Component
              </span>
              <p className="font-black text-slate-900">
                {selectedComponentKey ? formatTitle(selectedComponentKey) : 'Full section'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Prompt Contract Key
              </span>
              <p className="font-mono text-xs font-black text-indigo-700">
                {String(adminSectionId)}.
                {selectedPipelineSubsectionKey || selectedComponentKey || 'full_section'}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Dummy Topic
              </span>
              <p className="font-bold text-slate-700">
                {dummyContext.domain} / {dummyContext.subject} / {dummyContext.subtopic}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Prompt URL
              </span>
              <p className="break-all font-mono text-xs text-indigo-700">
                {selectedWorkflowUrls.promptGenerator}
              </p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Prompt Context That Will Be Sent
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {isUiUxMode ? 'UI/UX Component Role' : 'Educational Component Role'}
              </span>
              <p className="text-sm font-bold text-slate-800 mt-2 leading-relaxed">
                {isUiUxMode
                  ? String(
                      selectedComponentData?.component ||
                        selectedComponentData?.purpose ||
                        'UI purpose not configured.'
                    )
                  : selectedComponentData?.purpose || 'Purpose not configured.'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Renderer/UI Decision
              </span>
              <p className="text-sm font-bold text-slate-800 mt-2 leading-relaxed">
                {selectedComponentData?.renderer ||
                  ((selectedRendererMapping as Record<string, unknown> | null)
                    ?.component as string) ||
                  'Default renderer'}
              </p>
            </div>
          </div>
          <div className="bg-slate-950 rounded-xl p-4">
            <pre className="text-xs text-emerald-300 overflow-auto max-h-[360px]">
              {JSON.stringify(
                {
                  section: adminSectionId,
                  subsection: selectedPipelineSubsectionKey || selectedComponentKey,
                  dummyContext,
                  educationalComponent: selectedComponentData,
                  rendererMapping: selectedRendererMapping,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
