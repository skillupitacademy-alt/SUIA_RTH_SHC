/**
 * Tutorial Preview Pane Component
 * 
 * Displays live preview of either:
 * - Active block being edited
 * - Full document with all blocks
 */

import { TutorialBlockRenderer } from '@quiz/ui';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { TutorialSummaryContent } from '@/share-branding/LearningExperience/components/TutorialSummaryContent';
import type {
  BrandTutorialTheme,
  TutorialPageContentType,
  TutorialSidebarBrandId,
  TutorialSummaryPayload,
  TutorialBlock,
  DefinitionD1AuthorContent,
  IntroductionI1AuthorContent,
} from '@quiz/types';

import { themeForBrand } from '../theme/brandTheme';
import type { BlockInstance } from '../document/documentTransformation';
import { toTutorialBlock } from '../document/documentTransformation';

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

interface PreviewErrorBoundaryProps {
  children: ReactNode;
  resetKey: string;
}

interface PreviewErrorBoundaryState {
  error: Error | null;
}

class PreviewErrorBoundary extends Component<PreviewErrorBoundaryProps, PreviewErrorBoundaryState> {
  state: PreviewErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): PreviewErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[TutorialPreviewPane] Block preview failed:', error, errorInfo);
  }

  componentDidUpdate(previousProps: PreviewErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          This block cannot be previewed until its content is corrected: {this.state.error.message}
        </div>
      );
    }

    return this.props.children;
  }
}

function getEffectiveBlockInfo(
  defaultType: TutorialPageContentType,
  defaultVersion: string,
  payload: any
): { type: TutorialPageContentType; version: string } {
  const detectedType = payload?.page?.type || payload?.type;
  if (detectedType && ['objective', 'definition', 'code', 'summary', 'introduction'].includes(detectedType)) {
    const defaultCodes: Record<string, string> = {
      introduction: 'I1',
      definition: 'D1',
      code: 'C1',
      summary: 'S1',
      objective: 'O1',
    };
    const version = detectedType === 'objective'
      ? (defaultVersion === 'O2' ? 'O2' : 'O1')
      : (detectedType === defaultType && defaultVersion !== 'v1' ? defaultVersion : defaultCodes[detectedType] || 'v1');
    return { type: detectedType as TutorialPageContentType, version };
  }
  return { type: defaultType, version: defaultVersion };
}

function getPreviewResetKey(id: string, type: string, version: string, payload: unknown): string {
  try {
    return `${id}:${type}:${version}:${JSON.stringify(payload)}`;
  } catch {
    return `${id}:${type}:${version}`;
  }
}

function renderBlockContent(
  blockInfo: {
    id: string;
    type: TutorialPageContentType;
    version?: string;
    versionCode?: string;
    payload: any;
    expectedTimeSec?: number;
  },
  theme: BrandTutorialTheme
) {
  const payload = blockInfo.payload;
  if (!payload) return null;

  const rawVersion = blockInfo.versionCode || blockInfo.version || 'v1';

  const { type: effectiveType, version: effectiveVersion } = getEffectiveBlockInfo(
    blockInfo.type,
    rawVersion,
    payload
  );

  try {
    const resetKey = getPreviewResetKey(blockInfo.id, effectiveType, effectiveVersion, payload);

    // If payload is a rich S1 revision table summary, render TutorialSummaryContent.
    if (effectiveType === 'summary' && (payload.revisionTable || payload.summary)) {
      return (
        <PreviewErrorBoundary resetKey={resetKey}>
          <TutorialSummaryContent
            payload={payload as TutorialSummaryPayload}
            theme={theme}
          />
        </PreviewErrorBoundary>
      );
    }

    // Canonical TutorialBlockRenderer for all blocks.
    const tutorialBlock = toTutorialBlock({
      id: blockInfo.id,
      type: effectiveType,
      version: effectiveVersion,
      versionCode: effectiveVersion,
      title: '',
      payload,
      payloadFormat: 'legacy',
      sourceFormat: 'json',
      sourceContent: '',
      expectedTimeSec: blockInfo.expectedTimeSec,
    });

    return (
      <PreviewErrorBoundary resetKey={resetKey}>
        <TutorialBlockRenderer
          block={tutorialBlock}
          theme={theme}
          depth={0}
        />
      </PreviewErrorBoundary>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown preview error';
    return (
      <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        This block cannot be previewed until its content is corrected: {message}
      </div>
    );
  }
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
            {renderBlockContent(
              {
                id: 'preview',
                type: activeBlockType,
                version: activeBlockVersion,
                versionCode: activeBlockVersion,
                payload: activeBlockPreview,
              },
              theme
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
                  <div data-tutorial-block-type={instance.type}>
                    {renderBlockContent(instance, theme)}
                  </div>
                </div>
              ))}
            </>
          )
        )}
      </div>
    </section>
  );
}
