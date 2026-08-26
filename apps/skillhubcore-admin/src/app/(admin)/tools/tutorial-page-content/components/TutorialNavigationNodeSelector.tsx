/**
 * Tutorial Navigation Node Selector Component
 * 
 * Phase 1: Navigation Identity Integration
 * Provides human-readable navigation node selection within selected subtopic
 * Maps display names to navigationNodeId for tutorial section identity
 */

interface NavigationNode {
  id: string;        // navigationNodeId (e.g., 'what-is-java')
  name: string;      // Display name (e.g., 'What is Java?')
  type: string;      // 'page' or 'group'
}

interface TutorialNavigationNodeSelectorProps {
  // Available navigation nodes for current subtopic
  navigationNodes: NavigationNode[];
  
  // Current selection
  navigationNodeId: string;
  
  // Change handler
  onNavigationNodeChange: (navigationNodeId: string) => void;
  
  // Disabled state
  disabled?: boolean;
}

export function TutorialNavigationNodeSelector({
  navigationNodes,
  navigationNodeId,
  onNavigationNodeChange,
  disabled = false,
}: TutorialNavigationNodeSelectorProps) {
  // Filter to show only page nodes (not groups)
  const pageNodes = navigationNodes.filter(node => node.type === 'page');
  
  return (
    <div className="flex-1 min-w-[170px]">
      <label 
        htmlFor="select-navigation-node" 
        className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
      >
        Navigation Node
      </label>
      <select
        id="select-navigation-node"
        disabled={disabled || pageNodes.length === 0}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
        value={navigationNodeId}
        onChange={(event) => onNavigationNodeChange(event.target.value)}
      >
        <option value="">Select Page</option>
        {pageNodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.name}
          </option>
        ))}
      </select>
    </div>
  );
}
