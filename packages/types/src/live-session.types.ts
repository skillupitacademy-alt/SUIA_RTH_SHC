export type LiveSessionRequestStatus = 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled';

export interface LiveSessionRequestRecord {
  id: string;
  studentId: string;
  subtopicId: string;
  doubtText: string | null;
  status: LiveSessionRequestStatus;
  facultyId: string | null;
  meetingLink: string | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
  cancelledReason: string | null;
  deletedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiveSessionRequestCreateInput {
  studentId: string;
  subtopicId: string;
  doubtText?: string | null;
}

export interface LiveSessionRequestUpdateInput {
  status?: LiveSessionRequestStatus;
  facultyId?: string | null;
  meetingLink?: string | null;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  cancelledReason?: string | null;
}

export interface LiveSessionRequestFilters {
  status?: LiveSessionRequestStatus;
  subtopicId?: string;
}

