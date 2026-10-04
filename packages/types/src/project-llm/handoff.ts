export type ExternalAiProvider = 'GEMINI' | 'CLAUDE' | 'CHATGPT' | 'OTHER' | 'UNKNOWN';
export type HandoffStatus =
  | 'NOT_STARTED'
  | 'PROMPT_COPIED'
  | 'SENT_TO_EXTERNAL_AI'
  | 'RESPONSE_RECEIVED'
  | 'GUI_REVIEW_PENDING'
  | 'GUI_APPROVED'
  | 'GUI_REJECTED'
  | 'NEEDS_CORRECTION';
export type GuiApprovalDecision = 'APPROVED' | 'REJECTED' | 'NEEDS_CORRECTION';

export interface ExternalAiHandoff {
  handoffId: string;
  requestId: string;
  briefId: string;
  provider: ExternalAiProvider;
  status: HandoffStatus;
  promptText: string;
  promptCopiedAt?: string;
  sentAt?: string;
  responseReceivedAt?: string;
  guiApproval?: {
    decision: GuiApprovalDecision;
    decidedAt: string;
    notes?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
