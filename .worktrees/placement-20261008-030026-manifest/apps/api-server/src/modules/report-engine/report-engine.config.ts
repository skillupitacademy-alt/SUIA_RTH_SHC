/**
 * Hierarchical Report Engine Configuration
 * Defines production safety limits and operational thresholds.
 */
export const REPORT_ENGINE_CONFIG = {
    // Safety Limits
    MAX_HIERARCHY_NODES: 50,         // Maximum total nodes (Domain + Subjects + Topics)
    MAX_TOTAL_PAGES_ESTIMATE: 250,   // Fail job if total estimated pages exceed this
    
    // Timeouts
    MERGE_TIMEOUT_MS: 60000,        // Timeout for PDF merging operation
    SEGMENT_RENDER_TIMEOUT_MS: 30000, // Timeout for rendering a single unit segment
    
    // Heuristics
    PAGES_PER_TOPIC: 12,            // High-fidelity topics are ~12 pages with appendix
    PAGES_PER_SUBJECT_SUMMARY: 1,   // Single page overview
    PAGES_PER_DOMAIN_OVERVIEW: 1,   // Single page landing
};
