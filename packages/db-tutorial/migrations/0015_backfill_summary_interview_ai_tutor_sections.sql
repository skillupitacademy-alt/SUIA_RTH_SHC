WITH architecture_map(section_type, architecture_name) AS (
  VALUES
    ('notes', 'Beginner-Friendly'),
    ('layman', 'Beginner-Friendly'),
    ('visual', 'Visual Learner'),
    ('real_life', 'Career Switcher Practical'),
    ('technical', 'Expert Foundation Builder'),
    ('code', 'Expert Foundation Builder'),
    ('practice', 'Quick Reference'),
    ('assignment', 'Career Switcher Practical'),
    ('project', 'Career Switcher Practical'),
    ('quiz', 'Quick Reference'),
    ('summary', 'Quick Reference'),
    ('interview', 'Career Switcher Practical'),
    ('ai_tutor', 'Beginner-Friendly')
)
UPDATE "tutorial_sections" ts
SET "educational_architecture_id" = ea.id,
    "updated_at" = now()
FROM architecture_map am
JOIN "educational_architectures" ea ON ea.name = am.architecture_name
WHERE ts."section_type"::text = am.section_type
  AND ts."educational_architecture_id" IS NULL;--> statement-breakpoint

WITH ui_map(section_type, ui_name) AS (
  VALUES
    ('notes', 'Standard Interactive'),
    ('layman', 'Standard Interactive'),
    ('visual', 'Rich Immersive'),
    ('real_life', 'Standard Interactive'),
    ('technical', 'Standard Interactive'),
    ('code', 'Standard Interactive'),
    ('practice', 'Standard Interactive'),
    ('assignment', 'Standard Interactive'),
    ('project', 'Rich Immersive'),
    ('quiz', 'Standard Interactive'),
    ('summary', 'Accessibility First'),
    ('interview', 'Standard Interactive'),
    ('ai_tutor', 'Standard Interactive')
)
UPDATE "tutorial_sections" ts
SET "ui_architecture_id" = ua.id,
    "updated_at" = now()
FROM ui_map um
JOIN "ui_architectures" ua ON ua.name = um.ui_name
WHERE ts."section_type"::text = um.section_type
  AND ts."ui_architecture_id" IS NULL;--> statement-breakpoint

UPDATE "tutorial_sections" ts
SET "prompt_template_id" = pt.id,
    "updated_at" = now()
FROM "prompt_templates" pt
WHERE ts."section_type" = 'layman'
  AND pt."section_type" = 'layman'
  AND pt.name = 'Layman Master Template v1'
  AND ts."prompt_template_id" IS NULL;--> statement-breakpoint

WITH section_groups AS (
  SELECT DISTINCT ON (subtopic_id, difficulty, brand_id)
    subtopic_id,
    difficulty,
    brand_id,
    brand_visibility,
    language,
    CASE
      WHEN bool_or(status = 'approved') OVER w THEN 'approved'::section_status
      WHEN bool_or(status = 'deployed') OVER w THEN 'deployed'::section_status
      ELSE 'draft'::section_status
    END AS resolved_status
  FROM "tutorial_sections"
  WHERE "deleted_at" IS NULL
  WINDOW w AS (PARTITION BY subtopic_id, difficulty, brand_id)
  ORDER BY subtopic_id, difficulty, brand_id
),
defaults AS (
  SELECT
    sg.*,
    ea_beginner.id AS beginner_arch_id,
    ea_quick.id AS quick_arch_id,
    ea_career.id AS career_arch_id,
    ua_standard.id AS standard_ui_id,
    ua_access.id AS accessibility_ui_id
  FROM section_groups sg
  LEFT JOIN "educational_architectures" ea_beginner ON ea_beginner.name = 'Beginner-Friendly'
  LEFT JOIN "educational_architectures" ea_quick ON ea_quick.name = 'Quick Reference'
  LEFT JOIN "educational_architectures" ea_career ON ea_career.name = 'Career Switcher Practical'
  LEFT JOIN "ui_architectures" ua_standard ON ua_standard.name = 'Standard Interactive'
  LEFT JOIN "ui_architectures" ua_access ON ua_access.name = 'Accessibility First'
)
INSERT INTO "tutorial_sections" (
  "subtopic_id",
  "section_type",
  "difficulty",
  "order_index",
  "content",
  "version",
  "language",
  "status",
  "educational_architecture_id",
  "ui_architecture_id",
  "brand_id",
  "brand_visibility",
  "created_at",
  "updated_at"
)
SELECT
  subtopic_id,
  section_type::section_type,
  difficulty,
  order_index,
  content,
  1,
  language,
  resolved_status,
  educational_architecture_id,
  ui_architecture_id,
  brand_id,
  brand_visibility,
  now(),
  now()
FROM (
  SELECT
    subtopic_id,
    difficulty,
    brand_id,
    brand_visibility,
    language,
    resolved_status,
    'summary' AS section_type,
    10 AS order_index,
    quick_arch_id AS educational_architecture_id,
    accessibility_ui_id AS ui_architecture_id,
    jsonb_build_object(
      'metadata', jsonb_build_object('section_type', 'summary', 'template_version', '1.0'),
      'title', 'Summary',
      'description', 'Consolidated recap, key takeaways, revision checklist, and next learning step.',
      'mastery_recap_card', jsonb_build_object('title', 'Mastery recap', 'items', jsonb_build_array()),
      'key_takeaway_grid', jsonb_build_object('items', jsonb_build_array()),
      'revision_checklist', jsonb_build_object('items', jsonb_build_array()),
      'next_step_panel', jsonb_build_object('recommendations', jsonb_build_array())
    ) AS content
  FROM defaults
  UNION ALL
  SELECT
    subtopic_id,
    difficulty,
    brand_id,
    brand_visibility,
    language,
    resolved_status,
    'interview' AS section_type,
    11 AS order_index,
    career_arch_id AS educational_architecture_id,
    standard_ui_id AS ui_architecture_id,
    jsonb_build_object(
      'metadata', jsonb_build_object('section_type', 'interview', 'template_version', '1.0'),
      'title', 'Interview Prep',
      'description', 'Interview questions, answer frameworks, and mock interview flow for this subtopic.',
      'interview_intro_card', jsonb_build_object('title', 'Interview focus'),
      'question_bank_panel', jsonb_build_object('questions', jsonb_build_array()),
      'answer_framework_card', jsonb_build_object('frameworks', jsonb_build_array()),
      'mock_interview_flow', jsonb_build_object('steps', jsonb_build_array())
    ) AS content
  FROM defaults
  UNION ALL
  SELECT
    subtopic_id,
    difficulty,
    brand_id,
    brand_visibility,
    language,
    resolved_status,
    'ai_tutor' AS section_type,
    12 AS order_index,
    beginner_arch_id AS educational_architecture_id,
    standard_ui_id AS ui_architecture_id,
    jsonb_build_object(
      'metadata', jsonb_build_object('section_type', 'ai_tutor', 'template_version', '1.0'),
      'greeting', 'Ask a focused question about this subtopic and I will guide you step by step.',
      'qa_pairs', jsonb_build_array(),
      'tutor_prompt_card', jsonb_build_object('prompts', jsonb_build_array('Explain this simply', 'Give me an example', 'Quiz me')),
      'misconception_detector', jsonb_build_object('checks', jsonb_build_array()),
      'adaptive_hint_panel', jsonb_build_object('hints', jsonb_build_array())
    ) AS content
  FROM defaults
) rows
ON CONFLICT ("subtopic_id", "section_type", "difficulty", "brand_id") DO NOTHING;
