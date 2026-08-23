/**
 * Tutorial Block Selector Component
 * 
 * Manages selection of:
 * - Block Type (Definition/Code/Summary)
 * - Version (e.g., D1, C1, S1)
 * - Source Format (JSON/Markdown)
 */

import type { TutorialPageContentType } from '@quiz/types';
import type { SourceFormat } from '../document/sourceParser';
import type { BlockRegistryEntry, BlockVersionRegistryEntry } from '../registry';

interface TutorialBlockSelectorProps {
  // Available options
  blockTypes: BlockRegistryEntry[];
  availableVersions: BlockVersionRegistryEntry[];
  
  // Current selections
  blockType: TutorialPageContentType;
  versionId: string;
  sourceFormat: SourceFormat;
  
  // Change handlers
  onBlockTypeChange: (blockType: TutorialPageContentType) => void;
  onVersionChange: (versionId: string) => void;
  onSourceFormatChange: (format: SourceFormat) => void;
}

export function TutorialBlockSelector({
  blockTypes,
  availableVersions,
  blockType,
  versionId,
  sourceFormat,
  onBlockTypeChange,
  onVersionChange,
  onSourceFormatChange,
}: TutorialBlockSelectorProps) {
  return (
    <>
      {/* Block Type */}
      <div className="w-[140px] min-w-[130px]">
        <label htmlFor="select-block" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          Block Type
        </label>
        <select
          id="select-block"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          value={blockType}
          onChange={(event) => onBlockTypeChange(event.target.value as TutorialPageContentType)}
        >
          {blockTypes.map((block) => (
            <option key={block.id} value={block.id}>{block.label}</option>
          ))}
        </select>
      </div>

      {/* Version */}
      <div className="w-[180px] min-w-[150px]">
        <label htmlFor="select-version" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          Version Code
        </label>
        <select
          id="select-version"
          disabled={availableVersions.length === 0}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
          value={versionId}
          onChange={(event) => onVersionChange(event.target.value)}
        >
          {availableVersions.map((version) => (
            <option key={version.id} value={version.id}>{version.label}</option>
          ))}
        </select>
      </div>

      {/* Format */}
      <div className="w-[110px] min-w-[100px]">
        <label htmlFor="select-format" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          Format
        </label>
        <select
          id="select-format"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          value={sourceFormat}
          onChange={(event) => onSourceFormatChange(event.target.value as SourceFormat)}
        >
          <option value="json">JSON</option>
          <option value="markdown">Markdown</option>
        </select>
      </div>
    </>
  );
}
