-- Database schema for certification_reviews table
-- Supports human certification workflow (Agent 15)

CREATE TABLE IF NOT EXISTS certification_reviews (
    certification_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    final_certification JSON NOT NULL,
    requested_at TIMESTAMP NOT NULL,
    decision TEXT NOT NULL CHECK(decision IN ('PENDING', 'CERTIFIED', 'REJECTED', 'TIMEOUT')) DEFAULT 'PENDING',
    reviewer TEXT,
    reviewed_at TIMESTAMP,
    comments TEXT,
    
    -- Indexes for query performance
    INDEX idx_run_id (run_id),
    INDEX idx_candidate_id (candidate_id),
    INDEX idx_decision (decision),
    INDEX idx_requested_at (requested_at)
);

-- Comments for documentation
COMMENT ON TABLE certification_reviews IS 'Tracks human certification review requests and decisions for final certification workflow';
COMMENT ON COLUMN certification_reviews.certification_id IS 'Unique certification request identifier';
COMMENT ON COLUMN certification_reviews.run_id IS 'Project AI run identifier';
COMMENT ON COLUMN certification_reviews.candidate_id IS 'Candidate block identifier';
COMMENT ON COLUMN certification_reviews.final_certification IS 'JSON blob of final certification data from Agent 14';
COMMENT ON COLUMN certification_reviews.requested_at IS 'Timestamp when certification was requested';
COMMENT ON COLUMN certification_reviews.decision IS 'Human decision: PENDING, CERTIFIED, REJECTED, or TIMEOUT';
COMMENT ON COLUMN certification_reviews.reviewer IS 'Username or identifier of reviewer who made decision';
COMMENT ON COLUMN certification_reviews.reviewed_at IS 'Timestamp when decision was made';
COMMENT ON COLUMN certification_reviews.comments IS 'Optional reviewer comments explaining decision';
