/**
 * Tutorial Preview Pane Component
 * 
 * Displays live preview of either:
 * - Active block being edited
 * - Full document with all blocks
 */

import { TutorialBlockRenderer } from '@quiz/ui';
import { TutorialSummaryContent } from '@/share-branding/LearningExperience/components/TutorialSummaryContent';
import type {
  BrandTutorialTheme,
  TutorialPageContentType,
  TutorialSidebarBrandId,
  TutorialSummaryPayload,
  TutorialBlock,
  DefinitionD1AuthorContent,
} from '@quiz/types';

import { toCanonicalCodeC1 } from '../blocks/code/C1/codeC1.converter';
import { themeForBrand } from '../theme/brandTheme';
import type { BlockInstance } from '../document/documentTransformation';

interface TutorialPreviewPaneProps {
  // Header
  subtopicName: string;
  
  // Mode control
  previewMode: 'document' | 'active-block';
  onPreviewModeChange: (mode: 'document' | 'active-block') => void;
  
  // Document preview
  documentBlocks: BlockInstance[];
  
  // Active block preview
  activeBlockType: TutorialPageContentType;
  activeBlockVersion: string; // version code (e.g., "C1")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Preserving existing untyped payload from parent
  activeBlockPreview: any;
  
  // Rendering dependencies
  brandId: TutorialSidebarBrandId;
}

export function TutorialPreviewPane({
  subtopicName,
  previewMode,
  onPreviewModeChange,
  documentBlocks,
  activeBlockType,
  activeBlockVersion,
  activeBlockPreview,
  brandId,
}: TutorialPreviewPaneProps) {
  const theme: BrandTutorialTheme = themeForBrand(brandId);

  return (
    <section className="space-y-4 min-w-0">
      {/* Preview Header with Mode Switcher */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-4 text-sm font-bold text-[#071f63] shadow-xl border-t border-white/60 -translate-y-1 flex flex-wrap items-center justify-between gap-2">
        <span className="truncate">Preview Target: {subtopicName || 'Select a subtopic'}</span>
        
        {/* Preview Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onPreviewModeChange('document')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              previewMode === 'document'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Full Document ({documentBlocks.length})
          </button>
          <button
            type="button"
            onClick={() => onPreviewModeChange('active-block')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              previewMode === 'active-block'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active Block ({activeBlockVersion})
          </button>
        </div>
      </div>

      {/* Live Rendered Content Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl min-h-[600px] overflow-y-auto space-y-8">
        {previewMode === 'active-block' ? (
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Active Editor Preview</span>
              <span>{activeBlockVersion} Block</span>
            </div>
            {activeBlockType === 'definition' && (
              <TutorialBlockRenderer
                block={{
                  id: 'preview',
                  type: 'definition',
                  version: activeBlockVersion,
                  content: activeBlockPreview as DefinitionD1AuthorContent,
                } as TutorialBlock}
                theme={theme}
                depth={0}
              />
            )}
            {activeBlockType === 'code' && (
              <TutorialBlockRenderer
                block={{
                  id: 'preview',
                  type: 'code',
                  version: activeBlockVersion,
                  content: toCanonicalCodeC1(activeBlockPreview).content,
                } as TutorialBlock}
                theme={theme}
                depth={0}
              />
            )}
            {activeBlockType === 'summary' && (
              <TutorialSummaryContent 
                payload={activeBlockPreview as TutorialSummaryPayload} 
                theme={theme} 
              />
            )}
          </div>
        ) : (
          documentBlocks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No blocks in document yet. Add blocks from the left authoring panel to preview the full document.
            </div>
          ) : (
            <>
              {documentBlocks.map((instance, idx) => (
                <div
                  key={instance.id}
                  className="relative"
                  data-tutorial-block-id={instance.id}
                >
                  {idx > 0 && <div className="my-8 border-t border-dashed border-slate-200" />}
                  
                  {instance.type === 'definition' && (
                    <div data-tutorial-block-type="definition">
                      <TutorialBlockRenderer
                        block={{
                          id: instance.id,
                          type: 'definition',
                          version: instance.versionCode,
                          content: instance.payload as DefinitionD1AuthorContent,
                        } as TutorialBlock}
                        theme={theme}
                        depth={0}
                      />
                    </div>
                  )}
                  
                  {instance.type === 'code' && (
                    <div data-tutorial-block-type="code">
                      <TutorialBlockRenderer
                        block={{
                          id: instance.id,
                          type: 'code',
                          version: instance.versionCode,
                          content: toCanonicalCodeC1(instance.payload).content,
                        } as TutorialBlock}
                        theme={theme}
                        depth={0}
                      />
                    </div>
                  )}
                  
                  {instance.type === 'summary' && (
                    <div data-tutorial-block-type="summary">
                      <TutorialSummaryContent 
                        payload={instance.payload as TutorialSummaryPayload} 
                        theme={theme} 
                      />
                    </div>
                  )}
                </div>
              ))}
            </>
          )
        )}
      </div>
    </section>
  );
}
