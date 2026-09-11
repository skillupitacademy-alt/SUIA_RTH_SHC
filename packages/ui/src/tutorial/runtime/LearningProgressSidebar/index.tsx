/**
 * Learning Progress Sidebar (RSSB) - Macro 4
 * 
 * Universal right sidebar for displaying ILS learning progress data.
 * Passive consumer of useILS() hook - no separate learning state system.
 * 
 * ARCHITECTURE:
 * ```
 * Tutorial Page
 *      ↓
 * ILSProvider
 *      ↓
 *   useILS()
 *      ↓
 *     RSSB
 * ```
 * 
 * DATA CONTRACT:
 * - Consumes overallProgress: ILSOverallProgress (page-level metrics)
 * - Consumes activeBlockProgress: ILSActiveBlockProgress (block-level metrics)
 * - NO separate RSSB API
 * - NO RSSB persistence
 * - NO block selector state (follows ActiveBlockContext automatically)
 * 
 * VISUAL AUTHORITY:
 * - 100% structural/visual parity with ILS_UI_UX/ prototype
 * - Overall Progress → brand.primaryColor
 * - Lifecycle → brand.secondaryColor
 * - Engagement → #ff7300 FIXED
 * - Time Analysis → #0091d5 FIXED
 */

export { LearningProgressSidebar } from './LearningProgressSidebar';
export type { LearningProgressSidebarProps } from './LearningProgressSidebar';
