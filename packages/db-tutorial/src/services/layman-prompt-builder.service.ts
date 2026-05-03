/**
 * Layman Prompt Builder Service
 * Phase 2B Week 2 - Human-in-the-Loop AI Governance
 * --------------------------------------------------
 * Generates constitutional prompts for manual AI usage
 */

import { randomUUID } from 'crypto';
import { LaymanRepository } from '../repositories/layman.repository';
import { LaymanPromptIntegrityService } from './layman-prompt-integrity.service';
import { LaymanAuditService } from './layman-audit.service';
import type {
  PromptGenerationRequest,
  GeneratedPrompt,
  PromptTemplateVariables,
  PromptExportFormat,
} from '../types/layman-prompt.types';
import type { AuditContext } from './layman-audit.service';

/**
 * Prompt Builder Service Error
 */
export class PromptBuilderError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'PromptBuilderError';
  }
}

/**
 * Layman Prompt Builder Service
 * Generates constitutional prompts from seeded templates
 */
export class LaymanPromptBuilderService {
  constructor(
    private repository: LaymanRepository = new LaymanRepository(),
    private integrityService: LaymanPromptIntegrityService = new LaymanPromptIntegrityService(),
    private auditService: LaymanAuditService = new LaymanAuditService()
  ) {}

  /**
   * Generate constitutional prompt
   */
  async generatePrompt(
    request: PromptGenerationRequest,
    auditContext?: AuditContext
  ): Promise<GeneratedPrompt> {
    // Get prompt template
    const templateName = request.promptTemplateName || 'Layman Master Template v1';
    const template = await this.repository.getPromptTemplateByName(
      templateName,
      request.brandId as any
    );

    if (!template) {
      throw new PromptBuilderError(
        `Prompt template not found: ${templateName}`,
        'TEMPLATE_NOT_FOUND',
        404
      );
    }

    // Get educational architecture
    const educationalArchName = request.educationalArchitectureName || 'Beginner-Friendly';
    const educationalArch = await this.repository.getEducationalArchitecture(educationalArchName);

    // Build template variables
    const variables: PromptTemplateVariables = {
      topicName: request.topicName,
      subtopicName: request.subtopicName,
      difficulty: request.difficulty || 'beginner',
      learnerType: request.learnerType,
      educationalArchitecture: educationalArch?.name,
    };

    // Compile user prompt
    let compiledUserPrompt = template.userPromptTemplate;
    for (const [key, value] of Object.entries(variables)) {
      if (value) {
        compiledUserPrompt = compiledUserPrompt.replace(
          new RegExp(`{{${key}}}`, 'g'),
          value
        );
      }
    }

    // Generate full prompt
    const fullPrompt = `${template.systemPrompt}\n\n${compiledUserPrompt}`;

    // Create export formats
    const exportFormat = this.createExportFormat(template.systemPrompt, compiledUserPrompt);
    const copyableText = this.createCopyableText(template.systemPrompt, compiledUserPrompt);

    // Create generated prompt object
    const generatedPrompt: GeneratedPrompt = {
      id: randomUUID(),
      title: `${request.topicName} - Layman Section Prompt`,
      systemPrompt: template.systemPrompt,
      userPrompt: compiledUserPrompt,
      fullPrompt,
      exportFormat,
      copyableText,
      metadata: {
        templateName: template.name,
        templateVersion: template.version,
        topicName: request.topicName,
        subtopicName: request.subtopicName,
        difficulty: request.difficulty || 'beginner',
        brandId: request.brandId,
        educationalArchitecture: educationalArch?.name,
        generatedAt: new Date(),
        generatedBy: request.requestedBy,
      },
      governanceStatus: 'prompt_generated',
    };

    // Store in prompt history with integrity hash
    const promptHistoryId = await this.integrityService.storePromptHistory(
      generatedPrompt,
      {
        subtopicId: request.subtopicId,
        promptTemplateId: template.id,
        educationalArchitectureId: educationalArch?.id,
        generatedBy: request.requestedBy,
      }
    );

    // Update prompt ID to match history ID
    generatedPrompt.id = promptHistoryId;

    // Increment template usage
    await this.repository.incrementPromptTemplateUsage(template.id);

    // Audit log
    if (auditContext) {
      await this.auditService.logPromptGenerated(auditContext, promptHistoryId, {
        templateName: template.name,
        templateVersion: template.version,
        topicName: request.topicName,
        subtopicName: request.subtopicName,
      });
    }

    return generatedPrompt;
  }

  /**
   * Create export format for copying
   */
  private createExportFormat(systemPrompt: string, userPrompt: string): string {
    return `
═══════════════════════════════════════════════════════════
📋 CONSTITUTIONAL PROMPT FOR AI
═══════════════════════════════════════════════════════════

🎯 SYSTEM INSTRUCTIONS:
${systemPrompt}

───────────────────────────────────────────────────────────

📝 USER REQUEST:
${userPrompt}

───────────────────────────────────────────────────────────

⚠️  IMPORTANT INSTRUCTIONS FOR AI:
1. Follow the system instructions exactly
2. Generate content for ALL required sections:
   - Analogy
   - Beginner Breakdown
   - Mental Model
   - Use Case
   - FAQ (at least 3 Q&A pairs)
   - Summary
3. Use clear section headers
4. Keep language beginner-friendly
5. Avoid technical jargon without explanation

═══════════════════════════════════════════════════════════
`.trim();
  }

  /**
   * Create copyable text (plain format)
   */
  private createCopyableText(systemPrompt: string, userPrompt: string): string {
    return `SYSTEM:\n${systemPrompt}\n\nUSER:\n${userPrompt}`;
  }

  /**
   * Export prompt in different formats
   */
  async exportPrompt(
    promptId: string,
    format: 'plain' | 'markdown' | 'json' = 'plain',
    auditContext?: AuditContext
  ): Promise<PromptExportFormat> {
    // Track export
    await this.integrityService.trackPromptExport(promptId, format);

    // Audit log
    if (auditContext) {
      await this.auditService.logPromptExported(auditContext, promptId, format);
    }

    // In a real implementation, you'd fetch the prompt from storage
    // For now, return format instructions

    const instructions = `
📋 HOW TO USE THIS PROMPT:

1. COPY the entire prompt below
2. OPEN your preferred AI tool:
   - ChatGPT (https://chat.openai.com)
   - Claude (https://claude.ai)
   - Gemini (https://gemini.google.com)
3. PASTE the prompt into the AI chat
4. WAIT for the AI to generate the response
5. COPY the AI's complete response
6. RETURN to the application
7. PASTE the response in the "Ingest AI Response" section

⚠️  TIPS:
- Use the free version of any AI tool
- Copy the ENTIRE response including all sections
- If the AI doesn't generate all sections, ask it to complete them
- You can regenerate multiple times until satisfied
    `.trim();

    return {
      format,
      content: '', // Would contain the actual prompt
      instructions,
    };
  }

  /**
   * Get prompt generation statistics
   */
  async getPromptStatistics(userId: string): Promise<{
    totalGenerated: number;
    byTemplate: Record<string, number>;
    byBrand: Record<string, number>;
  }> {
    // Placeholder for statistics
    // In real implementation, query from prompt_generation_logs table
    return {
      totalGenerated: 0,
      byTemplate: {},
      byBrand: {},
    };
  }
}
