/**
 * Tutorial AI Context Contracts
 * 
 * Defines the deterministic context structure provided to AI
 * for generating tutorial content.
 * 
 * CRITICAL ARCHITECTURE RULES:
 * 
 * 1. AI receives this context but does NOT generate:
 *    - domainId, subjectId, topicId, subtopicId (system hierarchy)
 *    - blockId (system generates UUID)
 *    - version (system knows from context)
 *    - brand, theme (runtime resolution)
 *    - schemaVersion, metadata (canonical layer)
 * 
 * 2. AI outputs ONLY author content ({ page: {...} })
 * 
 * 3. System wraps AI output in canonical structure
 * 
 * 4. This context is derived from existing Composer Selection,
 *    not a replacement hierarchy model
 */

/**
 * Hierarchy Context
 * System-controlled hierarchy information provided to AI
 * 
 * Source: CascadingSelect Selection interface
 * Flow: User selects in Composer → Selection → buildAIContext → AI
 */
export interface TutorialAIHierarchyContext {
  domainId: string;
  domainName: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  subtopicId: string;
  subtopicName: string;
}

/**
 * Block Context
 * Specifies which block type and version AI should generate
 * 
 * Generic to support all block types:
 * - Definition D1-D6
 * - Code C1-C10
 * - Summary S1-S6
 * - etc.
 */
export interface TutorialAIBlockContext<
  TType extends string,
  TVersion extends string,
> {
  type: TType;
  version: TVersion;
}

/**
 * Output Format Specification
 * Tells AI the expected output structure
 * 
 * For Definition D1:
 * - format: 'json'
 * - rootKey: 'page'
 * 
 * AI must return: { "page": {...} }
 * AI must NOT return: { "type": "definition", "version": "D1", ... }
 */
export interface TutorialAIOutputFormat {
  format: 'json';
  rootKey: 'page';
}

/**
 * Definition D1 AI Input Context
 * Complete context for generating Definition D1 content
 * 
 * This is the deterministic input provided to AI.
 * System constructs this from existing Composer Selection.
 * 
 * Example for "What Is a Variable?" (Python):
 * {
 *   context: {
 *     domainId: "domain-001",
 *     domainName: "Full Stack Development",
 *     subjectId: "subject-001",
 *     subjectName: "Backend Development",
 *     topicId: "topic-001",
 *     topicName: "Python",
 *     subtopicId: "subtopic-001",
 *     subtopicName: "What Is a Variable?"
 *   },
 *   block: {
 *     type: "definition",
 *     version: "D1"
 *   },
 *   output: {
 *     format: "json",
 *     rootKey: "page"
 *   }
 * }
 */
export interface DefinitionD1AIInputContext {
  context: TutorialAIHierarchyContext;
  block: TutorialAIBlockContext<'definition', 'D1'>;
  output: TutorialAIOutputFormat;
}

/**
 * Code C1 AI Input Context
 * Complete context for generating Code C1 content
 * 
 * This is the deterministic input provided to AI.
 * System constructs this from existing Composer Selection.
 * 
 * Example for "Hello World" (Python):
 * {
 *   context: {
 *     domainId: "domain-001",
 *     domainName: "Full Stack Development",
 *     subjectId: "subject-001",
 *     subjectName: "Backend Development",
 *     topicId: "topic-001",
 *     topicName: "Python",
 *     subtopicId: "subtopic-001",
 *     subtopicName: "Hello World"
 *   },
 *   block: {
 *     type: "code",
 *     version: "C1"
 *   },
 *   output: {
 *     format: "json",
 *     rootKey: "page"
 *   }
 * }
 */
export interface CodeC1AIInputContext {
  context: TutorialAIHierarchyContext;
  block: TutorialAIBlockContext<'code', 'C1'>;
  output: TutorialAIOutputFormat;
}
