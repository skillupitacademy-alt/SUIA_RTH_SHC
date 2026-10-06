-- Migration: Create approval_requests table for human approval workflow
-- Agent 09 (Human Approval) database schema

CREATE TABLE IF NOT EXISTS approval_requests (
    -- Primary identifier for the approval request
    request_id TEXT PRIMARY KEY,
    
    -- Placement manifest identifier
    manifest_id TEXT NOT NULL,
    
    -- SHA-256 hash of the manifest content (for tamper detection)
    manifest_hash TEXT NOT NULL,
    
    -- Candidate block identifier
    candidate_id TEXT NOT NULL,
    
    -- Timestamp when approval was requested
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Approval status: PENDING, APPROVED, REJECTED, TIMEOUT
    status TEXT NOT NULL DEFAULT 'PENDING' 
        CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'TIMEOUT')),
    
    -- Reviewer who approved/rejected (NULL while PENDING)
    reviewer TEXT,
    
    -- Timestamp when review was completed (NULL while PENDING)
    reviewed_at TIMESTAMP,
    
    -- Optional comments from reviewer
    comments TEXT
);

-- Index for querying by manifest
CREATE INDEX IF NOT EXISTS idx_approval_requests_manifest 
    ON approval_requests(manifest_id);

-- Index for querying by candidate
CREATE INDEX IF NOT EXISTS idx_approval_requests_candidate 
    ON approval_requests(candidate_id);

-- Index for querying pending requests
CREATE INDEX IF NOT EXISTS idx_approval_requests_status 
    ON approval_requests(status) 
    WHERE status = 'PENDING';

-- Index for querying by requested timestamp (for timeout processing)
CREATE INDEX IF NOT EXISTS idx_approval_requests_requested_at 
    ON approval_requests(requested_at);
