'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  Network,
} from 'lucide-react';

import type { TutorialNavigationNode, TutorialNavigationTree, TutorialNodeStatus } from '@quiz/types';

interface TutorialLeftSidebarProps {
  tree: TutorialNavigationTree;
  activeUrl?: string;
  activeNavigationNodeId?: string; // Phase 2A: Canonical page identity
  completedUrls?: Set<string>;
  onNavigate?: (url: string, node: TutorialNavigationNode) => void;
  
  // Phase 2A: Current page progress from ILS (optional - for future R/Y/G mapping)
  // When undefined, LSNB uses existing completion-based status display
  currentPageProgress?: {
    progressPercentage: number;
    status: 'not_started' | 'in_progress' | 'completed';
  } | null;
}

/**
 * Phase 2A: Collapsed-by-default navigation
 * 
 * BEHAVIOR:
 * - Collapsed by default (no nodes expanded initially)
 * - Only expands ancestor path of current page
 * - Ignores node.expanded flag (server-driven expansion disabled)
 * - Current page remains discoverable
 * 
 * IDENTITY:
 * - Prefers activeNavigationNodeId (canonical) over activeUrl
 * - Falls back to URL matching for backward compatibility
 */
function collectInitialExpanded(
  nodes: TutorialNavigationNode[], 
  activeUrl?: string,
  activeNavigationNodeId?: string
) {
  const expanded = new Set<string>();

  function walk(node: TutorialNavigationNode): boolean {
    const children = node.children ?? [];
    const hasActiveChild = children.some((child) => walk(child));
    
    // Check if this node is the current page
    const isActiveById = Boolean(activeNavigationNodeId && node.id === activeNavigationNodeId);
    const isActiveByUrl = Boolean(activeUrl && node.url === activeUrl);
    const isActive = isActiveById || isActiveByUrl;

    // Phase 2A: ONLY expand if this node contains the active page
    // DO NOT expand based on node.expanded flag
    if (hasActiveChild) {
      expanded.add(node.id);
    }

    return isActive || hasActiveChild;
  }

  nodes.forEach((node) => walk(node));
  return expanded;
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

/**
 * Phase 2B: Map canonical ILS/RSSB progress percentage to R/Y/G color
 * 
 * THRESHOLDS:
 * - null/undefined → null (no color override, use existing status)
 * - 0-49% → 'red'
 * - 50-99% → 'yellow'
 * - 100% → 'green'
 * 
 * USAGE:
 * - ONLY for current page (identified by activeNavigationNodeId)
 * - Consumes existing canonical progress from ILS/RSSB
 * - Does NOT calculate completion itself
 * - revisionCount does NOT affect color
 */
function getPageProgressColor(
  progressPercentage: number | null | undefined
): 'red' | 'yellow' | 'green' | null {
  if (progressPercentage == null) return null;
  if (progressPercentage >= 100) return 'green';
  if (progressPercentage >= 50) return 'yellow';
  return 'red';
}

function isNodeCompleted(node: TutorialNavigationNode, completedUrls?: Set<string>) {
  return node.status === 'completed' || Boolean(node.url && completedUrls?.has(node.url));
}

function hasActiveIncompleteChild(node: TutorialNavigationNode, activeUrl?: string, completedUrls?: Set<string>): boolean {
  const children = node.children ?? [];

  return children.some((child) => {
    const childIsActiveIncomplete = Boolean(child.url && child.url === activeUrl && !isNodeCompleted(child, completedUrls));
    return childIsActiveIncomplete || hasActiveIncompleteChild(child, activeUrl, completedUrls);
  });
}

function getEffectiveStatus(node: TutorialNavigationNode, activeUrl?: string, completedUrls?: Set<string>): TutorialNodeStatus {
  if (isNodeCompleted(node, completedUrls)) {
    return 'completed';
  }

  const isCurrentLesson = Boolean(node.url && node.url === activeUrl);
  const containsCurrentIncompleteLesson = hasActiveIncompleteChild(node, activeUrl, completedUrls);

  if (isCurrentLesson || containsCurrentIncompleteLesson) {
    return 'in-progress';
  }

  return 'not-started';
}

function NodeIcon({ icon, level }: { icon?: string; level: number }) {
  const className = 'h-[15px] w-[15px]';

  if (icon === 'javascript') {
    return <span className="flex h-[22px] w-[22px] items-center justify-center rounded bg-[#f7df1e] text-[10px] font-black text-[#111827]">JS</span>;
  }

  if (icon === 'book') {
    return <BookOpen className={className} />;
  }

  if (icon === 'branch') {
    return <GitBranch className={className} />;
  }

  if (icon === 'sitemap') {
    return <Network className={className} />;
  }

  if (icon === 'file' || level >= 3) {
    return <FileText className={className} />;
  }

  if (level === 2) {
    return <FolderOpen className={className} />;
  }

  return <Folder className={className} />;
}

/**
 * Phase 2B: R/Y/G visual indicator for page-level completion
 * 
 * BEHAVIOR:
 * - When progressColor is provided: render R/Y/G filled circle (current page only)
 * - When progressColor is null: use existing status-based display (all other pages)
 * 
 * R/Y/G MAPPING (current page only):
 * - 'red': 0-49% progress
 * - 'yellow': 50-99% progress
 * - 'green': 100% progress
 * 
 * PRESERVATION:
 * - Non-current pages continue using existing status marks
 * - Selected state (activeBackground/border) remains independent of R/Y/G
 */
function StatusMark({ 
  status, 
  colors, 
  progressColor 
}: { 
  status: TutorialNodeStatus; 
  colors: TutorialNavigationTree['theme'];
  progressColor?: 'red' | 'yellow' | 'green' | null;
}) {
  // Phase 2B: R/Y/G override for current page
  if (progressColor) {
    const colorMap = {
      red: '#ef4444',     // Tailwind red-500
      yellow: '#eab308',  // Tailwind yellow-500
      green: '#22c55e',   // Tailwind green-500
    };
    
    const labelMap = {
      red: 'Progress: 0-49%',
      yellow: 'Progress: 50-99%',
      green: 'Progress: 100%',
    };
    
    return (
      <span 
        className="h-[18px] w-[18px] rounded-full" 
        style={{ backgroundColor: colorMap[progressColor] }} 
        title={labelMap[progressColor]} 
        aria-label={labelMap[progressColor]} 
      />
    );
  }
  
  // Existing status-based display (all other pages)
  if (status === 'completed') {
    return (
      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-white" style={{ backgroundColor: colors.completed }} title="Completed" aria-label="Completed">
        <Check className="h-[11px] w-[11px] stroke-[3]" />
      </span>
    );
  }

  if (status === 'in-progress') {
    return <span className="h-[18px] w-[18px] rounded-full border-[4px] bg-white" style={{ borderColor: colors.secondary }} title="In progress" aria-label="In progress" />;
  }

  return <span className="h-[18px] w-[18px] rounded-full border-2 border-[#7890ad] bg-white" title="Not started" aria-label="Not started" />;
}

function TreeNode({
  node,
  level,
  activeUrl,
  activeNavigationNodeId,
  completedUrls,
  expanded,
  setExpanded,
  colors,
  onNavigate,
  currentPageProgress,
}: {
  node: TutorialNavigationNode;
  level: number;
  activeUrl?: string;
  activeNavigationNodeId?: string;
  completedUrls?: Set<string>;
  expanded: Set<string>;
  setExpanded: (next: Set<string>) => void;
  colors: TutorialNavigationTree['theme'];
  onNavigate?: (url: string, node: TutorialNavigationNode) => void;
  currentPageProgress?: {
    progressPercentage: number;
    status: 'not_started' | 'in_progress' | 'completed';
  } | null;
}) {
  const children = node.children ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(node.id);
  
  // Phase 2A: Prefer canonical navigationNodeId over URL matching
  const isActiveById = Boolean(activeNavigationNodeId && node.id === activeNavigationNodeId);
  const isActiveByUrl = Boolean(activeUrl && node.url === activeUrl);
  const isActive = isActiveById || isActiveByUrl;
  
  const effectiveStatus = getEffectiveStatus(node, activeUrl, completedUrls);
  const childIndent = Math.max(10, 22 - Math.max(0, level - 1) * 3);
  
  // Phase 2B: R/Y/G color for current page only
  // - Only applies when this node is the current page (isActive)
  // - Consumes canonical ILS/RSSB progress from currentPageProgress
  // - null/undefined → use existing status display
  const progressColor = isActive && currentPageProgress 
    ? getPageProgressColor(currentPageProgress.progressPercentage) 
    : null;

  const toggle = () => {
    if (!hasChildren) {
      return;
    }

    const next = new Set(expanded);
    if (next.has(node.id)) {
      next.delete(node.id);
    } else {
      next.add(node.id);
    }
    setExpanded(next);
  };

  const handleRowClick = () => {
    if (node.url) {
      onNavigate?.(node.url, node);
      return;
    }
    toggle();
  };

  return (
    <div className="relative my-0.5 min-w-0">
      <button
        type="button"
        onClick={handleRowClick}
        className="grid min-h-12 w-full min-w-0 cursor-pointer grid-cols-[32px_34px_minmax(0,1fr)_28px] items-center gap-x-1.5 rounded-[11px] border border-transparent bg-transparent px-2 py-[5px] text-left transition-colors hover:bg-[#f5f7fa] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#d9e0ea]"
        style={{
          backgroundColor: isActive ? colors.activeBackground : undefined,
          borderColor: isActive ? '#d9e0ea' : undefined,
          color: isActive ? colors.secondary : '#071f63',
        }}
        aria-current={isActive ? 'page' : undefined}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        {hasChildren ? (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[7px] text-[#071f63] transition-colors hover:bg-[#edf2f8]"
            aria-hidden="true"
          >
            <ChevronRight className={`h-[16px] w-[16px] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </span>
        ) : (
          <span className="h-8 w-8" />
        )}

        <span className="flex h-[34px] w-[34px] items-center justify-center text-[#52729b]" style={{ color: isActive ? colors.secondary : undefined }}>
          <NodeIcon icon={node.icon} level={level} />
        </span>

        <span className="min-w-0 break-words text-[14px] font-semibold leading-snug" style={{ color: isActive ? colors.secondary : '#071f63', fontWeight: isActive ? 700 : 600 }}>
          {node.name}
        </span>

        <span className="flex h-7 w-7 items-center justify-center">
          <StatusMark status={effectiveStatus} colors={colors} progressColor={progressColor} />
        </span>
      </button>

      {hasChildren && isExpanded ? (
        <div className="relative min-w-0 pb-0.5" style={{ paddingLeft: childIndent }}>
          <span className="absolute bottom-0 top-0 w-px bg-[#d5dfeb]" style={{ left: 18 }} aria-hidden="true" />
          {children.map((child) => (
            <div key={child.id} className="relative min-w-0">
              <span className="absolute top-[25px] h-px w-2.5 bg-[#d5dfeb]" style={{ left: -4 }} aria-hidden="true" />
              <TreeNode 
                node={child} 
                level={level + 1} 
                activeUrl={activeUrl} 
                activeNavigationNodeId={activeNavigationNodeId}
                completedUrls={completedUrls} 
                expanded={expanded} 
                setExpanded={setExpanded} 
                colors={colors} 
                onNavigate={onNavigate}
                currentPageProgress={currentPageProgress}
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TutorialLeftSidebar({ tree, activeUrl, activeNavigationNodeId, completedUrls, onNavigate, currentPageProgress }: TutorialLeftSidebarProps) {
  const [expanded, setExpanded] = useState(() => collectInitialExpanded(tree.topics, activeUrl, activeNavigationNodeId));
  const progress = clampProgress(tree.progress.percentage);
  
  // Phase 2A Remediation: Make ancestor expansion reactive to navigation changes
  // When the current page changes, ensure its ancestor path becomes visible
  // Preserve user-controlled manual expansion for unrelated branches
  useEffect(() => {
    const requiredExpanded = collectInitialExpanded(tree.topics, activeUrl, activeNavigationNodeId);
    
    setExpanded((currentExpanded) => {
      // Merge: keep existing user expansions + ensure required ancestors are visible
      const merged = new Set(currentExpanded);
      
      // Add all required ancestors for the current page
      requiredExpanded.forEach((nodeId) => {
        merged.add(nodeId);
      });
      
      // Return merged set (preserves manual expansions + adds required ancestors)
      return merged;
    });
  }, [activeNavigationNodeId, activeUrl, tree.topics]);
  
  // Phase 2B: R/Y/G visualization implemented
  // Maps currentPageProgress.progressPercentage to color for current page only
  // 0-49% → RED, 50-99% → YELLOW, 100% → GREEN
  // Non-current pages continue using existing completion-based status

  return (
    <aside
      aria-label="Tutorial navigation"
      className="sticky top-[71px] z-10 flex h-[calc(100dvh-71px)] max-h-[calc(100dvh-71px)] w-[404px] shrink-0 flex-col overflow-hidden border-r border-[#e5eaf1] bg-white text-[#071f63] shadow-sm"
      style={{
        top: '71px',
        height: 'calc(100dvh - 71px)',
        maxHeight: 'calc(100dvh - 71px)',
      }}
    >
      <header className="flex shrink-0 items-center gap-4 px-6 pb-5 pt-8">
        <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] text-[20px] font-extrabold text-white" style={{ backgroundColor: tree.theme.primary }}>
          {tree.brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tree.brand.logoUrl} alt={`${tree.brand.name} logo`} className="h-full w-full object-contain" />
          ) : (
            tree.brand.shortName
          )}
        </div>
        <div className="min-w-0">
          <h1 className="m-0 text-[22px] font-extrabold leading-[1.15] tracking-normal text-[#071f63]">{tree.brand.name}</h1>
          <p className="m-0 mt-[7px] text-[13px] font-normal leading-snug text-[#45658f]">{tree.brand.tagline}</p>
        </div>
      </header>

      <section className="shrink-0 px-6 pb-5 pt-1" aria-label="Current subject">
        <div className="flex min-h-12 items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white" style={{ backgroundColor: tree.theme.secondary }}>
            <Code2 className="h-5 w-5" />
          </span>
          <span className="min-w-0 truncate text-[19px] font-bold leading-tight text-[#071f63]">{tree.subject.name}</span>
        </div>
      </section>

      <section className="shrink-0 px-6 pb-[22px]" aria-label="Tutorial progress">
        <div className="mb-[9px] flex items-center justify-between">
          <span className="text-[14px] font-medium leading-snug text-[#071f63]">Your Progress</span>
          <span className="text-[14px] font-bold leading-snug" style={{ color: tree.theme.primary }}>
            {progress}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e4e8ed]" role="progressbar" aria-label="Tutorial progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${progress}%`, backgroundColor: tree.theme.primary }} />
        </div>
      </section>

      <nav className="min-h-0 flex-1 overflow-hidden pb-5 pl-3.5 pr-6" aria-label="Tutorial curriculum">
        <div className="tutorial-left-sidebar-scroll h-full overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="min-w-0 pb-[80px] pt-1" style={{ paddingBottom: '80px' }}>
            {tree.topics.map((node) => (
              <TreeNode 
                key={node.id} 
                node={node} 
                level={0} 
                activeUrl={activeUrl} 
                activeNavigationNodeId={activeNavigationNodeId}
                completedUrls={completedUrls} 
                expanded={expanded} 
                setExpanded={setExpanded} 
                colors={tree.theme} 
                onNavigate={onNavigate}
                currentPageProgress={currentPageProgress}
              />
            ))}
          </div>
        </div>
      </nav>

      <style jsx global>{`
        .tutorial-left-sidebar-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .tutorial-left-sidebar-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </aside>
  );
}
