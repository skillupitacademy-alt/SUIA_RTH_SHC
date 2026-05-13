CREATE INDEX IF NOT EXISTS idx_sections_delivery
  ON tutorial_sections (subtopic_id, difficulty, status, order_index);

CREATE INDEX IF NOT EXISTS idx_sections_delivery_by_type
  ON tutorial_sections (subtopic_id, difficulty, section_type, status);
